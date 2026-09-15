/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Absolute API origin for the Android build; empty in the browser (Vite proxies /api). */
  readonly VITE_API_BASE?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
