export const verifyAdmin = (req, res, next) => {
    try {
        const token = req.query.token || req.headers['x-admin-token'];
        console.log("Admin middleware check. Token present:", !!token);

        if (!token) {
            console.log("Admin token missing");
            return res.status(401).json({ message: "Admin token required" });
        }

        if (token !== process.env.ADMIN_SECRET_TOKEN) {
            console.log("Invalid admin token provided");
            return res.status(403).json({ message: "Invalid admin token" });
        }

        next();
    } catch (error) {
        console.log("Error in admin middleware:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};
