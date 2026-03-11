import { APIRequestContext } from '@playwright/test';

const BASE_URL = process.env.SUPERDESK_URL ?? 'http://127.0.0.1:5001/api';

export class LiveblogApiClient {
    constructor(private request: APIRequestContext) {}

    async prepopulate(profile = 'test') {
        const response = await this.request.post(`${BASE_URL}/prepopulate`, {
            data: { profile },
            timeout: 40000,
        });

        if (!response.ok()) {
            throw new Error(`prepopulate failed: ${response.status()} ${await response.text()}`);
        }
    }

    async get<T>(path: string): Promise<T> {
        const response = await this.request.get(`${BASE_URL}${path}`);

        if (!response.ok()) {
            throw new Error(`GET ${path} failed: ${response.status()}`);
        }

        return response.json() as Promise<T>;
    }

    async post<T>(path: string, data: unknown): Promise<T> {
        const response = await this.request.post(`${BASE_URL}${path}`, { data });

        if (!response.ok()) {
            throw new Error(`POST ${path} failed: ${response.status()}`);
        }

        return response.json() as Promise<T>;
    }

    async delete(path: string): Promise<void> {
        const response = await this.request.delete(`${BASE_URL}${path}`);

        if (!response.ok()) {
            throw new Error(`DELETE ${path} failed: ${response.status()}`);
        }
    }
}
