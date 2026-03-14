// src/utils/cloudinary.ts
// Helper functions to upload images to Cloudinary. Requires environment variables:
// VITE_CLOUDINARY_UPLOAD_URL (should be the HTTPS API endpoint) and
// VITE_CLOUDINARY_UPLOAD_PRESET (unsigned preset name).

export async function uploadToCloudinary(file: File): Promise<string> {
  // example value for VITE_CLOUDINARY_UPLOAD_URL:
  // "https://api.cloudinary.com/v1_1/<cloud_name>/upload"
  const url = import.meta.env.VITE_CLOUDINARY_UPLOAD_URL;
  const preset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

  if (!url || !preset) {
    throw new Error('Cloudinary upload URL or preset not configured');
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', preset);

  const res = await fetch(url, {
    method: 'POST',
    body: formData
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error('Upload failed: ' + text);
  }

  const data = await res.json();
  return data.secure_url;
}

export async function uploadMultiple(files: File[]): Promise<string[]> {
  const promises = files.map(uploadToCloudinary);
  return Promise.all(promises);
}