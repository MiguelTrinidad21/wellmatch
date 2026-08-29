import brevo from "../configs/brevo.js";
import "dotenv/config";

export async function sendVerificationEmail(email, verificationCode) {
    await brevo.transactionalEmails.sendTransacEmail({
        sender: {
            name: process.env.BREVO_SENDER_NAME,
            email: process.env.BREVO_SENDER_EMAIL
        },
        to: [
            {
                email
            }
        ],
        templateId: 8,
        params: {
            email,
            verificationCode
        }
    });   
}

export async function sendEmailUpdateCode(email, verificationCode) {
    await brevo.transactionalEmails.sendTransacEmail({
        sender: {
            name: process.env.BREVO_SENDER_NAME,
            email: process.env.BREVO_SENDER_EMAIL
        },
        to: [
            {
                email
            }
        ],
        templateId: 9,
        params: {
            email,
            verificationCode
        }
    });   
}