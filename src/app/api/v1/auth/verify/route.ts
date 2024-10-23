import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { User } from "@/lib/database/models/user.model";
import { connectDb } from "@/lib/database/connectDb";

export async function POST(req: NextRequest) {
    try {
        await connectDb();
        const { email, verificationCode, rememberMe } = await req.json();

        // Validate request body
        if (!email || !verificationCode) {
            return NextResponse.json(
                { message: "Missing required fields" },
                { status: 400 }
            );
        }

        // Check if the user already exists
        const existingUser = await User.findOne({ email });
        if (!existingUser) {
            return NextResponse.json(
                { message: "User does not exist" },
                { status: 409 }
            );
        }

        // Check if the verification code is correct
        if (existingUser.verificationCode !== verificationCode) {
            return NextResponse.json(
                { message: "Invalid verification code" },
                { status: 401 }
            );
        }

        // Update the user as verified
        existingUser.isVerified = true;
        await existingUser.save();

        // Generate JWT token
        const jwtSecret = process.env.JWT_SECRET;
        if (!jwtSecret) {
            throw new Error("JWT_SECRET is not defined");
        }
        const jwtToken = jwt.sign(
            { email: existingUser.email, id: existingUser._id },
            jwtSecret,
            { expiresIn: rememberMe ? "7d" : "1d" }
        );

        const response = NextResponse.json(
            { message: "Verification successful", token: jwtToken },
            { status: 200 }
        );

        // Set the JWT token as a cookie
        response.cookies.set("token", jwtToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            maxAge: rememberMe ? 7 * 24 * 60 * 60 : 60 * 60, // 7 days or 1 hour
            path: "/",
        });

        return response;
    } catch (error) {
        return NextResponse.json(
            { message: "Internal server error" },
            { status: 500 }
        );
    }
}

/**
 * @swagger
 * /api/auth/verify:
 *   post:
 *     summary: Verify a user with email and verification code
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - verificationCode
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: The user's email address
 *               verificationCode:
 *                 type: string
 *                 description: The verification code sent to the user's email
 *               rememberMe:
 *                 type: boolean
 *                 description: Whether to remember the user (token expires in 7 days if true, 1 day if false)
 *     responses:
 *       200:
 *         description: Verification successful, JWT token generated and set in cookie
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Verification successful
 *                 token:
 *                   type: string
 *                   example: "JWT token here"
 *       400:
 *         description: Bad Request - Missing required fields
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Missing required fields
 *       401:
 *         description: Unauthorized - Invalid verification code
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Invalid verification code
 *       409:
 *         description: Conflict - User does not exist
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: User does not exist
 *       500:
 *         description: Internal Server Error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Internal server error
 */
