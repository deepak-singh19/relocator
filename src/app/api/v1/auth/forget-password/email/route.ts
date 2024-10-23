import { NextRequest, NextResponse } from "next/server";
import { User } from "@/lib/database/models/user.model";
import { connectDb } from "@/lib/database/connectDb";
import { sendVerificationEmail, generateVerificationCode } from "@/lib/helper/common";

export async function POST(req: NextRequest) {
  try {
    await connectDb();
    console.log("Database connected");

    const { email } = await req.json();

    // Validate request body
    if (!email) {
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

    // Get the user's full name
    const userName = `${existingUser.firstName} ${existingUser.lastName}`;

    // Generate a secure verification code
    const code = generateVerificationCode();
    existingUser.verificationCode = code;

    // Ensure user role is preserved
    existingUser.role = existingUser.role; // This line seems redundant; you might not need it
    await existingUser.save();

    // Send the verification code to the user's email
    await sendVerificationEmail(email, code, userName, "resetPassword");

    return NextResponse.json(
      { message: "Verification code sent to email" },
      { status: 200 }
    );
  } catch (error) {
    // Handle errors
    console.error("Error occurred: ", error);
    return NextResponse.json(
      { message: "Internal Server Error", error: error }, // Send error message as a string
      { status: 500 }
    );
  }
}

/**
 * @swagger
 * /api/auth/forget-password/email:
 *   post:
 *     summary: Send verification code to user's email
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
 *     responses:
 *       200:
 *         description: Verification code sent to email
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       400:
 *         description: Missing required fields
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       409:
 *         description: User does not exist
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       500:
 *         description: Internal Server Error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 error:
 *                   type: string
 */
