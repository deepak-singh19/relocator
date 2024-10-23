import { NextRequest, NextResponse } from "next/server";
import { User } from "@/lib/database/models/user.model";
import { connectDb } from "@/lib/database/connectDb";

/**
 * @swagger
 * /api/auth/forget-password/verify:
 *   post:
 *     summary: Verify user email for password reset
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
 *               verificationCode:
 *                 type: string
 *                 example: "123456"
 *     responses:
 *       200:
 *         description: Verification successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Verification successful"
 *       400:
 *         description: Bad Request
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Missing required fields"
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
 *       401:
 *         description: Invalid verification code
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Invalid verification code"
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

    const { email, verificationCode } = await req.json();

    // Validate request body
    if (!email || !verificationCode) {
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
        { status: 401 } // Change status to 401 for invalid code
      );
    }

    // Create the response object
    const response = NextResponse.json(
      { message: "Verification successful" },
      { status: 200 } // Change status to 200 for successful verification
    );

    return response;
  } catch (error) {
    // Handle errors
    console.error(error);
    return NextResponse.json(
      { message: "Internal Server Error", error: error }, // Send error message
      { status: 500 }
    );
  }
}
