import { RegisterInput, LoginInput, VerifyOtpInput, ResendOtpInput, ForgotPasswordInput, ResetPasswordInput, ChangePasswordInput, AuthResponse, AuthUser } from '../shared/auth';
export declare class AuthService {
    private hashOtp;
    register(input: RegisterInput, ip?: string): Promise<AuthResponse>;
    login(input: LoginInput): Promise<AuthResponse>;
    verifyOtp(input: VerifyOtpInput): Promise<AuthResponse>;
    resendOtp(input: ResendOtpInput, ip?: string): Promise<{
        success: boolean;
        cooldownSeconds: number;
    }>;
    forgotPassword(input: ForgotPasswordInput, ip?: string): Promise<{
        message: string;
    }>;
    resetPassword(input: ResetPasswordInput): Promise<{
        success: boolean;
        message: string;
    }>;
    changePassword(userId: string, input: ChangePasswordInput): Promise<{
        success: boolean;
    }>;
    updateProfile(userId: string, input: {
        name?: string;
        phone?: string;
    }): Promise<AuthUser>;
    private mapToAuthUser;
}
export declare const authService: AuthService;
