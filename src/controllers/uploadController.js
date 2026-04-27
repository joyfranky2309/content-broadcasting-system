const pool = require("../utils/db");

const uploadContent = async (req, res, next) => {
    try {
        const { title, description, subject, start_time, end_time, rotation_order, duration } = req.body;
        if (!title || !subject) {
            return res.status(400).json({ message: "All fields are required" });
        }
        if (!rotation_order || !duration) {
            return res.status(400).json({ message: "rotation_order and duration are required" });
        }
        const file = req.file;
        if (!file) {
            return res.status(400).json({ message: "File is required" });
        }

        let slot = await pool.query("SELECT * FROM content_slots WHERE subject=$1", [subject]);
        if (slot.rows.length === 0) {
            slot = await pool.query("INSERT INTO content_slots (subject) VALUES ($1) RETURNING *", [subject]);
        }
        const slotId = slot.rows[0].id;
        
        const contentResult = await pool.query(
            "INSERT INTO content (title, description, subject, file_url, file_type, file_size, uploaded_by, start_time, end_time) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *",
            [title, description, subject, file.path, file.mimetype, file.size, req.user.userId, start_time, end_time]
        );
        
        const contentId = contentResult.rows[0].id;
        
        // Insert into content_schedule with rotation_order and duration
        const scheduleResult = await pool.query(
            "INSERT INTO content_schedule (content_id, slot_id, rotation_order, duration) VALUES ($1,$2,$3,$4) RETURNING *",
            [contentId, slotId, rotation_order, duration]
        );
        
        return res.status(201).json({ 
            message: "Content uploaded successfully", 
            content: contentResult.rows[0],
            schedule: scheduleResult.rows[0]
        });
    } catch (error) {
        next(error);
    }
}

const submitContent = async (req, res, next) => {
    try {
        const { contentId } = req.params;

        if (!contentId) {
            return res.status(400).json({ message: "Content ID is required" });
        }

        // Check if content exists and get current status
        const contentCheck = await pool.query(
            "SELECT id, status, uploaded_by FROM content WHERE id = $1",
            [contentId]
        );

        if (contentCheck.rows.length === 0) {
            return res.status(404).json({ message: "Content not found" });
        }

        const content = contentCheck.rows[0];
        
        // Verify that the user is the one who uploaded this content
        if (content.uploaded_by !== req.user.userId) {
            return res.status(403).json({ message: "You can only submit content that you uploaded" });
        }

        // Check if status is 'uploaded'
        if (content.status !== "uploaded") {
            return res.status(400).json({ message: `Content cannot be submitted. Current status: ${content.status}` });
        }

        const result = await pool.query(
            "UPDATE content SET status = $1 WHERE id = $2 RETURNING *",
            ["pending", contentId]
        );

        return res.status(200).json({
            message: "Content submitted for review successfully",
            content: result.rows[0]
        });
    } catch (error) {
        next(error);
    }
}

module.exports = { uploadContent, submitContent };