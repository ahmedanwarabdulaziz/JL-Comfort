import { NextResponse } from 'next/server';
import { ListObjectsV2Command } from '@aws-sdk/client-s3';
import { r2Client, r2Config, isR2Configured } from '@/lib/cloudflare/r2';

export async function GET() {
  try {
    if (!isR2Configured()) {
      return NextResponse.json(
        { error: 'Cloudflare R2 is not configured', images: [] },
        { status: 500 }
      );
    }

    const command = new ListObjectsV2Command({
      Bucket: r2Config.bucketName,
      Prefix: 'images/',
      MaxKeys: 300,
    });

    const result = await r2Client.send(command);

    const images = (result.Contents || [])
      .filter((obj) => obj.Key && !obj.Key.endsWith('/'))
      .sort((a, b) => {
        const aTime = a.LastModified ? new Date(a.LastModified).getTime() : 0;
        const bTime = b.LastModified ? new Date(b.LastModified).getTime() : 0;
        return bTime - aTime;
      })
      .map((obj) => ({
        url: `${r2Config.publicUrl}/${obj.Key}`,
        path: obj.Key,
        lastModified: obj.LastModified,
      }));

    return NextResponse.json({ images });
  } catch (error: any) {
    console.error('Error listing media:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to list media', images: [] },
      { status: 500 }
    );
  }
}
