# Quick Start: Cloudflare R2 Setup

If you're seeing "Cloudflare R2 is not configured" errors, follow these steps:

## Step 1: Get Your R2 API Credentials

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Click **R2** in the sidebar
3. Select bucket: **jl-comfort**
4. Click **Settings** → **Manage R2 API Tokens**
5. Click **Create API token**
6. Name: `JL Comfort Upload`
7. Permissions: **Object Read & Write**
8. Click **Create API Token**
9. **Copy both values** (you'll only see the secret once!):
   - Access Key ID
   - Secret Access Key

## Step 2: Add to .env.local

Open your `.env.local` file and add:

```env
# Cloudflare R2 Configuration (REQUIRED for image uploads)
CLOUDFLARE_ACCOUNT_ID=ba5ad79db88425bb0f6b0cae80e99155
CLOUDFLARE_R2_BUCKET_NAME=jl-comfort
CLOUDFLARE_R2_PUBLIC_URL=https://pub-7e5f5ae157894c8c95bbc5f77e2929f0.r2.dev
CLOUDFLARE_R2_S3_API_URL=https://ba5ad79db88425bb0f6b0cae80e99155.r2.cloudflarestorage.com
CLOUDFLARE_R2_ACCESS_KEY_ID=paste_your_access_key_id_here
CLOUDFLARE_R2_SECRET_ACCESS_KEY=paste_your_secret_access_key_here
```

## Step 3: Restart Server

**Important**: After adding environment variables, restart your development server:

```bash
# Stop the server (Ctrl+C)
# Then restart
pnpm dev
# or
npm run dev
```

## Step 4: Test Image Upload

1. Go to Admin Panel → Products or Foam Types
2. Try uploading an image
3. If it works, you're done! ✅
4. If you still get errors, check the error message - it will tell you which variables are missing

## Troubleshooting

### Error: "Missing environment variables: CLOUDFLARE_R2_ACCESS_KEY_ID, CLOUDFLARE_R2_SECRET_ACCESS_KEY"

**Solution**: You haven't added the access keys to `.env.local` yet. Follow Step 1 and Step 2 above.

### Error: "Invalid R2 credentials"

**Solution**: 
- Double-check that you copied the keys correctly (no extra spaces)
- Make sure you're using the correct bucket's API token
- Try creating a new API token

### Error: "R2 bucket not found"

**Solution**: Verify `CLOUDFLARE_R2_BUCKET_NAME=jl-comfort` matches your actual bucket name in Cloudflare.

### Still having issues?

See [CLOUDFLARE_SETUP.md](./CLOUDFLARE_SETUP.md) for detailed troubleshooting.
