import { useQuery } from '@tanstack/react-query';

export interface Settings {
  defaultSafra: string;
}

async function fetchSettings(): Promise<Settings> {
  const response = await fetch('/api/settings/default-safra');
  if (!response.ok) {
    throw new Error('Failed to fetch settings');
  }
  const data = await response.json();
  return { defaultSafra: data.value };
}

export function useSettings() {
  return useQuery({
    queryKey: ['settings'],
    queryFn: fetchSettings,
    staleTime: 300000, // 5 minutos
  });
}
