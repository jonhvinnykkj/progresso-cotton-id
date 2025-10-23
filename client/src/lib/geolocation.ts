export interface GeoLocation {
  latitude: string;
  longitude: string;
  accuracy?: number;
}

export async function getCurrentPosition(): Promise<GeoLocation> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocalização não é suportada neste navegador"));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude.toString(),
          longitude: position.coords.longitude.toString(),
          accuracy: position.coords.accuracy,
        });
      },
      (error) => {
        let errorMessage = "Erro ao obter localização";
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = "Permissão de localização negada. Por favor, habilite nas configurações.";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = "Localização indisponível";
            break;
          case error.TIMEOUT:
            errorMessage = "Tempo esgotado ao obter localização";
            break;
        }
        reject(new Error(errorMessage));
      },
      {
        enableHighAccuracy: true,
        timeout: 3000, // 3 segundos - reduzido para não travar o fluxo
        maximumAge: 0,
      }
    );
  });
}

export function formatCoordinates(lat?: string | null, lon?: string | null): string {
  if (!lat || !lon) return "Coordenadas não disponíveis";
  return `${parseFloat(lat).toFixed(6)}, ${parseFloat(lon).toFixed(6)}`;
}
