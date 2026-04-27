const express = require("express");
const rateLimit = require("express-rate-limit");
const redisClient = require("./utils/redisClient");
const authRoutes = require("./routes/authRoutes");
const contentRoutes = require("./routes/contentRoutes");
const approvalRoutes = require("./routes/approvalRoutes");
const path = require("path");
const broadcastRoutes = require("./routes/broadcastRoutes");
const app = express();
require("dotenv").config();
const fs = require('fs');
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Serve uploaded files as static files
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// Rate limiter for broadcast route - 100 requests per 15 minutes per IP
const broadcastLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per windowMs
  message: "Too many requests from this IP, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
});

app.use("/api/auth", authRoutes);
app.use("/api/content", contentRoutes);
app.use("/api/approvals", approvalRoutes);
app.use("/api/content/live", broadcastLimiter, broadcastRoutes);
app.use((err, req, res, next) => {
  console.error(err.stack);

  // Handle multer errors
  if (err.code === "FILE_TOO_LARGE" || err.message.includes("fileSize")) {
    return res.status(413).json({
      error: {
        status: 413,
        message: "File size exceeds 10MB limit",
      },
    });
  }

  if (err.message.includes("Invalid file type")) {
    return res.status(415).json({
      error: {
        status: 415,
        message: err.message,
      },
    });
  }

  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";

  res.status(status).json({
    error: {
      status,
      message,
    },
  });
});

app.listen(process.env.PORT, () => {
  console.log(`Server running on port ${process.env.PORT}`);
});