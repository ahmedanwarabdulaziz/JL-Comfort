# Cloudflare R2 Configuration Guide

This project uses Cloudflare R2 for image storage. R2 is S3-compatible object storage that provides a cost-effective solution for storing images and other assets.

## Configuration

### 1. Environment Variables

Add the following environment variables to your `.env.local` file:

```env
# Cloudflare R2 Configuration
CLOUDFLARE_ACCOUNT_ID=ba5ad79db88425bb0f6b0cae80e99155
CLOUDFLARE_R2_BUCKET_NAME=jl-comfort
CLOUDFLARE_R2_PUBLIC_URL=https://pub-7e5f5ae157894c8c95bbc5f77e2929f0.r2.dev
CLOUDFLARE_R2_S3_API_URL=https://ba5ad79db88425bb0f6b0cae80e99155.r2.cloudflarestorage.com
CLOUDFLARE_R2_ACCESS_KEY_ID=your_access_key_id_here
CLOUDFLARE_R2_SECRET_ACCESS_KEY=your_secret_access_key_here
```

### 2. Getting R2 Access Keys ⚠️ REQUIRED

**This step is required for image uploads to work!**

1. Log in to your Cloudflare dashboard at [dash.cloudflare.com](https://dash.cloudflare.com)
2. Navigate to **R2** in the sidebar
3. Select your bucket (`jl-comfort`)
4. Go to **Settings** → **Manage R2 API Tokens**
5. Click **Create API token**
6. Give it a name (e.g., "JL Comfort Upload")
7. Set permissions to **Object Read & Write**
8. Click **Create API Token**
9. **IMPORTANT**: Copy both values immediately:
   - **Access Key ID** → `CLOUDFLARE_R2_ACCESS_KEY_ID`
   - **Secret Access Key** → `CLOUDFLARE_R2_SECRET_ACCESS_KEY`
   - ⚠️ The secret key is only shown once! Save it immediately.

10. Add these to your `.env.local` file:
```env
CLOUDFLARE_R2_ACCESS_KEY_ID=your_access_key_id_here
CLOUDFLARE_R2_SECRET_ACCESS_KEY=your_secret_access_key_here
```

11. **Restart your development server** after adding these variables

### 3. Public URL Configuration

The public URL is already configured:
- **Public Development URL**: `https://pub-7e5f5ae157894c8c95bbc5f77e2929f0.r2.dev`

Make sure your R2 bucket has a public domain configured in Cloudflare's R2 settings.

## Usage

### Image Upload API

The project includes an API route at `/api/upload` that handles image uploads to R2:

- **Endpoint**: `POST /api/upload`
- **Content-Type**: `multipart/form-data`
- **Body**: Form data with a `file` field containing the image file
- **Max File Size**: 10MB
- **Supported Formats**: All image types (`image/*`)

### Example Usage

```typescript
const formData = new FormData();
formData.append('file', imageFile);

const response = await fetch('/api/upload', {
  method: 'POST',
  body: formData,
});

const data = await response.json();
// Returns: { url: 'https://pub-...r2.dev/images/uuid.jpg', path: 'images/uuid.jpg' }
```

### Forms with Image Upload

The following forms support image upload:
- **ProductForm** (`components/admin/ProductForm.tsx`)
- **FoamTypeForm** (`components/admin/FoamTypeForm.tsx`)

When a user selects an image, it will:
1. Show a local preview immediately
2. Upload to Cloudflare R2 automatically
3. Store the public URL in the database

## File Structure

Uploaded images are stored in the `images/` directory within your R2 bucket:
- Format: `images/{uuid}.{extension}`
- Example: `images/550e8400-e29b-41d4-a716-446655440000.jpg`

## Troubleshooting

### Upload Fails

1. Check that all environment variables are set correctly
2. Verify your R2 API tokens have the correct permissions
3. Ensure the bucket name matches your configuration
4. Check that the public URL domain is configured in Cloudflare

### Images Not Displaying

1. Verify the public URL is correctly configured in Cloudflare R2 settings
2. Check CORS settings if accessing from a different domain
3. Ensure the file path matches the public URL structure

## Production Deployment

When deploying to production (e.g., Netlify):

1. Add all Cloudflare R2 environment variables to your deployment platform's environment variable settings
2. Ensure the public URL is accessible from your production domain
3. Consider setting up a custom domain for your R2 bucket in production
