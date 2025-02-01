# WalPartei

A direct democracy platform for German citizens to vote on legislative proposals.

## Features

- Browse current legislative proposals from the Bundestag
- Secure authentication with AusweisApp2 (eID)
- Vote on proposals with privacy-preserving technology
- Modern, responsive UI built with Next.js and Tailwind CSS

## Getting Started

1. Clone the repository
2. Copy `.env.example` to `.env.local` and fill in the required values
3. Install dependencies:
   ```bash
   npm install
   ```
4. Run the development server:
   ```bash
   npm run dev
   ```
5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Environment Variables

- `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anonymous key
- `NEXT_PUBLIC_DIP_API_URL`: DIP Bundestag API URL
- `DIP_API_KEY`: Your DIP API key
- `NEXT_PUBLIC_AUSWEIS_APP_URL`: AusweisApp2 local endpoint
- `NEXT_PUBLIC_BASE_URL`: Your application's base URL

## Tech Stack

- Next.js 14
- TypeScript
- Tailwind CSS
- Supabase
- DIP Bundestag API
- AusweisApp2 Integration (coming soon)

## Development

The project is being developed in phases:

### Phase 1 (Current)
- Next.js + Tailwind setup
- DIP data fetching & display
- Basic UI implementation

### Phase 2 (Upcoming)
- AusweisApp2 integration
- GPT summaries
- Voting mechanism

### Phase 3 (Planned)
- Full localization
- Performance optimizations
- Advanced search features
