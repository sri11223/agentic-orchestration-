import axios, { AxiosRequestConfig } from 'axios';

export class HttpService {
  async request(config: AxiosRequestConfig) {
    try {
      const resp = await axios(requestConfigWithDefaults(config));
      return { success: true, status: resp.status, data: resp.data, headers: resp.headers };
    } catch (err: any) {
      console.error('HTTP request failed', err?.message || err);
      return { success: false, error: err?.message || String(err) };
    }
  }
}

function requestConfigWithDefaults(cfg: AxiosRequestConfig): AxiosRequestConfig {
  return { timeout: 15000, ...cfg };
}
