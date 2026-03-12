# Venezuela Cargo App

A concierge shipping service web app that calculates costs for shipping items from Amazon to Venezuela.

## Tech Stack
- **Framework:** Next.js 15+ (App Router, TypeScript)
- **Styling:** Tailwind CSS + shadcn/ui
- **Backend/Auth/Database:** Supabase

## Features
- **Cost Calculator:** Enter an Amazon URL and product price. It transparently calculates the total cost to ship to Venezuela including:
  - US Sales Tax (7%)
  - Service Commission (15%)
  - Flat Handling Fee ($5)
- **Authentication:** Users can log in or sign up using Supabase Auth.
- **Order Flow:** Logged in users can upload their payment receipt screenshot (Storage placeholder) to submit their order.

## Folder Structure
- `src/app`: Next.js pages, routing, and server actions (`/login`, `/auth`, etc.)
- `src/components`: React components including the `Calculator` and `shadcn/ui` UI library components.
- `src/lib`: Utilities including the cost calculator logic (`calculator.ts`).
- `src/utils/supabase`: Supabase SSR client and middleware setup.
- `schema.sql`: Raw SQL file containing the Supabase schema and Row Level Security policies.

## Setup Instructions

1. **Clone the repository:**
   ```bash
   git clone <repo-url>
   cd venezuela-cargo-app
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Supabase Configuration:**
   - Create a project in [Supabase](https://supabase.com).
   - Go to the SQL Editor and run the contents of `schema.sql`.
   - Ensure you enable Storage and create a bucket named `receipts` (this is referenced in the schema comments).
   - Get your Project URL and Anon Key from Project Settings > API.

4. **Environment Variables:**
   Create a `.env.local` file at the root of the project:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

5. **Run the development server:**
   ```bash
   npm run dev
   ```
   The app will be available at `http://localhost:3000`.

## Deployment
This app can be easily deployed to Vercel or any Next.js compatible hosting platform. Ensure you set the `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in your production environment variables.