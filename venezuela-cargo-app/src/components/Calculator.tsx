"use client";

import { useState } from "react";
import { calculateTotalCost, CostBreakdown } from "@/lib/calculator";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { createClient } from "@/utils/supabase/client";

export function Calculator({ user }: { user: any }) {
  const [url, setUrl] = useState("");
  const [price, setPrice] = useState("");
  const [courier, setCourier] = useState("Liberty Express");
  const [paymentMethod, setPaymentMethod] = useState("Zelle");
  const [file, setFile] = useState<File | null>(null);
  const [breakdown, setBreakdown] = useState<CostBreakdown | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const supabase = createClient();

  const handleCalculate = () => {
    const numPrice = parseFloat(price);
    if (!isNaN(numPrice) && numPrice > 0) {
      setBreakdown(calculateTotalCost(numPrice));
    }
  };

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!breakdown || !url || !file || !user) {
      alert("Please fill in all fields and upload a receipt.");
      return;
    }

    setIsSubmitting(true);
    try {
      console.log('Starting upload...');

      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('receipts')
        .upload(filePath, file);

      if (uploadError) {
        console.error('Upload failed:', uploadError);
        alert('Failed to upload receipt. Check console for details.');
        throw uploadError;
      }

      console.log('Upload success!');
      console.log('Creating database record...');

      // Get public URL for the receipt
      const { data: { publicUrl } } = supabase.storage
        .from('receipts')
        .getPublicUrl(filePath);

      // Insert Order
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: user.id,
          amazon_url: url,
          product_name: 'Amazon Order', // Hardcoded as requested
          total_price_usd: breakdown.totalCost,
          amazon_price: breakdown.amazonPrice,
        })
        .select()
        .single();

      if (orderError) {
        console.error('Order creation failed:', orderError);
        alert('Failed to create order. Check console for details.');
        throw orderError;
      }

      // Insert Payment
      const { error: paymentError } = await supabase
        .from('payments')
        .insert({
          order_id: orderData.id,
          method: paymentMethod,
          receipt_screenshot_url: publicUrl,
          amount_paid: breakdown.totalCost,
        });

      if (paymentError) {
        console.error('Payment creation failed:', paymentError);
        alert('Failed to create payment record. Check console for details.');
        throw paymentError;
      }

      // Optionally update user's preferred courier if they changed it
      await supabase
        .from('users')
        .update({ preferred_courier_office: courier })
        .eq('id', user.id);

      console.log('Database record created!');
      alert('Order submitted! We will verify your payment shortly.');

      // Reset form
      setUrl("");
      setPrice("");
      setFile(null);
      setBreakdown(null);

    } catch (error) {
      console.error('Error in submission process:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-lg mx-auto space-y-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Calculate Shipping</CardTitle>
          <CardDescription>Enter the Amazon link and the product price in USD.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="amazonUrl">Amazon Product URL</Label>
            <Input
              id="amazonUrl"
              placeholder="https://amazon.com/dp/..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="price">Product Price ($)</Label>
            <Input
              id="price"
              type="number"
              step="0.01"
              placeholder="0.00"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
            />
          </div>
          <Button onClick={handleCalculate} className="w-full">
            Calculate Cost
          </Button>
        </CardContent>
      </Card>

      {breakdown && (
        <Card className="border-green-200 shadow-md">
          <CardHeader>
            <CardTitle>Cost Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Amazon Price</span>
              <span className="font-medium">${breakdown.amazonPrice.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">US Sales Tax (7%)</span>
              <span className="font-medium">${breakdown.usTax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Service Commission (15%)</span>
              <span className="font-medium">${breakdown.serviceCommission.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Handling Fee</span>
              <span className="font-medium">${breakdown.handlingFee.toFixed(2)}</span>
            </div>
            <div className="border-t pt-2 mt-4 flex justify-between font-bold text-lg">
              <span>Total Cost</span>
              <span>${breakdown.totalCost.toFixed(2)}</span>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            {user ? (
              <form onSubmit={handleCreateOrder} className="w-full space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="courier">Preferred Courier Office</Label>
                  <Select value={courier} onValueChange={setCourier}>
                    <SelectTrigger id="courier">
                      <SelectValue placeholder="Select a courier" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Liberty Express">Liberty Express</SelectItem>
                      <SelectItem value="MRW">MRW</SelectItem>
                      <SelectItem value="Zoom">Zoom</SelectItem>
                      <SelectItem value="Domesa">Domesa</SelectItem>
                      <SelectItem value="Tealca">Tealca</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="paymentMethod">Payment Method</Label>
                  <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                    <SelectTrigger id="paymentMethod">
                      <SelectValue placeholder="Select a payment method" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Zelle">Zelle</SelectItem>
                      <SelectItem value="Binance">Binance</SelectItem>
                      <SelectItem value="PagoMovil">PagoMovil</SelectItem>
                    </SelectContent>
                  </Select>

                  {paymentMethod === 'Zelle' && (
                    <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-md text-sm text-blue-800">
                      <strong>Send to:</strong> Brynzulino@gmail.com <br/>
                      <strong>Name:</strong> BRYAN KLUGE
                    </div>
                  )}

                  {paymentMethod === 'PagoMovil' && (
                    <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-md text-sm text-blue-800">
                      <strong>Send to:</strong> <br/>
                      <strong>Cell:</strong> 04227167657 <br/>
                      <strong>Cedula:</strong> 30136044 <br/>
                      <strong>BANCO:</strong> Banco Venezuela
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="receipt">Upload Payment Receipt</Label>
                  <Input
                    id="receipt"
                    type="file"
                    accept="image/*"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                  />
                  <p className="text-sm text-gray-500">Pay ${breakdown.totalCost} and upload screenshot</p>
                </div>
                <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
                  {isSubmitting ? "Submitting..." : "Submit Order"}
                </Button>
              </form>
            ) : (
              <div className="text-center w-full">
                <p className="text-sm text-gray-500 mb-2">Please log in to place an order</p>
                <a href="/login" className="w-full">
                  <Button variant="outline" className="w-full">
                    Log In / Sign Up
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
