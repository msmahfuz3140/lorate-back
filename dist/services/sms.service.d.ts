export declare class SmsService {
    sendSms(to: string, message: string): Promise<boolean>;
    sendVerificationOtp(to: string, code: string): Promise<boolean>;
    sendPasswordResetOtp(to: string, code: string): Promise<boolean>;
}
export declare const smsService: SmsService;
