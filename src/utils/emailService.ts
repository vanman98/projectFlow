// src/utils/emailService.ts

import nodemailer from "nodemailer";
import logger from "./logger";

// Create a transporter using SMTP settings (Ethereal for testing, or real SMTP)
export const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.ethereal.email",
    port: Number(process.env.SMTP_PORT) || 587,
    secure: false, // true for port 465
    auth: {
        user: process.env.SMTP_USER || "", // from .env
        pass: process.env.SMTP_PASS || ""
    }
});

/**
 * sendEmail: sends an email with given to/subject/html
 * @param to recipient email address
 * @param subject email subject line
 * @param html HTML body content
 */
export const sendEmail = async (
    to: string,
    subject: string,
    html: string
): Promise<void> => {
    try {
        const info = await transporter.sendMail({
            from: process.env.EMAIL_FROM || '"ProjectFlow" <no-reply@projectflow.com>',
            to,
            subject,
            html
        });
        logger.info(`Email sent: ${info.messageId}`);
        // Preview URL for Ethereal accounts
        const previewUrl = nodemailer.getTestMessageUrl(info);
        if (previewUrl) {
            logger.info(`Preview URL: ${previewUrl}`);
        }
    } catch (error) {
        logger.error(`Failed to send email to ${to}: ${error}`);
        throw error; // let caller handle if needed
    }
};

// Example integration in src/controllers/userController.ts
// After successful registration:
// import { sendEmail } from "../utils/emailService";
// sendEmail(user.email, "Welcome to ProjectFlow!", `<h1>Hello ${user.username}</h1><p>Thanks for registering!</p>`)
//   .catch(err => logger.error("Error sending welcome email:", err));
