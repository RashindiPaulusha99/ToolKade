/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly PUBLIC_ADS_ENABLED?: string;
  readonly PUBLIC_ADSENSE_CLIENT?: string;
  readonly PUBLIC_FORM_ENDPOINT?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
