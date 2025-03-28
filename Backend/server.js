const express = require("express");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const { spawn } = require("child_process");
const multer = require("multer");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const cartRoutes = require("./routes/cart");
const authRoutes = require("./routes/auth");
const productRoutes = require("./routes/products");

dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(cookieParser());
app.use(express.json());
const upload = multer({ dest: "uploads/" });

// // MongoDB Connection (Avoid connecting during tests)
// if (process.env.NODE_ENV !== "test") {
//     mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
//         .then(() => console.log("MongoDB Connected"))
//         .catch(err => console.log(err));
// }
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("MongoDB Connected"))
    .catch(err => console.log(err));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/products", productRoutes);

app.post("/upload", upload.single("file"), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
    }

    console.log("📂 File uploaded. Starting model training with analytics...");

    const python = spawn("python3", ["ml_model.py", req.file.path]);

    let jsonData = "";
    let errorOccurred = false;

    python.stdout.on("data", (data) => {
        jsonData += data.toString();
    });

    python.stderr.on("data", (data) => {
        console.error("❌ Python Error:", data.toString());
        errorOccurred = true;
    });

    python.on("close", (code) => {
        if (errorOccurred) {
            return res.status(500).json({ error: "Error occurred in model training" });
        }

        try {
            const parsedData = JSON.parse(jsonData.trim());
            console.log("✅ Model training and analytics completed!");
            res.json(parsedData);
        } catch (error) {
            console.error("❌ JSON Parsing Error:", error.message);
            res.status(500).json({ error: "Invalid JSON response from Python script" });
        }
    });
});

// Start Server
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
// let server; // Store server instance

// if (process.env.NODE_ENV !== "test") {
//     server = app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
// }

// module.exports = { app, server }; // Export server for closing in tests

