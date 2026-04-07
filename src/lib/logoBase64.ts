import schoolLogo from "@/assets/school-logo.png";

// Cache the base64 conversion
let cachedBase64: string | null = null;

export const getLogoBase64 = async (): Promise<string> => {
  if (cachedBase64) return cachedBase64;
  try {
    const response = await fetch(schoolLogo);
    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        cachedBase64 = reader.result as string;
        resolve(cachedBase64);
      };
      reader.readAsDataURL(blob);
    });
  } catch {
    return "";
  }
};

// For synchronous usage in print HTML, we preload it
let preloadedBase64 = "";

export const preloadLogo = async () => {
  preloadedBase64 = await getLogoBase64();
};

export const getPreloadedLogo = () => preloadedBase64;

// Auto-preload on import
preloadLogo();
