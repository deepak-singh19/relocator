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
        await sendVerificationEmail(email, verificationCode, userName)

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