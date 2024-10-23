import crypto from "crypto"
import nodemailer from "nodemailer"

// For generating 6-digit hexadecimal code
export function generateVerificationCode(): string {
    // return crypto.randomBytes(3).toString("hex").slice(0, 5)
    const min = 10000,
      max = 99999
    const range = max - min + 1
    return (crypto.randomInt(range) + min).toString()
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
  ) {
  
    const mailOptions = {
      from: process.env.EMAIL_USER, // sender address (from Mailgun)
      to: email, // recipient address
      subject: `Relocator email verification code: ${code}}`, // subject line
      text: `Hey ${userName} your email verification code is ${code}`, // generated HTML content
    }
  
    try {
      await transporter.sendMail(mailOptions)
      console.log("Email sent successfully")
    } catch (error) {
      console.error("Error sending email:", error)
    }
  }