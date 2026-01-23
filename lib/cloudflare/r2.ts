import { S3Client } from '@aws-sdk/client-s3';

// Cloudflare R2 configuration
export const r2Config = {
  accountId: process.env.CLOUDFLARE_ACCOUNT_ID || '',
  bucketName: process.env.CLOUDFLARE_R2_BUCKET_NAME || 'jl-comfort',
  publicUrl: process.env.CLOUDFLARE_R2_PUBLIC_URL || 'https://pub-7e5f5ae157894c8c95bbc5f77e2929f0.r2.dev',
  s3ApiUrl: process.env.CLOUDFLARE_R2_S3_API_URL || 'https://ba5ad79db88425bb0f6b0cae80e99155.r2.cloudflarestorage.com',
  accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID || '',
  secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY || '',
};

// Create S3 client configured for Cloudflare R2
export const r2Client = new S3Client({
  region: 'auto',
  endpoint: r2Config.s3ApiUrl,
  credentials: {
    accessKeyId: r2Config.accessKeyId,
    secretAccessKey: r2Config.secretAccessKey,
  },
});

export const isR2Configured = (): boolean => {
  return !!(
    r2Config.accountId &&
    r2Config.accessKeyId &&
    r2Config.secretAccessKey &&
    r2Config.s3ApiUrl
  );
};
