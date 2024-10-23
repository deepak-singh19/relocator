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

        return NextResponse.json(
            { message: "Verification successful", token: jwtToken },
            { status: 200 }
        );
    } catch (error) {
        return NextResponse.json(
            { message: "Internal server error" },
            { status: 500 }
        );
    }
}