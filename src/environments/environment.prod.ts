import { apiUrl } from './environment.generated';

export const environment = { production: true, apiUrl, apiBaseUrl: apiUrl } as const;
