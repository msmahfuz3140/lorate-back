/**
 * Normalizes phone numbers to standard E.164 international format.
 * Examples:
 *   "+1 (415) 555-2671" -> "+14155552671"
 *   "01712345678" (Bangladesh local without CC) -> "+8801712345678" (if default country code provided)
 *   "+44 7911 123456"   -> "+447911123456"
 */
export declare function normalizePhoneNumber(rawPhone: string, defaultCountryCode?: string): string;
export declare function isValidE164(phone: string): boolean;
