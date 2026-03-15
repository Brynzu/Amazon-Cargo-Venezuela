"use client";

import { useState, useEffect } from "react";
import { calculateTotalCost, CostBreakdown } from "@/lib/calculator";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { logisticsData, getUniqueStates, getCitiesByState, CourierOffice } from "@/lib/logistics";
import { createClient } from "@/utils/supabase/client";
import { ExternalLink, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { translations } from '@/lib/translations';
import toast from 'react-hot-toast';

type Item = { url: string; price: string; name?: string; image?: string; loading?: boolean; hasFetched?: boolean };

export function Calculator({ user, defaultLang = 'en' }: { user: any, defaultLang?: 'en' | 'es' }) {
  const [lang, setLang] = useState<'en' | 'es'>(defaultLang);
  useEffect(() => setLang(defaultLang), [defaultLang]);
  const [items, setItems] = useState<Item[]>([{ url: "", price: "", loading: false, hasFetched: false }]);

  // Logistics & Client Details
  const [clientName, setClientName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [postalCodeInput, setPostalCodeInput] = useState("");
  const [selectedState, setSelectedState] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const [selectedOfficeCode, setSelectedOfficeCode] = useState("");

  const [paymentMethod, setPaymentMethod] = useState("Zelle");
  const [file, setFile] = useState<File | null>(null);
  const [breakdown, setBreakdown] = useState<CostBreakdown | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [exchangeRate, setExchangeRate] = useState<number>(710.00);
  const [submittedOrderId, setSubmittedOrderId] = useState<string | null>(null);

  // Profile Data Auto-fill
  const [savedProfile, setSavedProfile] = useState<any>(null);

  // Computed Options
  const states = getUniqueStates();

  // Auto-select State and City if zip code matches perfectly
  useEffect(() => {
    if (postalCodeInput.trim().length >= 4) {
      const match = logisticsData.find(o => o.postalCode === postalCodeInput.trim());
      // Only auto-fill from zip code if the state/city are NOT already populated
      if (match && !selectedState && !selectedCity) {
        setSelectedState(match.state);
        setTimeout(() => {
          setSelectedCity(match.city);
        }, 500);
      }
    }
  }, [postalCodeInput, selectedState, selectedCity]);

  const validCitiesForState = selectedState ? getCitiesByState(selectedState) : [];

  // If a zip code is entered, filter the available cities to only those that match the zip code
  const cities = validCitiesForState.filter(city => {
    if (postalCodeInput.trim().length >= 3) {
      return logisticsData.some(o => o.state === selectedState && o.city === city && o.postalCode.startsWith(postalCodeInput.trim()));
    }
    return true;
  });

  let availableOffices = logisticsData.filter(o =>
    (!selectedState || o.state === selectedState) &&
    (!selectedCity || o.city === selectedCity)
  );

  // If user entered a postal code, sort matching offices to top
  if (postalCodeInput.trim().length > 2) {
    availableOffices = availableOffices.sort((a, b) => {
      const aMatch = a.postalCode.startsWith(postalCodeInput.trim()) ? 1 : 0;
      const bMatch = b.postalCode.startsWith(postalCodeInput.trim()) ? 1 : 0;
      return bMatch - aMatch;
    });
  }

  const selectedOfficeDetails = logisticsData.find(o => `${o.carrier}-${o.officeName}` === selectedOfficeCode);

  const supabase = createClient();

  useEffect(() => {
    async function fetchInitialData() {
      try {
        const { data, error } = await supabase.from('settings').select('exchange_rate').eq('id', 1).single();
        if (data && !error) {
          setExchangeRate(data.exchange_rate);
        }
      } catch (err) {
        console.error("Fetch rate error:", err);
      }

      if (user) {
        const { data } = await supabase.from('users').select('*').eq('id', user.id).single();
        if (data && (data.full_name || data.phone || data.zip_code)) {
          setSavedProfile(data);
        }
        if (data && data.preferred_language === 'es') {
          setLang('es');
        }
      }
    }
    fetchInitialData();
  }, [supabase, user]);

  const t = translations[lang];

  // Debounced Auto-Fetch for Amazon Metadata
  useEffect(() => {
    const timers = items.map((item, index) => {
      // Trigger if we have a valid URL but haven't fetched it yet, and we aren't currently loading it
      if (item.url && item.url.startsWith('http') && !item.hasFetched && !item.loading) {
        return setTimeout(async () => {
          setItems(currentItems => {
            const updated = [...currentItems];
            updated[index].loading = true;
            return updated;
          });

          try {
            const res = await fetch('/api/scrape', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ url: item.url })
            });
            const data = await res.json();

            setItems(currentItems => {
              const updated = [...currentItems];
              if (data.title) updated[index].name = data.title.substring(0, 100);
              else updated[index].name = "Unknown Product"; // Fallback to prevent UI break

              if (data.image) updated[index].image = data.image;

              // Only override price if it's currently empty or 0 to not overwrite manual user input
              if (data.price && (!updated[index].price || parseFloat(updated[index].price) === 0)) {
                updated[index].price = data.price;
              }

              updated[index].loading = false;
              updated[index].hasFetched = true;
              return updated;
            });
          } catch (err) {
            console.error("Scrape failed", err);
            setItems(currentItems => {
              const updated = [...currentItems];
              updated[index].loading = false;
              updated[index].hasFetched = true;
              updated[index].name = "Product metadata unavailable";
              return updated;
            });
          }
        }, 500); // Reduced debounce to 500ms for snappier feel
      }
      return null;
    });

    return () => {
      timers.forEach(timer => {
        if (timer) clearTimeout(timer);
      });
    };
  }, [items]); // Re-run when the items array changes (e.g. typing the URL)

  const handleAutoFill = () => {
    if (savedProfile) {
      if (savedProfile.full_name) setClientName(savedProfile.full_name);
      if (savedProfile.phone) setWhatsapp(savedProfile.phone);
      if (savedProfile.zip_code) {
        setPostalCodeInput(savedProfile.zip_code);
      }
      if (savedProfile.state) {
        setSelectedState(savedProfile.state);
        // When state changes, we need to wait for cities to populate
        // We can use a timeout to let React re-render with the new cities array and unlock the field
        if (savedProfile.city) {
          // Wait 500ms to allow the state update (which re-renders and thus 'enables' the City Select field) to complete
          setTimeout(() => {
            // Ensure the city actually exists in the newly computed cities array
            const validCities = getCitiesByState(savedProfile.state);
            if (validCities.includes(savedProfile.city)) {
              setSelectedCity(savedProfile.city);
            }
          }, 500);
        }
      }
    }
  };

  const handleCalculate = () => {
    const total = items.reduce((acc, item) => {
      const num = parseFloat(item.price);
      return acc + (isNaN(num) ? 0 : num);
    }, 0);

    if (total > 0) {
      setBreakdown(calculateTotalCost(total));
    }
  };

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();

    const itemsTotal = items.reduce((acc, item) => {
      const num = parseFloat(item.price);
      return acc + (isNaN(num) ? 0 : num);
    }, 0);

    if (itemsTotal < 15) {
      toast.error(t.min_order_error || "The minimum total for products must be at least $15.");
      return;
    }

    const hasInvalidItems = items.some(i => !i.url || !i.price || isNaN(parseFloat(i.price)));

    if (!breakdown || hasInvalidItems || !user || !clientName || !whatsapp || !selectedOfficeDetails) {
      toast.error(lang === 'es' ? "Por favor completa todos los campos correctamente." : "Please ensure all item fields and logistics details are filled out correctly.");
      return;
    }

    setIsSubmitting(true);
    try {
      console.log('Creating database record...');

      // Insert Order
      const fullOfficeString = `${selectedOfficeDetails.carrier} - ${selectedOfficeDetails.officeName} - ${selectedOfficeDetails.fullAddress}`;

      // Store clean numbers and metadata in DB
      const cleanItems = items.map(i => ({
        url: i.url,
        price: parseFloat(i.price),
        name: i.name || null,
        image: i.image || null
      }));

      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: user.id,
          items: cleanItems, // Supabase JS client automatically serializes objects/arrays for JSONB columns
          amazon_url: cleanItems[0]?.url || "", // Pass legacy field empty or first item to avoid NOT NULL violations if schema isn't fully updated yet
          product_name: "Multi-Item Order",
          amazon_price: 0,
          total_price_usd: breakdown.totalCost,
          client_name: clientName,
          whatsapp: whatsapp,
          state: selectedOfficeDetails.state,
          city: selectedOfficeDetails.city,
          office: fullOfficeString,
          office_map_url: selectedOfficeDetails.mapUrl,
          exchange_rate: exchangeRate,
          status: 'awaiting_approval',
        })
        .select()
        .single();

      if (orderError) {
        console.error('Order creation failed:', orderError);
        toast.error(lang === 'es' ? "Falló la creación de la orden." : 'Failed to create order. Check console for details.');
        throw orderError;
      }

      // Optionally update user's preferred courier to the new office logic
      await supabase
        .from('users')
        .update({ preferred_courier_office: fullOfficeString })
        .eq('id', user.id);

      console.log('Database record created!');
      setSubmittedOrderId(orderData.id);

      // Attempt to notify admin asynchronously (don't block the UI)
      try {
        fetch('/api/notify-admin', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderId: orderData.id,
            clientName: clientName,
            price: breakdown.totalCost.toFixed(2),
            items: cleanItems
          })
        });
      } catch (notifyErr) {
        console.error('Failed to send admin notification:', notifyErr);
      }

    } catch (error) {
      console.error('Error in submission process:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submittedOrderId) {
    return (
      <div className="w-full max-w-lg mx-auto space-y-8 text-center p-6 bg-white rounded-xl border shadow-sm">
        <div className="w-16 h-16 bg-blue-100 text-primary rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-900">{t.order_submitted}</h2>
        <p className="text-gray-600 mt-2">
          {t.order_success_msg}
        </p>

        <div className="mt-8 flex flex-col space-y-3">
          <Link href="/orders" className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-11 rounded-md px-8 w-full">
            {t.go_to_orders}
          </Link>
          <Button variant="outline" className="w-full" onClick={() => window.location.reload()}>
            {t.submit_another}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-lg mx-auto space-y-8">
      <Card className="shadow-none border-gray-200">
        <CardHeader className="pb-4">
          <CardTitle className="text-2xl font-bold tracking-tight">{t.calculate_shipping}</CardTitle>
          <CardDescription className="text-sm">{t.enter_links}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {items.map((item, index) => (
            <div key={index} className="space-y-4 p-4 border rounded-lg bg-gray-50 relative">
              {items.length > 1 && (
                <button
                  onClick={() => setItems(items.filter((_, i) => i !== index))}
                  className="absolute top-2 right-2 text-gray-400 hover:text-red-500"
                  title="Remove item"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
              <div className="space-y-2 pr-6">
                <Label>{t.amazon_url}</Label>
                <Input
                  placeholder="https://amazon.com/dp/..."
                  value={item.url}
                  onChange={(e) => {
                    const newItems = [...items];
                    newItems[index].url = e.target.value;
                    // Reset fetched metadata when URL changes manually
                    newItems[index].name = undefined;
                    newItems[index].image = undefined;
                    newItems[index].price = "";
                    newItems[index].hasFetched = false;
                    setItems(newItems);
                  }}
                />
                <p className="text-[11px] text-amber-600/90 font-medium leading-tight">
                  {lang === 'es' ? 'Por favor, verifica y ajusta el precio para que coincida con el monto actual de la variante seleccionada en Amazon.' : 'Please verify and manually adjust the price to match the actual amount of the selected variant on Amazon.'}
                </p>
              </div>

              {item.name && (
                <div className="flex items-center gap-3 bg-white p-2 rounded border border-gray-100">
                  {item.image ? (
                    <img src={item.image} alt="Product" className="w-12 h-12 object-cover rounded" />
                  ) : (
                    <div className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center text-xs text-gray-400">No Img</div>
                  )}
                  <p className="text-xs text-gray-600 line-clamp-2 leading-tight flex-1">{item.name}</p>
                </div>
              )}
              {item.loading && <p className="text-xs text-blue-500 animate-pulse">Fetching product details...</p>}

              <div className="space-y-2">
                <Label>{t.price}</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={item.price}
                  onChange={(e) => {
                    const newItems = [...items];
                    newItems[index].price = e.target.value;
                    setItems(newItems);
                  }}
                />
              </div>
            </div>
          ))}

          <Button
            variant="outline"
            className="w-full border-dashed"
            onClick={() => setItems([...items, { url: "", price: "" }])}
          >
            <Plus className="w-4 h-4 mr-2" /> {t.add_item}
          </Button>

          <Button onClick={handleCalculate} className="w-full text-md h-12 mt-4">
            {t.calc_total}
          </Button>
        </CardContent>
      </Card>

      {breakdown && (
        <Card className="shadow-none border-primary/20 bg-primary/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">{t.cost_breakdown}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{t.items_total}</span>
              <span className="font-medium">${breakdown.amazonPrice.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{t.us_tax}</span>
              <span className="font-medium">${breakdown.usTax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{t.service_commission}</span>
              <span className="font-medium">${breakdown.serviceCommission.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{t.handling_fee}</span>
              <span className="font-medium">${breakdown.handlingFee.toFixed(2)}</span>
            </div>
            <div className="border-t border-primary/10 pt-3 mt-4 flex justify-between font-black text-xl text-primary">
              <span>{t.estimated_total}</span>
              <span>${breakdown.totalCost.toFixed(2)}</span>
            </div>
            <p className="text-xs text-primary/80 mt-2 text-center font-medium">
              {t.estimation_disclaimer}
            </p>
            <p className="text-xs text-primary/80 mt-2">
              {t.pro_tip}
            </p>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            {user ? (
              <form onSubmit={handleCreateOrder} className="w-full space-y-5 text-left">
                <div className="border-t border-primary/10 my-2" />
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-md font-bold tracking-tight text-primary">{t.delivery_info}</h3>
                  {savedProfile && (
                    <Button type="button" variant="outline" size="sm" onClick={handleAutoFill} className="h-8 text-xs">
                      {t.use_saved_info}
                    </Button>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="clientName">{t.full_name}</Label>
                  <Input id="clientName" placeholder="John Doe" value={clientName} onChange={e => setClientName(e.target.value)} required />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="whatsapp">{t.whatsapp_number}</Label>
                  <Input id="whatsapp" placeholder="+58 412..." value={whatsapp} onChange={e => setWhatsapp(e.target.value)} required />
                </div>

                <div className="grid grid-cols-3 gap-2 mt-4">
                  <div className="space-y-2 col-span-1">
                    <Label>{t.zip_code}</Label>
                    <Input placeholder="e.g. 1060" value={postalCodeInput} onChange={e => setPostalCodeInput(e.target.value)} />
                  </div>
                  <div className="space-y-2 col-span-1">
                    <Label>{t.state}</Label>
                    <Select value={selectedState} onValueChange={(val) => { setSelectedState(val); setSelectedCity(""); setSelectedOfficeCode(""); }}>
                      <SelectTrigger>
                        <SelectValue placeholder={t.any} />
                      </SelectTrigger>
                      <SelectContent>
                        {states.map(s => (
                          <SelectItem key={s} value={s}>{s}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2 col-span-1">
                    <Label>{t.city}</Label>
                    <Select value={selectedCity} onValueChange={(val) => { setSelectedCity(val); setSelectedOfficeCode(""); }} disabled={!selectedState}>
                      <SelectTrigger>
                        <SelectValue placeholder={t.any} />
                      </SelectTrigger>
                      <SelectContent>
                        {cities.map(c => (
                          <SelectItem key={c} value={c}>{c}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>{t.select_office}</Label>
                  <Select value={selectedOfficeCode} onValueChange={setSelectedOfficeCode}>
                    <SelectTrigger className="h-auto whitespace-normal text-left py-3">
                      <SelectValue placeholder={t.choose_office} />
                    </SelectTrigger>
                    <SelectContent className="max-w-[350px]">
                      {availableOffices.map((o) => {
                        const val = `${o.carrier}-${o.officeName}`;
                        return (
                          <SelectItem key={val} value={val} className="py-2">
                            <div className="flex flex-col">
                              <span className="font-bold">{o.carrier} - {o.officeName}</span>
                              <span className="text-xs text-gray-500 whitespace-normal mt-1 leading-snug">{o.fullAddress}</span>
                              {postalCodeInput && o.postalCode.startsWith(postalCodeInput.trim()) && (
                                <span className="text-xs text-green-600 mt-1 font-medium">📍 Zip Match ({o.postalCode})</span>
                              )}
                            </div>
                          </SelectItem>
                        )
                      })}
                      {availableOffices.length === 0 && (
                        <div className="p-2 text-sm text-gray-500">No offices match criteria.</div>
                      )}
                    </SelectContent>
                  </Select>

                  {selectedOfficeDetails && (
                    <a
                      href={selectedOfficeDetails.mapUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline flex items-center mt-2"
                    >
                      <ExternalLink className="h-4 w-4 mr-1 inline shrink-0" />
                      {t.view_map}
                    </a>
                  )}
                </div>

                <Button type="submit" className="w-full mt-4" size="lg" disabled={isSubmitting}>
                  {isSubmitting ? t.submitting : t.submit_approval}
                </Button>
              </form>
            ) : (
              <div className="text-center w-full">
                <p className="text-sm text-gray-500 mb-2">{t.please_login}</p>
                <a href="/login" className="w-full">
                  <Button variant="outline" className="w-full">
                    {t.login_signup}
                  </Button>
                </a>
              </div>
            )}
          </CardFooter>
        </Card>
      )}
    </div>
  );
}
