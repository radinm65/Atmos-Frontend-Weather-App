/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** `live` (default) or `snapshot`. Public, non-secret. See docs/TRD.md §4a. */
  readonly VITE_DATA_SOURCE?: string
}
