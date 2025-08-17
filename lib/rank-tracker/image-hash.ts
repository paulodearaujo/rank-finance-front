"use client";

/**
 * Compute a 64-bit difference hash (dHash) for an image URL.
 * Uses a 9x8 grayscale downsample and compares adjacent pixels.
 * Returns a 16-char hex string, or null if the image cannot be read.
 */
export async function computeDHash(url: string): Promise<string | null> {
  try {
    // Prefer blob/data URLs to avoid CORS-tainted canvas. For http(s) we still try with crossOrigin.
    const img = await loadImage(url);
    const width = 9;
    const height = 8;
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    // High-quality downscale hints
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(img, 0, 0, width, height);
    // If canvas is tainted, getImageData will throw
    const { data } = ctx.getImageData(0, 0, width, height);
    // Compute brightness for each pixel (luma approximation)
    const lum = new Array<number>(width * height);
    for (let i = 0; i < lum.length; i++) {
      const idx = i * 4;
      const r = data[idx] ?? 0;
      const g = data[idx + 1] ?? 0;
      const b = data[idx + 2] ?? 0;
      lum[i] = 0.299 * r + 0.587 * g + 0.114 * b;
    }
    // Compare adjacent pixels horizontally to build 64 bits
    const bits: number[] = [];
    for (let y = 0; y < 8; y++) {
      for (let x = 0; x < 8; x++) {
        const i1 = y * width + x;
        const i2 = y * width + (x + 1);
        const a = lum[i1] ?? 0;
        const b = lum[i2] ?? 0;
        bits.push(a > b ? 1 : 0);
      }
    }
    // Convert bits to hex string
    let hex = "";
    for (let i = 0; i < 64; i += 4) {
      const n0 = bits[i] ?? 0;
      const n1 = bits[i + 1] ?? 0;
      const n2 = bits[i + 2] ?? 0;
      const n3 = bits[i + 3] ?? 0;
      const nibble = (n0 << 3) | (n1 << 2) | (n2 << 1) | n3;
      hex += nibble.toString(16);
    }
    return hex;
  } catch {
    return null;
  }
}

/**
 * Compute Hamming distance between two hex-encoded dHashes.
 */
export function hammingDistance(a: string | null, b: string | null): number {
  if (!a || !b || a.length !== b.length) return Number.POSITIVE_INFINITY;
  let dist = 0;
  for (let i = 0; i < a.length; i++) {
    const na = parseInt(a[i] ?? "0", 16);
    const nb = parseInt(b[i] ?? "0", 16);
    const xor = na ^ nb;
    dist += popcount4(xor);
  }
  return dist;
}

function popcount4(n: number): number {
  // n is 0..15
  switch (n & 0xf) {
    case 0:
      return 0;
    case 1:
    case 2:
    case 4:
    case 8:
      return 1;
    case 3:
    case 5:
    case 6:
    case 9:
    case 10:
    case 12:
      return 2;
    case 7:
    case 11:
    case 13:
    case 14:
      return 3;
    default:
      return 4;
  }
}

async function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    // Try anonymous to avoid taint when supported
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("image load error"));
    img.decoding = "async";
    img.src = url;
  });
}
