export interface UploadResult {
  url: string;
  path: string;
}

function xhrPut(
  url: string,
  file: File,
  onProgress: (percent: number) => void
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.upload.addEventListener('progress', (event) => {
      if (event.lengthComputable) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    });

    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
      } else {
        reject(new Error(`Direct upload failed with status ${xhr.status}`));
      }
    });

    xhr.addEventListener('error', () => {
      reject(new Error('Network or CORS error during direct upload'));
    });

    xhr.open('PUT', url);
    xhr.setRequestHeader('Content-Type', file.type);
    xhr.send(file);
  });
}

/**
 * Uploads straight from the browser to the R2 bucket using a presigned URL,
 * so progress reflects the real (and usually slowest) leg of the upload.
 * Requires a CORS policy on the R2 bucket allowing PUT from this origin —
 * see CLOUDFLARE_SETUP.md. Throws if that isn't configured.
 */
async function uploadDirectToR2(
  file: File,
  onProgress: (percent: number) => void
): Promise<UploadResult> {
  const presignRes = await fetch('/api/upload/presign', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fileName: file.name, fileType: file.type, fileSize: file.size }),
  });
  const presignData = await presignRes.json();
  if (!presignRes.ok) {
    throw new Error(presignData.error || 'Failed to get upload URL');
  }

  await xhrPut(presignData.uploadUrl, file, onProgress);

  return { url: presignData.publicUrl, path: presignData.path };
}

/**
 * Uploads the file to our own /api/upload route, which relays it to R2
 * server-side. Progress only reflects the (fast, same-origin) browser-to-server
 * leg, not the actual R2 upload — used as a fallback when direct upload fails.
 */
function uploadViaServer(
  file: File,
  onProgress: (percent: number) => void
): Promise<UploadResult> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const formData = new FormData();
    formData.append('file', file);

    xhr.upload.addEventListener('progress', (event) => {
      if (event.lengthComputable) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    });

    xhr.addEventListener('load', () => {
      let data: any = {};
      try {
        data = JSON.parse(xhr.responseText);
      } catch {
        // ignore parse failure, handled by status check below
      }

      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(data as UploadResult);
      } else {
        reject(new Error(data.error || `Upload failed with status ${xhr.status}`));
      }
    });

    xhr.addEventListener('error', () => {
      reject(new Error('Network error while uploading image'));
    });

    xhr.open('POST', '/api/upload');
    xhr.send(formData);
  });
}

/**
 * Uploads an image with real progress reporting. Tries a direct
 * browser-to-R2 upload first (accurate progress on the actual transfer);
 * if that's unavailable (e.g. R2 bucket CORS isn't configured yet), falls
 * back to relaying through our server so uploads keep working either way.
 */
export async function uploadImageWithProgress(
  file: File,
  onProgress: (percent: number) => void
): Promise<UploadResult> {
  try {
    return await uploadDirectToR2(file, onProgress);
  } catch (error) {
    console.warn(
      'Direct-to-R2 upload failed (likely missing CORS config on the R2 bucket), falling back to server relay upload:',
      error
    );
    onProgress(0);
    return uploadViaServer(file, onProgress);
  }
}
