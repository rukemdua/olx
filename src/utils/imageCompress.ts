/**
 * compressImage
 * Mengompresi dan mengubah format gambar ke WebP sebelum diupload ke Supabase.
 * - Resize otomatis jika lebar/tinggi melebihi maxDimension
 * - Konversi ke format WebP dengan kualitas yang bisa dikonfigurasi
 * - Mengembalikan File baru siap upload
 */
export async function compressImage(
  file: File,
  options: {
    maxDimension?: number; // px, default 1280
    quality?: number;      // 0-1, default 0.82
    maxSizeKB?: number;    // KB, akan retry dengan quality lebih rendah jika masih besar
  } = {}
): Promise<File> {
  const { maxDimension = 1280, quality = 0.82, maxSizeKB = 800 } = options;

  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      // Hitung dimensi baru (pertahankan aspect ratio)
      let { width, height } = img;
      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          height = Math.round((height / width) * maxDimension);
          width = maxDimension;
        } else {
          width = Math.round((width / height) * maxDimension);
          height = maxDimension;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas context tidak tersedia'));
        return;
      }

      // Background putih (untuk PNG dengan transparansi)
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);

      // Fungsi konversi ke Blob WebP
      const tryConvert = (q: number) => {
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Gagal mengompresi gambar'));
              return;
            }

            // Jika masih terlalu besar dan quality masih bisa diturunkan, retry
            if (blob.size > maxSizeKB * 1024 && q > 0.5) {
              tryConvert(Math.max(q - 0.1, 0.5));
              return;
            }

            const compressedFile = new File(
              [blob],
              file.name.replace(/\.[^.]+$/, '') + '.webp',
              { type: 'image/webp', lastModified: Date.now() }
            );
            resolve(compressedFile);
          },
          'image/webp',
          q
        );
      };

      tryConvert(quality);
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      // Jika gagal kompresi, kembalikan file asli
      resolve(file);
    };

    img.src = objectUrl;
  });
}

/**
 * formatFileSize - Format ukuran file ke string yang mudah dibaca
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}
