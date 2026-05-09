import { env } from './env';

export function internalFetch(path: string, init?: RequestInit): Promise<Response> {
  return fetch(`${env.API_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers as Record<string, string>),
      'x-internal-token': env.INTERNAL_SERVICE_TOKEN,
    },
  });
}
