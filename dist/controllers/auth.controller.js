"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authController = exports.AuthController = void 0;
const auth_service_1 = require("../services/auth.service");
class AuthController {
    async register(req, res, next) {
        try {
            const result = await auth_service_1.authService.register(req.body, req.ip);
            res.status(201).json({
                success: true,
                data: result
            });
        }
        catch (error) {
            next(error);
        }
    }
    async login(req, res, next) {
        try {
            const result = await auth_service_1.authService.login(req.body);
            res.status(200).json({
                success: true,
                data: result
            });
        }
        catch (error) {
            next(error);
        }
    }
    async verifyOtp(req, res, next) {
        try {
            const result = await auth_service_1.authService.verifyOtp(req.body);
            res.status(200).json({
                success: true,
                message: 'Account successfully verified and activated',
                data: result
            });
        }
        catch (error) {
            next(error);
        }
    }
    async resendOtp(req, res, next) {
        try {
            const result = await auth_service_1.authService.resendOtp(req.body, req.ip);
            res.status(200).json({
                success: true,
                message: 'A fresh verification code has been dispatched',
                data: result
            });
        }
        catch (error) {
            next(error);
        }
    }
    async forgotPassword(req, res, next) {
        try {
            const result = await auth_service_1.authService.forgotPassword(req.body, req.ip);
            res.status(200).json({
                success: true,
                message: result.message
            });
        }
        catch (error) {
            next(error);
        }
    }
    async resetPassword(req, res, next) {
        try {
            const result = await auth_service_1.authService.resetPassword(req.body);
            res.status(200).json({
                success: true,
                message: result.message
            });
        }
        catch (error) {
            next(error);
        }
    }
    async changePassword(req, res, next) {
        try {
            await auth_service_1.authService.changePassword(req.user.id, req.body);
            res.status(200).json({
                success: true,
                message: 'Password successfully updated'
            });
        }
        catch (error) {
            next(error);
        }
    }
    async logout(req, res) {
        // Clear cookies and acknowledge session revocation
        res.clearCookie('token');
        res.status(200).json({
            success: true,
            message: 'Successfully logged out'
        });
    }
    async getMe(req, res) {
        res.status(200).json({
            success: true,
            data: req.user
        });
    }
    async updateProfile(req, res, next) {
        try {
            const user = await auth_service_1.authService.updateProfile(req.user.id, req.body);
            res.status(200).json({
                success: true,
                message: 'Profile successfully updated',
                data: { user }
            });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.AuthController = AuthController;
exports.authController = new AuthController();
//# sourceMappingURL=auth.controller.js.map