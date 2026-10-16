import { getApiUrl } from './api-url';
import { getToken } from './session';

/**
 * Minimal fetch wrapper for the raw-API islands (React components and
 * framework-agnostic modules) that cannot or must not go through Angular's
 * `api` service. Prefixes the API url, attaches the session token, handles
 * JSON encoding and extracts server error messages.
 *
 * Angular code should keep using the `api` service; calls that need
 * non-standard fetch options (keepalive, custom conditional headers) stay
 * on raw fetch.
 */

export class ApiError extends Error {
    status: number;
    payload: any;

    constructor(message: string, status: number, payload: any = null) {
        super(message);
        this.status = status;
        this.payload = payload;
        // keep instanceof working with an es5 compile target
        Object.setPrototypeOf(this, ApiError.prototype);
    }
}

interface IApiOptions {
    anonymous?: boolean;
    headers?: { [key: string]: string };
}

const extractErrorMessage = (payload: any): string => {
    if (!payload) {
        return 'Request failed.';
    }

    return payload._message
        || (typeof payload._error === 'string' ? payload._error : payload._error && payload._error.message)
        || payload.message
        || 'Request failed.';
};

export const apiRequest = async(
    method: string, path: string, body?: any, options: IApiOptions = {}
): Promise<any> => {
    const headers: { [key: string]: string } = { ...(options.headers || {}) };
    const token = getToken();

    if (!options.anonymous && token) {
        headers.Authorization = token;
    }

    if (body !== undefined) {
        headers['Content-Type'] = 'application/json';
    }

    const response = await fetch(getApiUrl() + path, {
        method: method,
        headers: headers,
        body: body !== undefined ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
        let payload = null;

        try {
            payload = await response.json();
        } catch (error) {
            // non-JSON error body, keep the generic message
        }

        throw new ApiError(extractErrorMessage(payload), response.status, payload);
    }

    const text = await response.text();

    return text ? JSON.parse(text) : null;
};

export const apiGet = (path: string, options?: IApiOptions): Promise<any> =>
    apiRequest('GET', path, undefined, options);

export const apiPost = (path: string, body?: any, options?: IApiOptions): Promise<any> =>
    apiRequest('POST', path, body, options);
