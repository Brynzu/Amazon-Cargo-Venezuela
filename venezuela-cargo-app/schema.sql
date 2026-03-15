-- Create custom types (Updated)
-- Run this to update existing enum if needed:
-- ALTER TYPE order_status ADD VALUE 'awaiting_approval';
-- ALTER TYPE order_status ADD VALUE 'rejected';
CREATE TYPE order_status AS ENUM (
  'awaiting_approval',
  'rejected',
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

  -- Profile Fields
  full_name TEXT,
  phone TEXT,
  state TEXT,
  city TEXT,
  zip_code TEXT,
  avatar_url TEXT,
  preferred_language TEXT DEFAULT 'en',

  -- Legacy fields
  address_in_venezuela TEXT,
  preferred_courier_office TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notifications Table
CREATE TABLE public.notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'info' NOT NULL,
  read BOOLEAN DEFAULT FALSE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for Notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Users can read their own notifications
CREATE POLICY "Users can view own notifications"
ON public.notifications FOR SELECT
USING (auth.uid() = user_id);

-- Users can update their own notifications (to mark as read)
CREATE POLICY "Users can update own notifications"
ON public.notifications FOR UPDATE
USING (auth.uid() = user_id);

-- Admin can insert notifications
CREATE POLICY "Admin can insert notifications"
ON public.notifications FOR INSERT
WITH CHECK (auth.jwt() ->> 'email' = 'brynzulino@gmail.com');

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

  -- Item Info (Legacy)
  amazon_url TEXT,
  product_name TEXT,
  amazon_price NUMERIC(10, 2),

  -- Multi-item Info
  items JSONB,
  total_price_usd NUMERIC(10, 2) NOT NULL,

  -- Order Status
  status order_status DEFAULT 'awaiting_approval' NOT NULL,
  tracking_number TEXT,
  rejection_reason TEXT,
  admin_note TEXT,

  -- New Logistics Fields
  state TEXT NOT NULL,
  city TEXT NOT NULL,
  office TEXT NOT NULL,
  office_map_url TEXT,

  -- New Receipt URL (as requested by user)
  payment_receipt TEXT,

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

-- Secure RPC to let users attach receipts without granting raw UPDATE access
CREATE OR REPLACE FUNCTION public.attach_payment_receipt(p_order_id UUID, p_receipt_url TEXT)
RETURNS VOID AS $$
BEGIN
  -- Verify the user owns this order before updating
  UPDATE public.orders
  SET payment_receipt = p_receipt_url,
      status = 'processing',
      updated_at = NOW()
  WHERE id = p_order_id
    AND user_id = auth.uid()
    AND status = 'pending_payment'; -- Only allow if awaiting payment or already pending verification
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


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
USING (auth.jwt() ->> 'email' = 'brynzulino@gmail.com')
WITH CHECK (auth.jwt() ->> 'email' = 'brynzulino@gmail.com');

-- Admin can read all payments
CREATE POLICY "Admin can view all payments"
ON public.payments FOR SELECT
USING (auth.jwt() ->> 'email' = 'brynzulino@gmail.com');

-- ==========================================
-- SUPPORT MODULE
-- ==========================================
CREATE TABLE public.support_tickets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  message TEXT NOT NULL,
  attachment_url TEXT,
  status TEXT DEFAULT 'open',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for Support Tickets
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

-- Users can insert their own support tickets
CREATE POLICY "Users can insert own support tickets"
ON public.support_tickets FOR INSERT
WITH CHECK (auth.uid() = user_id OR auth.uid() IS NULL); -- Allow anonymous if needed, or enforce auth

-- Users can read their own support tickets
CREATE POLICY "Users can view own support tickets"
ON public.support_tickets FOR SELECT
USING (auth.uid() = user_id);

-- Admin can read all support tickets
CREATE POLICY "Admin can view all support tickets"
ON public.support_tickets FOR SELECT
USING (auth.jwt() ->> 'email' = 'brynzulino@gmail.com');

-- Admin can update all support tickets (e.g. resolve them)
CREATE POLICY "Admin can update all support tickets"
ON public.support_tickets FOR UPDATE
USING (auth.jwt() ->> 'email' = 'brynzulino@gmail.com');

-- ==========================================
-- STORAGE POLICIES
-- ==========================================

-- Insert this into Supabase SQL Editor if buckets are created:
-- insert into storage.buckets (id, name, public) values ('payment_receipts', 'payment_receipts', true);
-- insert into storage.buckets (id, name, public) values ('support_attachments', 'support_attachments', true);

-- Allow authenticated users to upload files to payment_receipts bucket
CREATE POLICY "Authenticated users can upload payment receipts"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'payment_receipts');

-- Allow anyone to read payment receipts
CREATE POLICY "Anyone can view payment receipts"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'payment_receipts');

-- Allow users to upload files to support_attachments bucket
-- Allow users to upload files to support_attachments bucket (public access since form is on landing page)
CREATE POLICY "Anyone can upload support attachments"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id = 'support_attachments');

-- Allow anyone to read support attachments
CREATE POLICY "Anyone can view support attachments"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'support_attachments');
