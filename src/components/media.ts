import { getContentVersion } from '../db/database';

const CONTENT_BASE_URL = process.env.EXPO_PUBLIC_MOBILE_CONTENT_URL?.trim().replace(/\/+$/, '') ?? '';

export function contentMediaUrl(src: string): string | undefined {
  if (!CONTENT_BASE_URL) return undefined;

  const originalPath = decodeURIComponent((src.split('?')[0] ?? src).replaceAll('\\', '/'));
  const dot = originalPath.lastIndexOf('.');
  const slash = originalPath.lastIndexOf('/');
  const path = dot > slash
    ? `${originalPath.slice(0, dot)}${originalPath.slice(dot).toLowerCase()}`
    : originalPath;
  if (!path.startsWith('/assets/crazy/') && !path.startsWith('/assets/videos/')) {
    return undefined;
  }

  const mediaUrl = new URL(`media${path}`, `${CONTENT_BASE_URL}/`);
  mediaUrl.searchParams.set('v', getContentVersion());
  return mediaUrl.toString();
}
