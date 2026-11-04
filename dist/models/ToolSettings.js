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
exports.ToolSettingsModel = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const ToolSettingsSchema = new mongoose_1.Schema({
    isToolEnabled: {
        type: Boolean,
        default: true
    },
    maintenanceMode: {
        type: Boolean,
        default: false
    },
    publicStatusMessage: {
        type: String,
        default: 'All roulette prediction systems and real-time feeds are operating normally.'
    },
    toolVersion: {
        type: String,
        default: 'v2.5.0-pro'
    },
    toolAccessPolicy: {
        type: String,
        enum: ['PREMIUM_ONLY', 'OPEN_BETA', 'MAINTENANCE'],
        default: 'PREMIUM_ONLY'
    },
    premiumRequirements: {
        type: String,
        default: 'Active paid subscription or authorized administrator credential required for live table access.'
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
ToolSettingsSchema.statics.getSettings = async function () {
    let doc = await this.findOne();
    if (!doc) {
        doc = await this.create({
            isToolEnabled: true,
            maintenanceMode: false,
            publicStatusMessage: 'All roulette prediction systems and real-time feeds are operating normally.',
            toolVersion: 'v2.5.0-pro',
            toolAccessPolicy: 'PREMIUM_ONLY',
            premiumRequirements: 'Active paid subscription or authorized administrator credential required for live table access.'
        });
    }
    return doc;
};
exports.ToolSettingsModel = mongoose_1.default.models.ToolSettings ||
    mongoose_1.default.model('ToolSettings', ToolSettingsSchema);
//# sourceMappingURL=ToolSettings.js.map