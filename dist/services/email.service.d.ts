export interface EmailOptions {
    to: string;
    subject: string;
    text: string;
    html?: string;
}
export declare class EmailService {
    private transporter;
    private getTransporter;
    sendEmail(options: EmailOptions): Promise<boolean>;
    sendVerificationOtp(to: string, code: string, name?: string): Promise<boolean>;
    sendPasswordResetOtp(to: string, code: string): Promise<boolean>;
    sendVipSecretCodeEmail(options: {
        to: string;
        name: string;
        planName: string;
        durationDays: number;
        secretCode: string;
    }): Promise<boolean>;
}
export declare const emailService: EmailService;
