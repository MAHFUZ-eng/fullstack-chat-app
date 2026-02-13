import AppVersion from "../models/appVersion.model.js";

export const getLatestVersion = async (req, res) => {
    try {
        // Get the most recently created version
        const latestVersion = await AppVersion.findOne().sort({ createdAt: -1 });

        if (!latestVersion) {
            return res.status(404).json({ message: "No version info found" });
        }

        res.status(200).json(latestVersion);
    } catch (error) {
        console.log("Error in getLatestVersion controller", error.message);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

export const updateVersion = async (req, res) => {
    try {
        const { version, downloadUrl, releaseNotes, forceUpdate } = req.body;

        if (!version || !downloadUrl) {
            return res.status(400).json({ message: "Version and Download URL are required" });
        }

        const newVersion = new AppVersion({
            version,
            downloadUrl,
            releaseNotes,
            forceUpdate,
        });

        await newVersion.save();

        res.status(201).json({
            message: "Version updated successfully",
            data: newVersion,
        });
    } catch (error) {
        console.log("Error in updateVersion controller", error.message);
        res.status(500).json({ message: "Internal Server Error" });
    }
};
