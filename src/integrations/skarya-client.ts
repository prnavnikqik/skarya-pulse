import axios, { AxiosInstance } from 'axios';
import fs from 'fs';
import path from 'path';

// We use the cookie defined in .env for prototype authentication
// or from the dynamically generated skarya-auth.json by the Authenticator Agent.
const SKARYA_API_URL = process.env.NEXT_PUBLIC_SKARYA_API_URL || 'https://pulse.karyaa.ai';

class SkaryaClient {
    public client: AxiosInstance;

    constructor() {
        this.client = axios.create({
            baseURL: SKARYA_API_URL,
            // Ensure we don't throw on error status codes, we want to handle them gracefully
            validateStatus: (status) => status < 500,
        });

        // Add request interceptor to dynamically inject the session cookie
        this.client.interceptors.request.use((config) => {
            let cookieToUse = process.env.SKARYA_COOKIE || process.env.SKARYA_SESSION_COOKIE || '';
            
            try {
                // Read from root skarya-auth.json since Next.js runs from project root
                const rootDir = process.cwd();
                const authFilePath = path.join(rootDir, 'skarya-auth.json');
                
                if (fs.existsSync(authFilePath)) {
                    const authData = JSON.parse(fs.readFileSync(authFilePath, 'utf-8'));
                    if (authData && authData.cookie) {
                        cookieToUse = authData.cookie;
                    }
                }
            } catch (e) {
                console.warn('[SkaryaClient] Could not read skarya-auth.json, falling back to ENV token.');
            }

            config.headers['Content-Type'] = 'application/json';
            
            if (cookieToUse) {
                config.headers['Cookie'] = cookieToUse;
            }
            return config;
        });

        // Response interceptor to detect expired cookies
        this.client.interceptors.response.use(
            (response) => {
                // Skarya often returns 200 with success: false and "Unauthorized" in the message
                if (response.data && response.data.success === false && 
                    (String(response.data.message).includes('Unauthorized') || String(response.data.message).includes('Please log in'))) {
                    console.error('🚨 [SkaryaClient] Detected 401/Unauthorized from API body. The session cookie in skarya-auth.json is likely expired.');
                    console.error('👉 Please run "node dataagent/agents/authenticator.js" again to refresh your session!');
                }
                return response;
            },
            (error) => {
                if (error.response && (error.response.status === 401 || error.response.status === 403)) {
                    console.error(`🚨 [SkaryaClient] HTTP ${error.response.status} Error. The session cookie is likely expired.`);
                    console.error('👉 Please run "node dataagent/agents/authenticator.js" again to refresh your session!');
                }
                return Promise.reject(error);
            }
        );
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
