# Environment Variables Setup

## Cloudflare R2 Credentials

Add these to your `.env.local` file:

```env
# Cloudflare R2 Configuration
CLOUDFLARE_ACCOUNT_ID=ba5ad79db88425bb0f6b0cae80e99155
CLOUDFLARE_R2_BUCKET_NAME=jl-comfort
CLOUDFLARE_R2_PUBLIC_URL=https://pub-7e5f5ae157894c8c95bbc5f77e2929f0.r2.dev
CLOUDFLARE_R2_S3_API_URL=https://ba5ad79db88425bb0f6b0cae80e99155.r2.cloudflarestorage.com
CLOUDFLARE_R2_ACCESS_KEY_ID=d21cd2210d99bd5d66e85e215a63787d
CLOUDFLARE_R2_SECRET_ACCESS_KEY=5f364762fa20170a924b855383ce70c886a0e64b61dfa41ff083431ad01bc10d
```

## Steps:

1. Open `.env.local` in your project root
2. Add or update the Cloudflare R2 variables above
3. Save the file
4. **Restart your development server** (stop with Ctrl+C, then run `pnpm dev` again)

## After Setup:

Try uploading an image in the admin panel. It should work now! ✅
