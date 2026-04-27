const { getActiveContent } = require("../services/schedulingService");

const getLiveContent = async (req, res, next) => {
    try {
        const { teacherId } = req.params;

        if (!teacherId) {
            return res.status(400).json({ message: "Teacher ID is required" });
        }

        const activeContent = await getActiveContent(teacherId);

        if (!activeContent) {
            return res.status(200).json({ message: "No content available" });
        }

        return res.status(200).json({
            message: "Live content retrieved successfully",
            content: activeContent
        });
    } catch (error) {
        next(error);
    }
};

module.exports = { getLiveContent };
