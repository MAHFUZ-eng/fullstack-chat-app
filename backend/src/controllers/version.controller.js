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
        console.log("updateVersion called with body:", req.body); // Debug log
        const { version, downloadUrl, releaseNotes, forceUpdate } = req.body;

        if (!version || !downloadUrl) {
            console.log("Missing version or downloadUrl"); // Debug log
            return res.status(400).json({ message: "Version and Download URL are required" });
        }

        // Deactivate all previous versions to ensure only one is active
        await AppVersion.updateMany({}, { isActive: false });

        // Check if this specific version already exists
        const existingVersion = await AppVersion.findOne({ version });

        if (existingVersion) {
            console.log("Updating existing version...");
            existingVersion.downloadUrl = downloadUrl;
            existingVersion.releaseNotes = releaseNotes;
            existingVersion.forceUpdate = forceUpdate;
            existingVersion.isActive = true;
            await existingVersion.save();

            res.status(200).json({
                message: "Version updated successfully",
                data: existingVersion,
            });
        } else {
            console.log("Creating new version...");
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
        }
    } catch (error) {
        console.log("Error in updateVersion controller", error); // Log full error object
        res.status(500).json({ message: "Internal Server Error: " + error.message });
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
