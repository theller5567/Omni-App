// Simple Cloudinary fetch helper for responsive images
// Uses Cloudinary remote fetch to proxy existing public URLs through the CDN

const CLOUD_NAME = 'TravisHeller-Cloudinary';
const BASE = `https://res.cloudinary.com/${CLOUD_NAME}/image/fetch`;

export type CdnOpts = {
  w?: number;
  q?: number; // quality number or 'auto' (we use auto by default)
  ar?: string; // aspect ratio, e.g., '16:9'
  c?: string; // crop mode, e.g., 'fill'
  dpr?: number;
  f_auto?: boolean; // force auto format
};

const toTransform = (o: CdnOpts): string => {
  const parts: string[] = [];
  if (o.f_auto !== false) parts.push('f_auto');
  // Allow fetching images even when the origin URL lacks a file extension
  parts.push('fl_any_format');
  parts.push(`q_${o.q ?? 'auto'}`);
  if (o.w) parts.push(`w_${o.w}`);
  if (o.dpr) parts.push(`dpr_${o.dpr}`);
  if (o.ar) parts.push(`ar_${o.ar}`);
  if (o.c) parts.push(`c_${o.c}`);
  return parts.join(',');
};

export const cdnUrl = (originUrl: string, opts: CdnOpts = {}): string =>
  `${BASE}/${toTransform({ f_auto: true, q: 70, ...opts })}/${encodeURIComponent(originUrl)}`;

export const cdnSrcSet = (
  originUrl: string,
  widths: number[] = [240, 320, 480, 640, 800, 1024]
): string => {
  return widths
    .map((w) => `${cdnUrl(originUrl, { w })} ${w}w`)
    .join(', ');
};


