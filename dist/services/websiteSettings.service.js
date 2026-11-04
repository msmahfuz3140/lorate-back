"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.websiteSettingsService = exports.WebsiteSettingsService = void 0;
exports.sanitizeHtmlContent = sanitizeHtmlContent;
const mongoose_1 = __importDefault(require("mongoose"));
const WebsiteSettings_1 = require("../models/WebsiteSettings");
const User_1 = require("../models/User");
const AuditLog_1 = require("../models/AuditLog");
const apiError_1 = require("../utils/apiError");
const roles_1 = require("../shared/roles");
const logger_1 = require("../utils/logger");
/**
 * Sanitizes rich-text and legal policy content to prevent arbitrary script and HTML injection.
 * Removes <script>, <iframe>, <object>, <embed>, javascript: links, and event attributes.
 */
function sanitizeHtmlContent(input) {
    if (!input)
        return '';
    return input
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
        .replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, '')
        .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
        .replace(/\bon\w+\s*=\s*(?:["'][^"']*["']|[^\s>]+)/gi, '') // Strip inline event handlers like onerror, onload
        .replace(/javascript:[^"'\s>]+/gi, '')
        .trim();
}
class WebsiteSettingsService {
    /**
     * Public settings for client-side branding, support, and legal policy pages
     */
    async getPublicSettings() {
        const settings = await WebsiteSettings_1.WebsiteSettingsModel.getSettings();
        return {
            siteName: settings.siteName,
            logoUrl: settings.logoUrl,
            faviconUrl: settings.faviconUrl,
            brandColors: settings.brandColors,
            supportContact: settings.supportContact,
            socialLinks: settings.socialLinks,
            homepageContent: settings.homepageContent,
            footerContent: settings.footerContent,
            faqItems: settings.faqItems,
            legalPolicies: settings.legalPolicies
        };
    }
    /**
     * Full settings for Main Admin panel
     */
    async getAdminSettings() {
        return WebsiteSettings_1.WebsiteSettingsModel.getSettings();
    }
    /**
     * Update website settings with sanitization and audit logging
     */
    async updateSettings(adminId, adminEmail, updates, reason) {
        if (!reason || reason.trim() === '') {
            throw apiError_1.ApiError.badRequest('Audit reason is required when modifying website content or settings');
        }
        const admin = await User_1.UserModel.findById(adminId);
        if (!admin || admin.role !== roles_1.UserRole.SUPER_ADMIN) {
            throw apiError_1.ApiError.forbidden('Only authorized Main Admins can update website settings');
        }
        const settings = await WebsiteSettings_1.WebsiteSettingsModel.getSettings();
        const previousSnapshot = {
            siteName: settings.siteName,
            brandColors: settings.brandColors,
            supportContact: settings.supportContact,
            homepageContent: settings.homepageContent
        };
        if (updates.siteName !== undefined)
            settings.siteName = updates.siteName.trim();
        if (updates.logoUrl !== undefined)
            settings.logoUrl = updates.logoUrl.trim();
        if (updates.faviconUrl !== undefined)
            settings.faviconUrl = updates.faviconUrl.trim();
        if (updates.brandColors) {
            settings.brandColors = {
                primary: updates.brandColors.primary?.trim() || settings.brandColors.primary,
                accent: updates.brandColors.accent?.trim() || settings.brandColors.accent,
                background: updates.brandColors.background?.trim() || settings.brandColors.background
            };
        }
        if (updates.supportContact) {
            settings.supportContact = {
                email: updates.supportContact.email?.trim() || settings.supportContact.email,
                telegram: updates.supportContact.telegram?.trim() || settings.supportContact.telegram,
                discord: updates.supportContact.discord?.trim() || settings.supportContact.discord
            };
        }
        if (updates.socialLinks) {
            settings.socialLinks = {
                twitter: updates.socialLinks.twitter?.trim() || settings.socialLinks.twitter,
                telegram: updates.socialLinks.telegram?.trim() || settings.socialLinks.telegram,
                youtube: updates.socialLinks.youtube?.trim() || settings.socialLinks.youtube,
                discord: updates.socialLinks.discord?.trim() || settings.socialLinks.discord
            };
        }
        if (updates.homepageContent) {
            settings.homepageContent = {
                heroTitle: sanitizeHtmlContent(updates.homepageContent.heroTitle || settings.homepageContent.heroTitle),
                heroSubtitle: sanitizeHtmlContent(updates.homepageContent.heroSubtitle || settings.homepageContent.heroSubtitle),
                announcementBanner: sanitizeHtmlContent(updates.homepageContent.announcementBanner || '')
            };
        }
        if (updates.footerContent) {
            settings.footerContent = {
                copyrightText: sanitizeHtmlContent(updates.footerContent.copyrightText || settings.footerContent.copyrightText),
                disclaimerText: sanitizeHtmlContent(updates.footerContent.disclaimerText || settings.footerContent.disclaimerText)
            };
        }
        if (updates.faqItems && Array.isArray(updates.faqItems)) {
            settings.faqItems = updates.faqItems.map((item, idx) => ({
                question: sanitizeHtmlContent(item.question),
                answer: sanitizeHtmlContent(item.answer),
                order: item.order !== undefined ? item.order : idx + 1
            }));
        }
        if (updates.legalPolicies) {
            settings.legalPolicies = {
                termsAndConditions: sanitizeHtmlContent(updates.legalPolicies.termsAndConditions || settings.legalPolicies.termsAndConditions),
                privacyPolicy: sanitizeHtmlContent(updates.legalPolicies.privacyPolicy || settings.legalPolicies.privacyPolicy),
                subscriptionPolicy: sanitizeHtmlContent(updates.legalPolicies.subscriptionPolicy || settings.legalPolicies.subscriptionPolicy),
                referralPolicy: sanitizeHtmlContent(updates.legalPolicies.referralPolicy || settings.legalPolicies.referralPolicy)
            };
        }
        settings.updatedByAdminId = new mongoose_1.default.Types.ObjectId(adminId);
        settings.updatedByAdminEmail = adminEmail;
        await settings.save();
        await AuditLog_1.AuditLogModel.create({
            action: 'WEBSITE_SETTINGS_UPDATE',
            adminId: new mongoose_1.default.Types.ObjectId(adminId),
            adminEmail,
            reason: reason.trim(),
            previousValue: previousSnapshot,
            newValue: {
                siteName: settings.siteName,
                brandColors: settings.brandColors,
                supportContact: settings.supportContact,
                homepageContent: settings.homepageContent
            },
            details: {
                sanitized: true,
                note: 'All rich content fields verified and sanitized against script injection.'
            }
        });
        logger_1.logger.info(`Main Admin ${adminEmail} updated website settings. Reason: ${reason}`);
        return settings;
    }
}
exports.WebsiteSettingsService = WebsiteSettingsService;
exports.websiteSettingsService = new WebsiteSettingsService();
//# sourceMappingURL=websiteSettings.service.js.map