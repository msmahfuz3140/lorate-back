"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.hashPassword = hashPassword;
exports.comparePassword = comparePassword;
exports.generateOtpCode = generateOtpCode;
exports.generateRandomString = generateRandomString;
exports.generateSecretActivationCode = generateSecretActivationCode;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const crypto_1 = __importDefault(require("crypto"));
async function hashPassword(password) {
    const salt = await bcryptjs_1.default.genSalt(10);
    return bcryptjs_1.default.hash(password, salt);
}
async function comparePassword(password, hash) {
    return bcryptjs_1.default.compare(password, hash);
}
function generateOtpCode(length = 6) {
    const digits = '0123456789';
    let otp = '';
    const bytes = crypto_1.default.randomBytes(length);
    for (let i = 0; i < length; i++) {
        otp += digits[bytes[i] % 10];
    }
    return otp;
}
function generateRandomString(length = 32) {
    return crypto_1.default.randomBytes(Math.ceil(length / 2)).toString('hex').slice(0, length);
}
function generateSecretActivationCode() {
    const hex1 = crypto_1.default.randomBytes(2).toString('hex').toUpperCase();
    const hex2 = crypto_1.default.randomBytes(2).toString('hex').toUpperCase();
    return `VIP-${hex1}-${hex2}`;
}
//# sourceMappingURL=crypto.js.map