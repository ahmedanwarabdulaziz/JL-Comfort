import { NextRequest, NextResponse } from 'next/server';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { r2Client, r2Config, isR2Configured } from '@/lib/cloudflare/r2';
import { v4 as uuidv4 } from 'uuid';

const MAX_SIZE = 10 * 1024 * 1024; // 10MB

export async function POST(request: NextRequest) {
  try {
    if (!isR2Configured()) {
      return NextResponse.json(
        {
          error: 'Cloudflare R2 is not configured',
          help: 'Please add R2 environment variables to your .env.local file and restart the server.',
        },
        { status: 500 }
      );
    }

    const { fileName, fileType, fileSize } = await request.json();

    if (!fileName || !fileType) {
      return NextResponse.json({ error: 'fileName and fileType are required' }, { status: 400 });
    }

    if (!String(fileType).startsWith('image/')) {
      return NextResponse.json({ error: 'File must be an image' }, { status: 400 });
    }

    if (typeof fileSize === 'number' && fileSize > MAX_SIZE) {
      return NextResponse.json({ error: 'File size must be less than 10MB' }, { status: 400 });
    }

    const fileExtension = String(fileName).split('.').pop();
    const key = `images/${uuidv4()}.${fileExtension}`;

    const command = new PutObjectCommand({
      Bucket: r2Config.bucketName,
      Key: key,
      ContentType: fileType,
    });

    const uploadUrl = await getSignedUrl(r2Client, command, { expiresIn: 300 });
    const publicUrl = `${r2Config.publicUrl}/${key}`;

    return NextResponse.json({ uploadUrl, publicUrl, path: key });
  } catch (error: any) {
    console.error('Error creating presigned upload URL:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create upload URL' },
      { status: 500 }
    );
  }
}
