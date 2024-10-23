import mongoose, {Document, Schema, Model} from "mongoose";

interface IUser extends Document {
    firstName: string
    lastName: string
    email: string
    password: string
    name: string
    role: "user" | "admin"
    isVerified: boolean
    verificationCode?: string
    rememberMe: boolean
    marketingConsent: boolean
    termsAndConditions: boolean
}

const userSchema = new Schema<IUser>({
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true },
    password: { type: String, required: true },
    name: { type: String, required: true },
    role: { type: String, enum: ["user", "admin"], required: true, default: "user" },
    isVerified: { type: Boolean, default: false },
    verificationCode: { type: String },
    rememberMe: { type: Boolean, default: false },
    marketingConsent: { type: Boolean, default: false },
    termsAndConditions: { type: Boolean, default: false }
})

export const User : Model<IUser> =mongoose.models.User || mongoose.model<IUser>("User", userSchema)