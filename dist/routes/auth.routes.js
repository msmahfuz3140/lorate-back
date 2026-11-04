"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRoutes = void 0;
const express_1 = require("express");
const auth_controller_1 = require("../controllers/auth.controller");
const validate_middleware_1 = require("../middleware/validate.middleware");
const rateLimit_middleware_1 = require("../middleware/rateLimit.middleware");
const auth_1 = require("../shared/auth");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
// Registration with rate limiting (5 attempts per 15 minutes)
router.post('/register', (0, rateLimit_middleware_1.rateLimit)(5, 15, 'register'), (0, validate_middleware_1.validate)(auth_1.RegisterSchema), (req, res, next) => {
    auth_controller_1.authController.register(req, res, next);
});
// Login with rate limiting (10 attempts per 15 minutes)
router.post('/login', (0, rateLimit_middleware_1.rateLimit)(10, 15, 'login'), (0, validate_middleware_1.validate)(auth_1.LoginSchema), (req, res, next) => {
    auth_controller_1.authController.login(req, res, next);
});
// OTP Verification (10 attempts per 15 minutes)
router.post('/verify-otp', (0, rateLimit_middleware_1.rateLimit)(10, 15, 'verify'), (0, validate_middleware_1.validate)(auth_1.VerifyOtpSchema), (req, res, next) => {
    auth_controller_1.authController.verifyOtp(req, res, next);
});
// OTP Resend (3 attempts per 15 minutes)
router.post('/resend-otp', (0, rateLimit_middleware_1.rateLimit)(3, 15, 'resend'), (0, validate_middleware_1.validate)(auth_1.ResendOtpSchema), (req, res, next) => {
    auth_controller_1.authController.resendOtp(req, res, next);
});
// Forgot Password Request (5 attempts per 15 minutes)
router.post('/forgot-password', (0, rateLimit_middleware_1.rateLimit)(5, 15, 'forgot'), (0, validate_middleware_1.validate)(auth_1.ForgotPasswordSchema), (req, res, next) => {
    auth_controller_1.authController.forgotPassword(req, res, next);
});
// Password Reset with verified OTP
router.post('/reset-password', (0, rateLimit_middleware_1.rateLimit)(5, 15, 'reset'), (0, validate_middleware_1.validate)(auth_1.ResetPasswordSchema), (req, res, next) => {
    auth_controller_1.authController.resetPassword(req, res, next);
});
// Password Change for logged-in user
router.post('/change-password', auth_middleware_1.requireAuth, (0, validate_middleware_1.validate)(auth_1.ChangePasswordSchema), (req, res, next) => {
    auth_controller_1.authController.changePassword(req, res, next);
});
// Logout
router.post('/logout', (req, res) => {
    auth_controller_1.authController.logout(req, res);
});
// Authenticated User Profile
router.get('/me', auth_middleware_1.requireAuth, (req, res) => {
    auth_controller_1.authController.getMe(req, res);
});
// Update Profile (name, phone)
router.patch('/profile', auth_middleware_1.requireAuth, (req, res, next) => {
    auth_controller_1.authController.updateProfile(req, res, next);
});
exports.authRoutes = router;
//# sourceMappingURL=auth.routes.js.map