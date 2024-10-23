import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { User } from "@/lib/database/models/user.model";
import { connectDb } from "@/lib/database/connectDb";

const salt = 10;

export async function POST(req: NextRequest) {
    try {
        await connectDb();
        const { email, password, rememberMe } = await req.json();

        // Validate request body
        if (!email || !password) {
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

        // Get the user name
        const userName = existingUser.firstName + " " + existingUser.lastName;

        // Check if the password is correct
        const isPasswordCorrect = await bcrypt.compare(password, existingUser.password);
        if (!isPasswordCorrect) {
            return NextResponse.json(
                { message: "Invalid password" },
                { status: 401 }
            );
        }

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
            { message: "Login successful", token: jwtToken },
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
            { message: "Internal Server Error", error: error },
            { status: 500 }
        );
    }
}

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login a user with email and password
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: The user's email address
 *               password:
 *                 type: string
 *                 description: The user's password
 *               rememberMe:
 *                 type: boolean
 *                 description: Whether to keep the user logged in for 7 days (true) or 1 day (false)
 *     responses:
 *       200:
 *         description: Login successful, JWT token generated and set in cookie
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Login successful
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
 *         description: Unauthorized - Invalid password
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Invalid password
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
 *                   example: Internal Server Error
 */
