"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizePhoneNumber = normalizePhoneNumber;
exports.isValidE164 = isValidE164;
/**
 * Normalizes phone numbers to standard E.164 international format.
 * Examples:
 *   "+1 (415) 555-2671" -> "+14155552671"
 *   "01712345678" (Bangladesh local without CC) -> "+8801712345678" (if default country code provided)
 *   "+44 7911 123456"   -> "+447911123456"
 */
function normalizePhoneNumber(rawPhone, defaultCountryCode = '+1') {
    const trimmed = rawPhone.trim();
    // Strip out spaces, dashes, parentheses, dots
    let cleaned = trimmed.replace(/[\s\-\(\)\.]/g, '');
    if (cleaned.startsWith('+')) {
        cleaned = '+' + cleaned.replace(/[^\d]/g, '');
    }
    else if (cleaned.startsWith('00')) {
        cleaned = '+' + cleaned.slice(2).replace(/[^\d]/g, '');
    }
    else {
        const digitsOnly = cleaned.replace(/[^\d]/g, '');
        if (digitsOnly.length === 11 && digitsOnly.startsWith('1')) {
            cleaned = '+' + digitsOnly;
        }
        else if (digitsOnly.length === 10) {
            cleaned = '+1' + digitsOnly;
        }
        else {
            const cc = defaultCountryCode.replace(/\+/, '');
            cleaned = '+' + cc + digitsOnly.replace(/^0+/, '');
        }
    }
    // Validate E.164 structure: '+' followed by 7 to 15 digits
    const e164Regex = /^\+[1-9]\d{6,14}$/;
    if (!e164Regex.test(cleaned)) {
        throw new Error('Invalid phone number format. Must conform to international E.164 standards (e.g. +14155552671)');
    }
    return cleaned;
}
function isValidE164(phone) {
    return /^\+[1-9]\d{6,14}$/.test(phone.trim());
}
//# sourceMappingURL=phone.js.map