"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebsiteSettingsModel = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const FaqItemSchema = new mongoose_1.Schema({
    question: { type: String, required: true },
    answer: { type: String, required: true },
    order: { type: Number, default: 0 }
});
const WebsiteSettingsSchema = new mongoose_1.Schema({
    siteName: {
        type: String,
        default: 'Roulette.tools'
    },
    logoUrl: {
        type: String,
        default: '/logo.png'
    },
    faviconUrl: {
        type: String,
        default: '/favicon.ico'
    },
    brandColors: {
        primary: { type: String, default: '#f59e0b' },
        accent: { type: String, default: '#10b981' },
        background: { type: String, default: '#06080d' }
    },
    supportContact: {
        email: { type: String, default: 'support@roulette.tools' },
        telegram: { type: String, default: 'https://t.me/roulettetools_support' },
        discord: { type: String, default: '' }
    },
    socialLinks: {
        twitter: { type: String, default: 'https://x.com/roulettetools' },
        telegram: { type: String, default: 'https://t.me/roulettetools' },
        youtube: { type: String, default: '' },
        discord: { type: String, default: '' }
    },
    homepageContent: {
        heroTitle: { type: String, default: 'Algorithmic Roulette Intelligence & Statistical Wheel Tracking' },
        heroSubtitle: { type: String, default: 'Real-time telemetry and pattern identification for European Roulette live tables. Professional grade SaaS analytics.' },
        announcementBanner: { type: String, default: '' }
    },
    footerContent: {
        copyrightText: { type: String, default: '© 2026 Roulette.tools. All rights reserved.' },
        disclaimerText: { type: String, default: 'Roulette.tools is an analytical SaaS tool. We do not accept bets or operate gaming services.' }
    },
    faqItems: {
        type: [FaqItemSchema],
        default: [
            {
                question: 'How does the prediction software work?',
                answer: 'The platform ingests live wheel telemetry and calculates sector probabilities based on physical wheel biases, dealer signature deviations, and offset patterns on European single-zero wheels.',
                order: 1
            },
            {
                question: 'Does the software guarantee winning spins?',
                answer: 'No. European Roulette retains an inherent 2.70% house edge. Our software delivers mathematical edge identification, not absolute outcome prediction.',
                order: 2
            },
            {
                question: 'Which cryptocurrencies are supported for subscriptions?',
                answer: 'We accept USDT (TRC-20, ERC-20, BEP-20), BTC, ETH, TRX, LTC, SOL, DOGE, and USDC via NOWPayments gateway.',
                order: 3
            }
        ]
    },
    legalPolicies: {
        termsAndConditions: { type: String, default: '' },
        privacyPolicy: { type: String, default: '' },
        subscriptionPolicy: { type: String, default: '' },
        referralPolicy: { type: String, default: '' }
    },
    updatedByAdminId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User'
    },
    updatedByAdminEmail: {
        type: String
    }
}, {
    timestamps: true
});
WebsiteSettingsSchema.statics.getSettings = async function () {
    let doc = await this.findOne();
    if (!doc) {
        doc = await this.create({});
    }
    return doc;
};
exports.WebsiteSettingsModel = mongoose_1.default.models.WebsiteSettings ||
    mongoose_1.default.model('WebsiteSettings', WebsiteSettingsSchema);
//# sourceMappingURL=WebsiteSettings.js.map