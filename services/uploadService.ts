import { nhost } from '@/lib/nhost';

export async function uploadFile(params: {
  uri: string;
  name: string;
  mimeType: string;
  bucketId: string;
  /** Aborts the upload (Cancel import). */
  signal?: AbortSignal;
}) {
  const response = await fetch(params.uri);
  const blob = await response.blob();

  const result = await nhost.storage.uploadFiles(
    {
      'file[]': [blob],
      'bucket-id': params.bucketId,
    },
    params.signal ? { signal: params.signal } : undefined,
  );

  const uploaded = result.body?.processedFiles?.[0];
  if (!uploaded?.id) {
    throw new Error('Upload failed');
  }

  return uploaded.id as string;
}
