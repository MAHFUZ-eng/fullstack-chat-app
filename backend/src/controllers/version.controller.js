import AppVersion from "../models/appVersion.model.js";

export const getLatestVersion = async (req, res) => {
    try {
        // Get the most recently created version that is ACTIVE
        const latestVersion = await AppVersion.findOne({ isActive: true }).sort({ createdAt: -1 });

        if (!latestVersion) {
            return res.status(404).json({ message: "No active version found" });
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

        // Deactivate all previous versions to ensure only one is active
        await AppVersion.updateMany({}, { isActive: false });

        const newVersion = new AppVersion({
            version,
            downloadUrl,
            releaseNotes,
            forceUpdate,
            isActive: true,
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

export const deleteVersion = async (req, res) => {
    try {
        // Deactivate all versions
        await AppVersion.updateMany({}, { isActive: false });
        res.status(200).json({ message: "All updates stopped successfully" });
    } catch (error) {
        console.log("Error in deleteVersion controller", error.message);
        res.status(500).json({ message: "Internal Server Error" });
    }
};
