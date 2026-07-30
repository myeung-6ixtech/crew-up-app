import { nhost } from '@/lib/nhost';

export async function uploadFile(params: {
  uri: string;
  name: string;
  mimeType: string;
  bucketId: string;
}) {
  const response = await fetch(params.uri);
  const blob = await response.blob();

  const result = await nhost.storage.uploadFiles({
    'file[]': [blob],
    'bucket-id': params.bucketId,
  });

  const uploaded = result.body?.processedFiles?.[0];
  if (!uploaded?.id) {
    throw new Error('Upload failed');
  }

  return uploaded.id as string;
}
