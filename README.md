# JL Comfort E-Commerce

A simple e-commerce website built with Next.js 14, Material UI, Firebase, and TypeScript.

## Tech Stack

- **Next.js 14** (App Router) + React 18
- **TypeScript** - Strict typing across the codebase
- **Material UI (MUI)** - UI components and styling
- **Emotion** - CSS-in-JS via MUI
- **Firebase** - Authentication and Firestore database
- **ESLint** - Code quality checks
- **Netlify** - Deployment target

## Project Structure

```
├── app/
│   ├── admin/             # Admin panel
│   │   └── page.tsx
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Homepage
│   ├── HomePageClient.tsx # Homepage client component
│   ├── providers.tsx     # MUI ThemeProvider
│   └── globals.css        # Minimal global styles
├── components/
│   └── admin/             # Admin panel components
│       ├── AdminLogin.tsx
│       ├── AdminLayout.tsx
│       ├── ProductsList.tsx
│       ├── ProductForm.tsx
│       └── DeleteConfirmDialog.tsx
├── lib/
│   ├── auth/              # Auth utilities
│   ├── data/              # Data access layer
│   ├── firebase/          # Firebase client config
│   ├── types/             # TypeScript types
│   └── theme.ts           # MUI theme configuration
└── netlify.toml           # Netlify deployment config
```

## Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn/pnpm
- Firebase project with Authentication and Firestore enabled

### Installation

1. Clone the repository and install dependencies:

```bash
npm install
```

2. Set up environment variables:

Copy `.env.example` to `.env.local` and fill in your Firebase configuration:

```bash
cp .env.example .env.local
```

Edit `.env.local` with your Firebase and Cloudflare R2 credentials:

```
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Cloudflare R2 Configuration
CLOUDFLARE_ACCOUNT_ID=ba5ad79db88425bb0f6b0cae80e99155
CLOUDFLARE_R2_BUCKET_NAME=jl-comfort
CLOUDFLARE_R2_PUBLIC_URL=https://pub-7e5f5ae157894c8c95bbc5f77e2929f0.r2.dev
CLOUDFLARE_R2_S3_API_URL=https://ba5ad79db88425bb0f6b0cae80e99155.r2.cloudflarestorage.com
CLOUDFLARE_R2_ACCESS_KEY_ID=your_access_key_id_here
CLOUDFLARE_R2_SECRET_ACCESS_KEY=your_secret_access_key_here
```

See [CLOUDFLARE_SETUP.md](./CLOUDFLARE_SETUP.md) for detailed Cloudflare R2 setup instructions.

3. Set up Firebase:

- Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)
- Enable **Authentication** with Email/Password provider
- Enable **Firestore Database** (start in test mode for development)
- Copy your Firebase config values to `.env.local`

4. Run the development server:

```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

### Running Without Firebase

If Firebase is not configured, the app will gracefully fall back to mock data for products. You can still test the UI, but admin authentication and data persistence will not work.

## Features (Milestone 1)

### Public Homepage (`/`)

- AppBar header with site name and Admin link
- Hero section with title, subtitle, and CTA button
- Featured Products grid displaying products from Firestore (or mock data)
- Responsive layout using MUI Grid

### Admin Panel (`/admin`)

- **Authentication**: Email/Password login using Firebase Auth
- **Protected Routes**: Client-side route protection
- **Admin Layout**: Sidebar navigation with Dashboard and Products sections
- **Products Management**:
  - View all products in a table
  - Add new products
  - Edit existing products
  - Delete products (with confirmation dialog)
  - Product form fields: name, price, currency, description, status, image (local preview only)

### Data Model

**Products Collection** (`products`):
- `id` (string)
- `name` (string)
- `description` (string)
- `price` (number)
- `currency` (string, default: "EGP")
- `status` ("draft" | "active")
- `imageUrl` (string | null)
- `createdAt` (timestamp)
- `updatedAt` (timestamp)

## Building for Production

```bash
npm run build
npm start
```

## Deployment to Netlify

1. Push your code to GitHub
2. Connect your repository to Netlify
3. Netlify will automatically detect the `netlify.toml` configuration
4. Set your environment variables in Netlify's dashboard
5. Deploy!

## Milestone 2 Plan

The following features are planned for future iterations:

### Image Upload & Storage
- [x] Cloudflare R2 integration for product images
- [x] Image upload API route (`/api/upload`)
- [ ] Image optimization using Sharp
- [x] Replace placeholder image URLs with R2 URLs

### Product Pages
- [ ] Individual product detail pages (`/products/[id]`)
- [ ] Product image gallery
- [ ] Related products section

### Shopping Cart & Checkout
- [ ] Shopping cart functionality
- [ ] Checkout flow
- [ ] Order management system
- [ ] Payment integration (Stripe/PayPal)

### Enhanced Admin Features
- [ ] Dashboard with statistics
- [ ] Order management in admin panel
- [ ] User management
- [ ] Inventory tracking

### Additional Features
- [ ] Search functionality
- [ ] Product filtering and sorting
- [ ] User reviews and ratings
- [ ] Email notifications
- [ ] SSR/edge optimizations

## Code Quality

- TypeScript strict mode enabled
- ESLint configured with Next.js rules
- Proper separation of server and client components
- Typed data access layer
- Graceful error handling and fallbacks

## Notes

- The codebase is structured to be easily extensible
- TODO markers are included for Milestone 2 features
- Mock data fallback ensures the app works without Firebase configuration
- Image upload is structured but not implemented (placeholder URLs used)

## License

Private project - All rights reserved
