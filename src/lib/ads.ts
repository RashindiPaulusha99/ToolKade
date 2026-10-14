/** Ads render only when PUBLIC_ADS_ENABLED is exactly "true" and a publisher ID is set. */
export function adsEnabled(): boolean {
  return import.meta.env.PUBLIC_ADS_ENABLED === 'true' && Boolean(import.meta.env.PUBLIC_ADSENSE_CLIENT);
}

export function adsenseClient(): string {
  return import.meta.env.PUBLIC_ADSENSE_CLIENT ?? '';
}
