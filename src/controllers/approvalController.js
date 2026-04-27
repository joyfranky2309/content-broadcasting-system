const pool = require("../utils/db");

const approveContent = async (req, res, next) => {
    try {
        const { contentId } = req.params;

        if (!contentId) {
            return res.status(400).json({ message: "Content ID is required" });
        }

        // Check if content exists and get current status
        const contentCheck = await pool.query(
            "SELECT id, status FROM content WHERE id = $1",
            [contentId]
        );

        if (contentCheck.rows.length === 0) {
            return res.status(404).json({ message: "Content not found" });
        }

        const currentStatus = contentCheck.rows[0].status;
        if (currentStatus === "approved" || currentStatus === "rejected") {
            return res.status(400).json({ message: `Content has already been ${currentStatus}` });
        }

        const result = await pool.query(
            "UPDATE content SET status = $1, approved_by = $2, approved_at = $3 WHERE id = $4 RETURNING *",
            ["approved", req.user.userId, new Date(), contentId]
        );

        return res.status(200).json({
            message: "Content approved successfully",
            content: result.rows[0]
        });
    } catch (error) {
        next(error);
    }
};

const rejectContent = async (req, res, next) => {
    try {
        const { contentId } = req.params;
        const { rejection_reason } = req.body;

        if (!contentId) {
            return res.status(400).json({ message: "Content ID is required" });
        }

        if (!rejection_reason) {
            return res.status(400).json({ message: "Rejection reason is required" });
        }

        // Check if content exists and get current status
        const contentCheck = await pool.query(
            "SELECT id, status FROM content WHERE id = $1",
            [contentId]
        );

        if (contentCheck.rows.length === 0) {
            return res.status(404).json({ message: "Content not found" });
        }

        const currentStatus = contentCheck.rows[0].status;
        if (currentStatus === "approved" || currentStatus === "rejected") {
            return res.status(400).json({ message: `Content has already been ${currentStatus}` });
        }

        const result = await pool.query(
            "UPDATE content SET status = $1, rejection_reason = $2 WHERE id = $3 RETURNING *",
            ["rejected", rejection_reason, contentId]
        );

        return res.status(200).json({
            message: "Content rejected successfully",
            content: result.rows[0]
        });
    } catch (error) {
        next(error);
    }
};

const getPendingContent = async (req, res, next) => {
    try {
        const result = await pool.query(
            "SELECT * FROM content WHERE status = $1 ORDER BY created_at ASC",
            ["pending"]
        );

        return res.status(200).json({
            message: "Pending content retrieved successfully",
            content: result.rows
        });
    } catch (error) {
        next(error);
    }
};

module.exports = { approveContent, rejectContent, getPendingContent };
