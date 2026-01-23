import { NextRequest, NextResponse } from 'next/server';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { r2Client, r2Config, isR2Configured } from '@/lib/cloudflare/r2';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: NextRequest) {
  try {
    // Check if R2 is configured
    if (!isR2Configured()) {
      const missingVars = [];
      if (!r2Config.accountId) missingVars.push('CLOUDFLARE_ACCOUNT_ID');
      if (!r2Config.accessKeyId) missingVars.push('CLOUDFLARE_R2_ACCESS_KEY_ID');
      if (!r2Config.secretAccessKey) missingVars.push('CLOUDFLARE_R2_SECRET_ACCESS_KEY');
      if (!r2Config.s3ApiUrl) missingVars.push('CLOUDFLARE_R2_S3_API_URL');
      
      return NextResponse.json(
        { 
          error: 'Cloudflare R2 is not configured',
          details: `Missing environment variables: ${missingVars.join(', ')}`,
          help: 'Please add these variables to your .env.local file and restart the server. See CLOUDFLARE_SETUP.md for details.'
        },
        { status: 500 }
      );
    }

    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'File must be an image' },
        { status: 400 }
      );
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File size must be less than 10MB' },
        { status: 400 }
      );
    }

    // Generate unique filename
    const fileExtension = file.name.split('.').pop();
    const fileName = `${uuidv4()}.${fileExtension}`;
    const filePath = `images/${fileName}`;

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to R2
    const command = new PutObjectCommand({
      Bucket: r2Config.bucketName,
      Key: filePath,
      Body: buffer,
      ContentType: file.type,
    });

    await r2Client.send(command);

    // Return public URL
    const publicUrl = `${r2Config.publicUrl}/${filePath}`;

    return NextResponse.json({
      url: publicUrl,
      path: filePath,
    });
  } catch (error: any) {
    console.error('Error uploading file:', error);
    
    // Provide more specific error messages
    let errorMessage = 'Failed to upload file';
    if (error.message) {
      errorMessage = error.message;
    } else if (error.name === 'CredentialsError' || error.name === 'InvalidAccessKeyId') {
      errorMessage = 'Invalid R2 credentials. Please check CLOUDFLARE_R2_ACCESS_KEY_ID and CLOUDFLARE_R2_SECRET_ACCESS_KEY';
    } else if (error.name === 'NoSuchBucket') {
      errorMessage = `R2 bucket "${r2Config.bucketName}" not found. Please check CLOUDFLARE_R2_BUCKET_NAME`;
    }
    
    return NextResponse.json(
      { 
        error: errorMessage,
        details: error.message || 'Unknown error occurred'
      },
      { status: 500 }
    );
  }
}
