import mongoose, { Document } from 'mongoose';
export interface IFaqItem {
    question: string;
    answer: string;
    order: number;
}
export interface IWebsiteSettings extends Document {
    siteName: string;
    logoUrl: string;
    faviconUrl: string;
    brandColors: {
        primary: string;
        accent: string;
        background: string;
    };
    supportContact: {
        email: string;
        telegram: string;
        discord: string;
    };
    socialLinks: {
        twitter: string;
        telegram: string;
        youtube: string;
        discord: string;
    };
    homepageContent: {
        heroTitle: string;
        heroSubtitle: string;
        announcementBanner: string;
    };
    footerContent: {
        copyrightText: string;
        disclaimerText: string;
    };
    faqItems: IFaqItem[];
    legalPolicies: {
        termsAndConditions: string;
        privacyPolicy: string;
        subscriptionPolicy: string;
        referralPolicy: string;
    };
    updatedByAdminId?: mongoose.Types.ObjectId;
    updatedByAdminEmail?: string;
    createdAt: Date;
    updatedAt: Date;
}
export interface IWebsiteSettingsModel extends mongoose.Model<IWebsiteSettings> {
    getSettings(): Promise<IWebsiteSettings>;
}
export declare const WebsiteSettingsModel: IWebsiteSettingsModel;
