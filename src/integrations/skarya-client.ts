import axios, { AxiosInstance } from 'axios';

// We use the cookie defined in .env for prototype authentication
// or hardcoded tokens if cookie is unavailable.
const SKARYA_API_URL = process.env.NEXT_PUBLIC_SKARYA_API_URL || 'https://pulse.karyaa.ai';
const SKARYA_COOKIE = process.env.SKARYA_COOKIE || process.env.SKARYA_SESSION_COOKIE || '';

class SkaryaClient {
    public client: AxiosInstance;

    constructor() {
        this.client = axios.create({
            baseURL: SKARYA_API_URL,
            headers: {
                'Content-Type': 'application/json',
                'Cookie': SKARYA_COOKIE,
            },
            // Ensure we don't throw on error status codes, we want to handle them gracefully
            validateStatus: (status) => status < 500,
        });
    }

    /**
     * Universal GET wrapper
     */
    async get<T>(url: string, params?: Record<string, string>): Promise<{ success: boolean; data: T; message?: string }> {
        try {
            const qs = params ? `?${new URLSearchParams(params).toString()}` : '';
            const response = await this.client.get(`${url}${qs}`);
            return response.data;
        } catch (error: any) {
            console.error(`[Skarya API Error: GET ${url}]`, error.message);
            return { success: false, data: null as any, message: error.message };
        }
    }

    /**
     * Universal POST wrapper
     */
    async post<T>(url: string, data: any): Promise<{ success: boolean; data: T; message?: string }> {
        try {
            const response = await this.client.post(url, data);
            return response.data;
        } catch (error: any) {
            console.error(`[Skarya API Error: POST ${url}]`, error.message);
            return { success: false, data: null as any, message: error.message };
        }
    }

    /**
     * Universal PUT wrapper
     */
    async put<T>(url: string, data: any): Promise<{ success: boolean; data: T; message?: string }> {
        try {
            const response = await this.client.put(url, data);
            return response.data;
        } catch (error: any) {
            console.error(`[Skarya API Error: PUT ${url}]`, error.message);
            return { success: false, data: null as any, message: error.message };
        }
    }

    /**
     * Universal PATCH wrapper
     */
    async patch<T>(url: string, data: any): Promise<{ success: boolean; data: T; message?: string }> {
        try {
            const response = await this.client.patch(url, data);
            return response.data;
        } catch (error: any) {
            console.error(`[Skarya API Error: PATCH ${url}]`, error.message);
            return { success: false, data: null as any, message: error.message };
        }
    }
}

// Singleton instance
export const skaryaClient = new SkaryaClient();
