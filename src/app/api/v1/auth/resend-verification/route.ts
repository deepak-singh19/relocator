import { NextRequest, NextResponse } from "next/server"
import { User } from "@/lib/database/models/user.model";
import { connectDb } from "@/lib/database/connectDb";
import { sendVerificationEmail, generateVerificationCode } from "@/lib/helper/common";

// Assuming you already have these helpers available

/**
 * @swagger
 * /api/auth/resend-code:
 *   post:
 *     summary: Resend verification code to user's email
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *     responses:
 *       200:
 *         description: Verification code sent
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       404:
 *         description: User not found
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
export async function POST(req: NextRequest) {
  try {
    // Connect to the database
    await connectDb()

    const { email } = await req.json()

    // Validate email
    if (!email) {
      return NextResponse.json(
        { message: "Email is required" },
        { status: 400 }
      )
    }

    // Find the user by email
    const user = await User.findOne({ email })
    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 })
    }

    //Get the user name
    const userName = user.firstName + " " + user.lastName

    // Check if the user is already verified
    if (user.isVerified) {
      return NextResponse.json(
        { message: "User is already verified" },
        { status: 400 }
      )
    }

    // Generate a new verification code
    const newVerificationCode = generateVerificationCode()

    // Update the user's verification code
    user.verificationCode = newVerificationCode
    await user.save()

    // Send the new verification code via email
    await sendVerificationEmail(email, newVerificationCode, userName, "signup")

    // Return success response
    return NextResponse.json(
      { message: "Verification code resent successfully" },
      { status: 200 }
    )
  } catch (error) {
    console.error(error)
    return NextResponse.json(
      { message: "Internal Server Error", error: error },
      { status: 500 }
    )
  }
}
