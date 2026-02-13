import { useEffect, useState } from "react";
import { axiosInstance } from "../lib/axios";
import { Package, Download, X } from "lucide-react";
import packageJson from "../../package.json";

const UpdatePrompt = () => {
    const [updateAvailable, setUpdateAvailable] = useState(false);
    const [versionInfo, setVersionInfo] = useState(null);
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        checkVersion();
    }, []);

    const checkVersion = async () => {
        try {
            const res = await axiosInstance.get("/version/latest");
            const serverVersion = res.data;

            const currentVersion = packageJson.version;

            if (compareVersions(serverVersion.version, currentVersion) > 0) {
                setVersionInfo(serverVersion);
                setUpdateAvailable(true);
                setIsOpen(true);
            }
        } catch (error) {
            console.log("Error checking version:", error);
        }
    };

    const compareVersions = (v1, v2) => {
        // Simple version comparison (e.g., "1.0.1" > "1.0.0")
        const parts1 = v1.split('.').map(Number);
        const parts2 = v2.split('.').map(Number);

        for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
            const part1 = parts1[i] || 0;
            const part2 = parts2[i] || 0;
            if (part1 > part2) return 1;
            if (part1 < part2) return -1;
        }
        return 0;
    };

    const handleUpdate = () => {
        if (versionInfo?.downloadUrl) {
            window.open(versionInfo.downloadUrl, "_blank");
        }
    };

    const handleClose = () => {
        if (!versionInfo?.forceUpdate) {
            setIsOpen(false);
        }
    };

    if (!isOpen || !versionInfo) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-base-100 rounded-lg shadow-xl max-w-md w-full p-6 relative animate-fade-in-up">
                {!versionInfo.forceUpdate && (
                    <button
                        onClick={handleClose}
                        className="absolute top-4 right-4 text-zinc-500 hover:text-zinc-300"
                    >
                        <X className="size-5" />
                    </button>
                )}

                <div className="flex flex-col items-center text-center">
                    <div className="size-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                        <Package className="size-8 text-primary" />
                    </div>

                    <h2 className="text-2xl font-bold mb-2">New Update Available!</h2>
                    <p className="text-zinc-500 mb-6">
                        A new version of the app ({versionInfo.version}) is available.
                        Update now to get the latest features and fixes.
                    </p>

                    {versionInfo.releaseNotes && (
                        <div className="w-full bg-base-200 p-4 rounded-lg mb-6 text-left">
                            <h3 className="font-semibold mb-2 text-sm">What's New:</h3>
                            <p className="text-sm text-zinc-400 whitespace-pre-wrap">
                                {versionInfo.releaseNotes}
                            </p>
                        </div>
                    )}

                    <button
                        onClick={handleUpdate}
                        className="btn btn-primary w-full gap-2"
                    >
                        <Download className="size-5" />
                        Update Now
                    </button>

                    {!versionInfo.forceUpdate && (
                        <button
                            onClick={handleClose}
                            className="btn btn-ghost w-full mt-2"
                        >
                            Remind Me Later
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default UpdatePrompt;
