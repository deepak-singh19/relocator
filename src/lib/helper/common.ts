import crypto from "crypto";
import nodemailer from "nodemailer";

// For generating a 5-digit verification code
export function generateVerificationCode(): string {
    const min = 10000;
    const max = 99999;
    const range = max - min + 1;
    return (crypto.randomInt(range) + min).toString();
}

// Create a nodemailer transporter
const transporter = nodemailer.createTransport({
    service: "Gmail",
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.MAIL_PASS,
    },
});

// Send verification email
export async function sendVerificationEmail(
    email: string,
    code: string,
    userName: string,
    type: "signup" | "resetPassword"
) {
    const subject = type === "signup" 
        ? `Relocator Email Verification Code: ${code}`
        : `Relocator Password Reset Code: ${code}`; // Provide a subject for reset password

    const mailOptions = {
        from: process.env.EMAIL_USER, // sender address
        to: email, // recipient address
        subject: subject, // subject line
        text: `Hey ${userName}, your verification code is ${code}`, // plain text content
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log("Email sent successfully");
    } catch (error) {
        console.error("Error sending email:", error);
    }
}
