import mongoose from "mongoose";

const appVersionSchema = new mongoose.Schema(
    {
        version: {
            type: String,
            required: true,
            unique: true, // e.g., "1.0.0"
        },
        downloadUrl: {
            type: String,
            required: true,
        },
        releaseNotes: {
            type: String,
            default: "Bug fixes and improvements",
        },
        forceUpdate: {
            type: Boolean,
            default: false,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    { timestamps: true }
);

const AppVersion = mongoose.model("AppVersion", appVersionSchema);

export default AppVersion;
