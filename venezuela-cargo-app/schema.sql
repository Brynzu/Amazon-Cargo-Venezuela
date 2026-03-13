-- Create custom types (Updated)
CREATE TYPE order_status AS ENUM (
  'pending_payment',
  'processing',
  'in_miami',
  'shipped_to_vzla',
  'ready_for_pickup'
);

CREATE TYPE payment_method AS ENUM (
  'Zelle',
  'Binance',
  'PagoMovil'
);

-- Users Table (extends Supabase auth.users)
CREATE TABLE public.users (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  phone TEXT,
  address_in_venezuela TEXT,
  preferred_courier_office TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for Users
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Users can read their own profile
CREATE POLICY "Users can view own profile"
ON public.users FOR SELECT
USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
ON public.users FOR UPDATE
USING (auth.uid() = id);

-- Trigger to automatically create a public.users row when a new auth.users signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email)
  VALUES (new.id, new.email);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();


-- Orders Table (Updated with Logistics, Name, Whatsapp and Receipt URL)
CREATE TABLE public.orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,

  -- New Client Info
  client_name TEXT NOT NULL,
  whatsapp TEXT NOT NULL,

  -- Item Info
  amazon_url TEXT NOT NULL,
  product_name TEXT NOT NULL,
  total_price_usd NUMERIC(10, 2) NOT NULL,
  amazon_price NUMERIC(10, 2) NOT NULL,

  -- Order Status
  status order_status DEFAULT 'pending_payment' NOT NULL,
  tracking_number TEXT,

  -- New Logistics Fields
  state TEXT NOT NULL,
  city TEXT NOT NULL,
  office TEXT NOT NULL,
  office_map_url TEXT,

  -- New Receipt URL (as requested by user)
  receipt_url TEXT,

  -- Frozen Exchange Rate at time of purchase
  exchange_rate NUMERIC(10, 2),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for Orders
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Users can read their own orders
CREATE POLICY "Users can view own orders"
ON public.orders FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own orders
CREATE POLICY "Users can insert own orders"
ON public.orders FOR INSERT
WITH CHECK (auth.uid() = user_id);


-- Payments Table
CREATE TABLE public.payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
  method payment_method NOT NULL,
  receipt_screenshot_url TEXT NOT NULL,
  amount_paid NUMERIC(10, 2) NOT NULL,
  verified_status BOOLEAN DEFAULT FALSE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for Payments
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Users can read their own payments (via order)
CREATE POLICY "Users can view own payments"
ON public.payments FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.orders
    WHERE public.orders.id = public.payments.order_id
    AND public.orders.user_id = auth.uid()
  )
);

-- Users can insert their own payments
CREATE POLICY "Users can insert own payments"
ON public.payments FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.orders
    WHERE public.orders.id = public.payments.order_id
    AND public.orders.user_id = auth.uid()
  )
);

-- ==========================================
-- SETTINGS TABLE (Global Configuration)
-- ==========================================
CREATE TABLE public.settings (
  id INT PRIMARY KEY DEFAULT 1,
  exchange_rate NUMERIC(10, 2) DEFAULT 710.00 NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default row
INSERT INTO public.settings (id, exchange_rate) VALUES (1, 710.00) ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- Anyone can read settings
CREATE POLICY "Anyone can view settings"
ON public.settings FOR SELECT
USING (true);

-- Only admin can update settings
CREATE POLICY "Admin can update settings"
ON public.settings FOR UPDATE
USING (auth.jwt() ->> 'email' = 'brynzulino@gmail.com');


-- ==========================================
-- ADMIN POLICIES (brynzulino@gmail.com)
-- ==========================================

-- Admin can read all users
CREATE POLICY "Admin can view all users"
ON public.users FOR SELECT
USING (auth.jwt() ->> 'email' = 'brynzulino@gmail.com');

-- Admin can read all orders
CREATE POLICY "Admin can view all orders"
ON public.orders FOR SELECT
USING (auth.jwt() ->> 'email' = 'brynzulino@gmail.com');

-- Admin can update all orders (e.g., status)
CREATE POLICY "Admin can update all orders"
ON public.orders FOR UPDATE
USING (auth.jwt() ->> 'email' = 'brynzulino@gmail.com');

-- Admin can read all payments
CREATE POLICY "Admin can view all payments"
ON public.payments FOR SELECT
USING (auth.jwt() ->> 'email' = 'brynzulino@gmail.com');
