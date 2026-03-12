"use client";

import { useState } from "react";
import { calculateTotalCost, CostBreakdown } from "@/lib/calculator";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function Calculator({ user }: { user: any }) {
  const [url, setUrl] = useState("");
  const [price, setPrice] = useState("");
  const [courier, setCourier] = useState("Liberty Express");
  const [breakdown, setBreakdown] = useState<CostBreakdown | null>(null);

  const handleCalculate = () => {
    const numPrice = parseFloat(price);
    if (!isNaN(numPrice) && numPrice > 0) {
      setBreakdown(calculateTotalCost(numPrice));
    }
  };

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!breakdown || !url) return;

    // The actual submission would happen here, to Supabase
    alert(`Order submission logic goes here for: \nURL: ${url}\nTotal: $${breakdown.totalCost}\nCourier: ${courier}`);
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
                  <Label htmlFor="receipt">Upload Payment Receipt</Label>
                  <Input id="receipt" type="file" accept="image/*" />
                  <p className="text-sm text-gray-500">Pay ${breakdown.totalCost} and upload screenshot</p>
                </div>
                <Button type="submit" className="w-full" size="lg">Submit Order</Button>
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
