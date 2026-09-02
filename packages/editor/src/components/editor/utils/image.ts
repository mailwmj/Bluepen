/**
 * Utility functions for image processing, dimension extraction, and clipboard handling.
 */

export interface ProcessedImage {
  dataUrl: string;
  width: number;
  height: number;
  naturalWidth: number;
  naturalHeight: number;
  name: string;
}

/**
 * Checks whether a File or Blob is an image based on MIME type or filename extension.
 */
export function isImageFile(file: Blob | File): boolean {
  if (file.type && file.type.startsWith("image/")) return true;
  const fileName = (file as File).name;
  if (fileName && /\.(png|jpe?g|webp|gif|svg|bmp|ico|avif)$/i.test(fileName)) {
    return true;
  }
  return false;
}

/**
 * Converts a base64 Data URL to a Blob.
 */
export function dataUrlToBlob(dataUrl: string): Blob | null {
  try {
    if (!dataUrl || typeof dataUrl !== "string") return null;
    const parts = dataUrl.split(",");
    if (parts.length < 2) return null;
    const match = parts[0].match(/:(.*?);/);
    const mime = match ? match[1] : "image/png";
    const byteString = atob(parts[1]);
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    return new Blob([ia], { type: mime });
  } catch {
    return null;
  }
}

/**
 * Reads an image File or Blob, extracts dimensions, and optionally scales it down
 * if it exceeds maxCanvasDimension to avoid bloating document state.
 */
export async function processImageFile(
  file: Blob | File,
  maxDimension = 1600,
  preferredMaxWidth = 600,
): Promise<ProcessedImage> {
  const fileName = (file as File).name || "Image";

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      const rawDataUrl = reader.result as string;
      const img = new Image();

      img.onload = () => {
        const naturalWidth = img.naturalWidth || img.width || 400;
        const naturalHeight = img.naturalHeight || img.height || 300;

        let finalDataUrl = rawDataUrl;

        // Re-encode via offscreen canvas if dimensions exceed maxDimension or raw size is heavy
        const needsOptimization = naturalWidth > maxDimension || naturalHeight > maxDimension || rawDataUrl.length > 400000;

        if (needsOptimization) {
          const scale = Math.min(1, maxDimension / naturalWidth, maxDimension / naturalHeight);
          const scaledWidth = Math.round(naturalWidth * scale);
          const scaledHeight = Math.round(naturalHeight * scale);

          const canvas = document.createElement("canvas");
          canvas.width = scaledWidth;
          canvas.height = scaledHeight;
          const ctx = canvas.getContext("2d");

          if (ctx) {
            ctx.drawImage(img, 0, 0, scaledWidth, scaledHeight);
            const isPng = file.type === "image/png" || rawDataUrl.startsWith("data:image/png");
            if (isPng && rawDataUrl.length < 800000) {
              finalDataUrl = canvas.toDataURL("image/png");
            } else {
              finalDataUrl = canvas.toDataURL("image/jpeg", 0.88);
            }
          }
        }

        // Calculate initial display dimensions on canvas (preserving aspect ratio)
        let displayWidth = naturalWidth;
        let displayHeight = naturalHeight;

        if (displayWidth > preferredMaxWidth) {
          const ratio = preferredMaxWidth / displayWidth;
          displayWidth = preferredMaxWidth;
          displayHeight = Math.round(naturalHeight * ratio);
        }

        // Minimum boundary safety
        displayWidth = Math.max(40, Math.round(displayWidth));
        displayHeight = Math.max(40, Math.round(displayHeight));

        resolve({
          dataUrl: finalDataUrl,
          width: displayWidth,
          height: displayHeight,
          naturalWidth,
          naturalHeight,
          name: fileName.replace(/\.[^/.]+$/, "") || "Image",
        });
      };

      img.onerror = () => {
        reject(new Error("Failed to load image metadata"));
      };

      img.src = rawDataUrl;
    };

    reader.onerror = () => {
      reject(new Error("Failed to read image file"));
    };

    reader.readAsDataURL(file);
  });
}

/**
 * Extracts the first image file or Blob from clipboard items or data transfer items.
 */
export function extractImageFromClipboardData(
  clipboardData: DataTransfer | null,
): Blob | File | null {
  if (!clipboardData) return null;

  // 1. Check items list (DataTransferItemList)
  if (clipboardData.items && clipboardData.items.length > 0) {
    for (let i = 0; i < clipboardData.items.length; i++) {
      const item = clipboardData.items[i];
      if (item.type && item.type.startsWith("image/")) {
        const file = item.getAsFile();
        if (file) return file;
      }
    }
  }

  // 2. Check files list (FileList)
  if (clipboardData.files && clipboardData.files.length > 0) {
    for (let i = 0; i < clipboardData.files.length; i++) {
      const file = clipboardData.files[i];
      if (isImageFile(file)) {
        return file;
      }
    }
  }

  // 3. Check HTML content for embedded image data URL or img tags
  try {
    const html = clipboardData.getData ? clipboardData.getData("text/html") : "";
    if (html) {
      const match = html.match(/<img[^>]+src=["'](data:image\/[^"']+)["']/i);
      if (match && match[1]) {
        const blob = dataUrlToBlob(match[1]);
        if (blob) return blob;
      }
    }
  } catch {
    // Ignore HTML parsing errors
  }

  return null;
}
