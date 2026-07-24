import { APIRequestContext } from '@playwright/test';
import { API_BASE } from '../config';

export interface Credentials {
    username: string;
    password: string;
}

export interface ApiResponse<T = unknown> {
    status: number;
    ok: boolean;
    body: T;
}

// Personas seeded by the prepopulate test profile. Single source of truth
// for the seeded credentials; fixtures and seed constants build on it.
export const PERSONAS = {
    admin: { username: 'admin', password: 'admin' },
    editor: { username: 'editor', password: 'editor' },
    contributor: { username: 'contributor', password: 'contributor' },
    support: { username: 'support', password: 'support' },
} satisfies Record<string, Credentials>;

export type PersonaName = keyof typeof PERSONAS;

export interface RequestOptions {
    // Who the request authenticates as: a seeded persona name or explicit
    // credentials (e.g. a user created within the test). Omit for anonymous.
    as?: PersonaName | Credentials;
    timeout?: number;
}

/**
 * Thin wrapper over Playwright's APIRequestContext: prefixes API_BASE, logs
 * in lazily per user and caches the token for the client's lifetime (one
 * test, via the `api` fixture), and returns status plus parsed body without
 * throwing on non-2xx so specs can assert error responses directly.
 */
export class ApiClient {
    private tokens = new Map<string, string>();

    constructor(private request: APIRequestContext) {}

    async login(credentials: Credentials): Promise<string> {
        const cached = this.tokens.get(credentials.username);
        if (cached) {
            return cached;
        }

        // Callers may pass richer objects (e.g. SeedUser); auth_db rejects
        // unknown fields, so send only the credentials.
        const response = await this.post<{ token: string }>('/auth_db', {
            username: credentials.username,
            password: credentials.password,
        });
        if (!response.ok) {
            throw new Error(`login as ${credentials.username} failed: ${response.status} ${JSON.stringify(response.body)}`);
        }

        this.tokens.set(credentials.username, response.body.token);
        return response.body.token;
    }

    async get<T = unknown>(path: string, options: RequestOptions = {}): Promise<ApiResponse<T>> {
        return this.send('get', path, undefined, options);
    }

    async post<T = unknown>(path: string, data?: unknown, options: RequestOptions = {}): Promise<ApiResponse<T>> {
        return this.send('post', path, data, options);
    }

    async delete<T = unknown>(path: string, options: RequestOptions = {}): Promise<ApiResponse<T>> {
        return this.send('delete', path, undefined, options);
    }

    async prepopulate(profile = 'test'): Promise<void> {
        const response = await this.post('/prepopulate', { profile }, { timeout: 40000 });
        if (!response.ok) {
            throw new Error(`prepopulate returned ${response.status} ${JSON.stringify(response.body)}`);
        }
    }

    private resolveCredentials(as: PersonaName | Credentials): Credentials {
        return typeof as === 'string' ? PERSONAS[as] : as;
    }

    private async send<T>(
        method: 'get' | 'post' | 'delete',
        path: string,
        data: unknown,
        options: RequestOptions,
    ): Promise<ApiResponse<T>> {
        const headers: Record<string, string> = {};

        if (options.as) {
            const token = await this.login(this.resolveCredentials(options.as));
            headers.Authorization = `Basic ${Buffer.from(`${token}:`).toString('base64')}`;
        }

        const response = await this.request[method](`${API_BASE}${path}`, {
            headers,
            data,
            timeout: options.timeout,
        });

        let body: T;
        try {
            body = await response.json() as T;
        } catch {
            body = undefined as T;
        }

        return { status: response.status(), ok: response.ok(), body };
    }
}
