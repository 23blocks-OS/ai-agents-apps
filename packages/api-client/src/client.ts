export interface ApiConfig {
  baseUrl: string;
  apiKey: string;
  authToken: string;
}

export interface ApiClient {
  get<T>(path: string, params?: Record<string, string>): Promise<T>;
  post<T>(path: string, body?: unknown): Promise<T>;
  put<T>(path: string, body?: unknown): Promise<T>;
  patch<T>(path: string, body?: unknown): Promise<T>;
  delete<T>(path: string): Promise<T>;
}

export function createApiClient(config: ApiConfig): ApiClient {
  const { baseUrl, apiKey, authToken } = config;

  async function request<T>(
    method: string,
    path: string,
    body?: unknown,
    params?: Record<string, string>
  ): Promise<T> {
    let url = `${baseUrl}${path}`;

    if (params) {
      const searchParams = new URLSearchParams(params);
      url += `?${searchParams.toString()}`;
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'AppId': apiKey,
      'Authorization': `Bearer ${authToken}`
    };

    const response = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`API Error ${response.status}: ${errorBody}`);
    }

    return response.json();
  }

  return {
    get: <T>(path: string, params?: Record<string, string>) =>
      request<T>('GET', path, undefined, params),
    post: <T>(path: string, body?: unknown) =>
      request<T>('POST', path, body),
    put: <T>(path: string, body?: unknown) =>
      request<T>('PUT', path, body),
    patch: <T>(path: string, body?: unknown) =>
      request<T>('PATCH', path, body),
    delete: <T>(path: string) =>
      request<T>('DELETE', path)
  };
}

/**
 * Create API client from environment variables
 */
export function createApiClientFromEnv(): ApiClient {
  const baseUrl = process.env.BLOCKS_API_URL;
  const apiKey = process.env.BLOCKS_API_KEY;
  const authToken = process.env.BLOCKS_AUTH_TOKEN;

  if (!baseUrl || !apiKey || !authToken) {
    throw new Error(
      'Missing required environment variables: BLOCKS_API_URL, BLOCKS_API_KEY, BLOCKS_AUTH_TOKEN'
    );
  }

  return createApiClient({ baseUrl, apiKey, authToken });
}
