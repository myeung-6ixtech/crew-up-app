import { useEffect, useState } from 'react';
import { nhost, nhostUrls } from '@/lib/nhost';

/** Resolves a Nhost storage file id to an Image-compatible URI (presigned or authenticated). */
/**
 * A storage file's URL. `width` asks storage for a resized image (e.g. ~480px thumbnails on cards): those load from
 * the authenticated file URL with `w`, since a presigned URL can't take extra parameters.
 */
export function useStorageFileUri(fileId?: string | null, options: { width?: number } = {}) {
  const width = options.width;
  const [uri, setUri] = useState<string | null>(null);
  const [headers, setHeaders] = useState<Record<string, string> | undefined>();

  useEffect(() => {
    if (!fileId) {
      setUri(null);
      setHeaders(undefined);
      return;
    }

    let cancelled = false;

    void (async () => {
      if (width) {
        const token = nhost.getUserSession()?.accessToken;
        if (cancelled) return;
        setUri(`${nhostUrls.storage}/files/${fileId}?w=${Math.round(width)}&q=80`);
        setHeaders(token ? { Authorization: `Bearer ${token}` } : undefined);
        return;
      }
      try {
        const res = await nhost.storage.getFilePresignedURL(fileId);
        if (!cancelled && res.status === 200 && res.body?.url) {
          setUri(res.body.url);
          setHeaders(undefined);
          return;
        }
      } catch {
        // Fall back to authenticated direct download URL.
      }

      const token = nhost.getUserSession()?.accessToken;
      if (cancelled) return;
      setUri(`${nhostUrls.storage}/files/${fileId}`);
      setHeaders(token ? { Authorization: `Bearer ${token}` } : undefined);
    })();

    return () => {
      cancelled = true;
    };
  }, [fileId, width]);

  return { uri, headers };
}
