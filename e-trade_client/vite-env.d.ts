/// <reference types="vite/client" />

// Add typings for custom environment variables prefixed with VITE_
interface ImportMetaEnv {
  readonly VITE_CLOUDINARY_UPLOAD_URL?: string;
  readonly VITE_CLOUDINARY_UPLOAD_PRESET?: string;
  // add other VITE_ variables here as needed
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
