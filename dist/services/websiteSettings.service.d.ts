import { IWebsiteSettings } from '../models/WebsiteSettings';
/**
 * Sanitizes rich-text and legal policy content to prevent arbitrary script and HTML injection.
 * Removes <script>, <iframe>, <object>, <embed>, javascript: links, and event attributes.
 */
export declare function sanitizeHtmlContent(input: string): string;
export declare class WebsiteSettingsService {
    /**
     * Public settings for client-side branding, support, and legal policy pages
     */
    getPublicSettings(): Promise<Partial<IWebsiteSettings>>;
    /**
     * Full settings for Main Admin panel
     */
    getAdminSettings(): Promise<IWebsiteSettings>;
    /**
     * Update website settings with sanitization and audit logging
     */
    updateSettings(adminId: string, adminEmail: string, updates: Partial<IWebsiteSettings>, reason: string): Promise<IWebsiteSettings>;
}
export declare const websiteSettingsService: WebsiteSettingsService;
