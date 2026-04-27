const pool = require("../utils/db");
const redisClient = require("../utils/redisClient");

const getActiveContent = async (teacherId) => {
    try {
        const cacheKey = `active_content:${teacherId}`;

        // Check Redis cache first
        const cachedResult = await redisClient.get(cacheKey);
        if (cachedResult) {
            return JSON.parse(cachedResult);
        }

        const query = `
            SELECT c.*, cs.rotation_order, cs.duration 
            FROM content c 
            JOIN content_schedule cs ON c.id = cs.content_id 
            WHERE c.uploaded_by = $1 
            AND c.status = 'approved' 
            AND (c.start_time <= NOW() AND c.end_time >= NOW()) 
            ORDER BY cs.rotation_order ASC
        `;

        const result = await pool.query(query, [teacherId]);

        // If no results, return null
        if (result.rows.length === 0) {
            return null;
        }

        const items = result.rows;

        // Calculate total cycle time (sum of all durations)
        const totalCycleTime = items.reduce((sum, item) => sum + item.duration, 0);

        // Find the earliest approved_at as cycle start
        const cycleStart = new Date(
            Math.min(...items.map(item => new Date(item.approved_at).getTime()))
        );

        // Calculate elapsed time in minutes from cycle start to now
        const now = new Date();
        const elapsedMilliseconds = now.getTime() - cycleStart.getTime();
        const elapsedMinutes = elapsedMilliseconds / (1000 * 60);

        // Do the modulo math
        const positionInCycle = elapsedMinutes % totalCycleTime;

        // Walk through items checking duration ranges
        let cumulativeTime = 0;
        for (const item of items) {
            const nextCumulativeTime = cumulativeTime + item.duration;

            // Check if current position falls within this item's range
            if (positionInCycle >= cumulativeTime && positionInCycle < nextCumulativeTime) {
                // Store result in Redis with 60 second TTL
                await redisClient.setEx(cacheKey, 60, JSON.stringify(item));
                return item;
            }

            cumulativeTime = nextCumulativeTime;
        }

        // Fallback to first item (shouldn't reach here with correct logic)
        const activeItem = items[0];
        await redisClient.setEx(cacheKey, 60, JSON.stringify(activeItem));
        return activeItem;
    } catch (error) {
        throw error;
    }
};

module.exports = { getActiveContent };