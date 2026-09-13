/**
 * Browser-side image compression, applied before upload.
 *
 * Why compress at all: next/image already optimises DELIVERY (it resizes and
 * serves WebP/AVIF per device), so visitors never receive a 5 MB original.
 * The problem is STORAGE — a camera original sits in the bucket at full size
 * forever, eating the free tier's 1 GB and making admin thumbnails slow.
 *
 * Compressing here also means files arrive well under Next's server-action
 * body limit, so the size ceiling stops being something we work around.
 *
 * Deliberately conservative: if anything about the compression looks wrong
 * (canvas unavailable, encode fails, result somehow larger), we return the
 * ORIGINAL file rather than a corrupted one. A slow upload beats a broken
 * image.
 */

/** Longest edge, in pixels. 2400 covers full-bleed hero images on a 2x display. */
const MAX_EDGE = 2400;

/** JPEG/WebP quality. 0.82 is the usual sweet spot before artefacts show. */
const QUALITY = 0.82;

/** Below this, compression isn't worth the quality loss. */
const SKIP_BELOW_BYTES = 300 * 1024;

/** Formats we can safely re-encode. SVG is vector; GIF may be animated. */
const COMPRESSIBLE = new Set(["image/jpeg", "image/png", "image/webp"]);

export interface CompressionResult {
  file: File;
  originalBytes: number;
  compressed: boolean;
  /** Set when compression was skipped or failed, for an honest UI message. */
  reason?: string;
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new window.Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("could not decode image"));
    };
    img.src = url;
  });
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, type, QUALITY));
}

/**
 * Resize to fit within MAX_EDGE and re-encode.
 * Always resolves — never throws — so a failure degrades to the original file.
 */
export async function compressImage(file: File): Promise<CompressionResult> {
  const originalBytes = file.size;
  const keep = (reason: string): CompressionResult => ({
    file,
    originalBytes,
    compressed: false,
    reason,
  });

  if (!COMPRESSIBLE.has(file.type)) {
    return keep(file.type === "image/svg+xml" ? "vector image" : "format kept as-is");
  }
  if (file.size < SKIP_BELOW_BYTES) return keep("already small");
  if (typeof document === "undefined") return keep("no browser canvas");

  try {
    const img = await loadImage(file);
    const { width, height } = img;
    if (!width || !height) return keep("could not read dimensions");

    const scale = Math.min(1, MAX_EDGE / Math.max(width, height));
    const targetW = Math.round(width * scale);
    const targetH = Math.round(height * scale);

    const canvas = document.createElement("canvas");
    canvas.width = targetW;
    canvas.height = targetH;

    const ctx = canvas.getContext("2d");
    if (!ctx) return keep("no canvas context");

    // Better downscaling quality than the default nearest-neighbour.
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(img, 0, 0, targetW, targetH);

    // PNGs re-encode to JPEG only when they have no transparency to lose.
    // Detecting that reliably is expensive, so keep PNG as PNG and let the
    // resize alone do the work.
    const outType = file.type === "image/png" ? "image/png" : "image/jpeg";
    const blob = await canvasToBlob(canvas, outType);
    if (!blob) return keep("encoding failed");

    // If re-encoding didn't actually help, keep the original.
    if (blob.size >= originalBytes) return keep("original was already smaller");

    const renamed =
      outType === "image/jpeg" && !/\.jpe?g$/i.test(file.name)
        ? file.name.replace(/\.[^.]+$/, "") + ".jpg"
        : file.name;

    return {
      file: new File([blob], renamed, { type: outType, lastModified: Date.now() }),
      originalBytes,
      compressed: true,
    };
  } catch {
    return keep("compression unavailable");
  }
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}
