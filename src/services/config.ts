const missingKeyValues = new Set([
  "",
  "PASTE_YOUR_FRED_API_KEY_HERE",
  "PASTE_YOUR_EIA_API_KEY_HERE",
  "your_fred_api_key_here",
  "your_eia_api_key_here",
]);

export const apiConfig = {
  fredApiKey: import.meta.env.VITE_FRED_API_KEY ?? "",
  eiaApiKey: import.meta.env.VITE_EIA_API_KEY ?? "",
};

export const hasApiKey = (value: string) => !missingKeyValues.has(value.trim());
