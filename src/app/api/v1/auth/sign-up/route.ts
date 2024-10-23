import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { User } from "@/lib/database/models/user.model";
import { connectDb } from "@/lib/database/connectDb";
import { sendVerificationEmail, generateVerificationCode } from "@/lib/helper/common";

const salt= 10;

export async function POST(req: NextRequest){
    try{
        await connectDb();
        const {email, password, rememberMe, marketingConsent, termsAndConditions, firstName, lastName, role} = await req.json();

        // Validate request body
        if (!email || !password ||!termsAndConditions || !firstName || !lastName) {
            return NextResponse.json(
            { message: "Missing required fields" },
            { status: 400 }
            )
        }
        

        // Check if the user already exists
        const existingUser = await User.findOne({ email })
        if (existingUser) {
        return NextResponse.json(
            { message: "User already exist" },
            { status: 409 }
        )
        }

        //Get the user name
        const userName = firstName + " " + lastName

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, salt)

        const verificationCode = generateVerificationCode()

        const newUser = new User({
            firstName,
            lastName,
            email,
            password: hashedPassword,
            marketingConsent,
            termsAndConditions,
            role: role || "user",
            verificationCode
        });

        await newUser.save()

        // Send verification email
        await sendVerificationEmail(email, verificationCode, userName, "signup")

        return NextResponse.json(
            { message: "Verification email sent" },
            { status: 200 }
          )

    }catch(error){
        return NextResponse.json(
            { message: "Internal server error" },
            { status: 500 }
          )
    }
}

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - firstName
 *               - lastName
 *               - email
 *               - password
 *               - termsAndConditions
 *             properties:
 *               firstName:
 *                 type: string
 *                 description: The user's first name
 *               lastName:
 *                 type: string
 *                 description: The user's last name
 *               email:
 *                 type: string
 *                 format: email
 *                 description: The user's email address
 *               password:
 *                 type: string
 *                 format: password
 *                 description: The user's password
 *               marketingConsent:
 *                 type: boolean
 *                 description: Whether the user consents to marketing emails
 *               termsAndConditions:
 *                 type: boolean
 *                 description: Whether the user agrees to the terms and conditions
 *               role:
 *                 type: string
 *                 description: The user's role (optional, default is "user")
 *     responses:
 *       200:
 *         description: Verification email sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Verification email sent
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
 *       409:
 *         description: Conflict - User already exists
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: User already exists
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
