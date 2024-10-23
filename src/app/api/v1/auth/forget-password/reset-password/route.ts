import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { User } from "@/lib/database/models/user.model";
import { connectDb } from "@/lib/database/connectDb";

const saltRounds = 10;

/**
 * @swagger
 * /api/auth/forget-password/reset-password:
 *   post:
 *     summary: Reset user password
 *     tags: [Forget Password]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 example: "user@example.com"
 *               newPassword:
 *                 type: string
 *                 example: "newPassword123"
 *               verificationCode:
 *                 type: string
 *                 example: "123456"
 *     responses:
 *       200:
 *         description: Password reset successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Password reset successful"
 *                 token:
 *                   type: string
 *                   example: "jwt-token"
 *       400:
 *         description: Bad Request
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Missing required fields or Invalid verification code"
 *       409:
 *         description: User does not exist
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "User does not exist"
 *       500:
 *         description: Internal Server Error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Internal Server Error"
 *                 error:
 *                   type: string
 *                   example: "Error message"
 */
export async function POST(req: NextRequest) {
  try {
    // Connect to the database
    await connectDb();

    const { email, newPassword, verificationCode } = await req.json();

    // Validate request body
    if (!email || !newPassword || !verificationCode) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 }
      );
    }

    // Check if the user exists
    const existingUser = await User.findOne({ email });
    if (!existingUser) {
      return NextResponse.json(
        { message: "User does not exist" },
        { status: 409 }
      );
    }

    // Verify the code
    if (existingUser.verificationCode !== verificationCode) {
      return NextResponse.json(
        { message: "Invalid verification code" },
        { status: 400 }
      );
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update the user's password and clear the verification code
    existingUser.password = hashedPassword;
    existingUser.verificationCode = undefined;
    await existingUser.save();

    // Generate a JWT token
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error("JWT_SECRET is not defined");
    }

    const jwtToken = jwt.sign(
      { email: existingUser.email, id: existingUser._id },
      jwtSecret,
      { expiresIn: "7d" }
    );

    // Create the response object
    const response = NextResponse.json(
      { message: "Password reset successful", token: jwtToken },
      { status: 200 }
    );

    // Set the JWT token as a cookie
    response.cookies.set("token", jwtToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: "/",
    });

    return response;
  } catch (error) {
    // Handle errors
    console.error(error);
    return NextResponse.json(
      { message: "Internal Server Error", error: error }, // Send error message as string
      { status: 500 }
    );
  }
}
