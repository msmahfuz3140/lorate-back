"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userRepository = exports.UserRepository = void 0;
const User_1 = require("../models/User");
const roles_1 = require("../shared/roles");
class UserRepository {
    async findById(id) {
        return User_1.UserModel.findById(id);
    }
    async findByEmail(email) {
        return User_1.UserModel.findOne({ email: email.toLowerCase().trim() });
    }
    async findByPhone(phone) {
        return User_1.UserModel.findOne({ phone: phone.trim() });
    }
    async findByIdentifier(identifier, altPhone) {
        const clean = identifier.trim();
        const query = [
            { email: clean.toLowerCase() },
            { phone: clean }
        ];
        if (altPhone && altPhone !== clean) {
            query.push({ phone: altPhone.trim() });
        }
        const digits = clean.replace(/[^\d]/g, '');
        if (digits.length === 11 && digits.startsWith('01')) {
            query.push({ phone: digits });
            query.push({ phone: `+88${digits}` });
            query.push({ phone: `+1${digits.slice(1)}` });
        }
        else if (digits.length === 13 && digits.startsWith('8801')) {
            query.push({ phone: `+${digits}` });
            query.push({ phone: `0${digits.slice(2)}` });
        }
        return User_1.UserModel.findOne({ $or: query });
    }
    async findByReferralCode(code) {
        return User_1.UserModel.findOne({ referralCode: code.toUpperCase().trim() });
    }
    async create(data) {
        return User_1.UserModel.create(data);
    }
    async updateVerification(id, updates) {
        return User_1.UserModel.findByIdAndUpdate(id, { $set: updates }, { new: true });
    }
    async updateRole(id, role) {
        return User_1.UserModel.findByIdAndUpdate(id, { $set: { role } }, { new: true });
    }
    async listModerators() {
        return User_1.UserModel.find({ role: roles_1.UserRole.MODERATOR }).sort({ createdAt: -1 });
    }
}
exports.UserRepository = UserRepository;
exports.userRepository = new UserRepository();
//# sourceMappingURL=user.repository.js.map