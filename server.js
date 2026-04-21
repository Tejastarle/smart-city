const express = require("express");
const mongoose = require("mongoose");
const multer = require("multer");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static folder
app.use("/uploads", express.static(path.join(__dirname, "public/uploads")));
app.use(express.static("public"));

// ======================
// MongoDB Connection
// ======================
mongoose.connect(process.env.MONGO_URI)
.then(() => console.log("MongoDB Connected"))
.catch(err => console.log(err));

// ======================
// Schema
// ======================
const complaintSchema = new mongoose.Schema({
    name: String,
    category: String,
    location: String,
    description: String,
    image: String,
    status: {
        type: String,
        default: "Pending"
    },
    date: {
        type: Date,
        default: Date.now
    }
});

const Complaint = mongoose.model("Complaint", complaintSchema);

// ======================
// Multer Setup (Image Upload)
// ======================
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "public/uploads/");
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + "-" + file.originalname);
    }
});

const upload = multer({ storage });

// ======================
// Routes
// ======================

// ✅ Submit Complaint
app.post("/api/report", upload.single("image"), async (req, res) => {
    try {
        const { name, category, location, description } = req.body;

        const newComplaint = new Complaint({
            name,
            category,
            location,
            description,
            image: req.file ? `/uploads/${req.file.filename}` : "",
        });

        await newComplaint.save();

        res.json({
            success: true,
            message: "Complaint submitted successfully",
            data: newComplaint
        });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


// ✅ Get All Complaints
app.get("/api/complaints", async (req, res) => {
    try {
        const complaints = await Complaint.find().sort({ date: -1 });
        res.json(complaints);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


// ✅ Update Status (Admin Dashboard)
app.put("/api/update-status/:id", async (req, res) => {
    try {
        const { status } = req.body;

        const updated = await Complaint.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true }
        );

        res.json(updated);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


// ✅ Get Single Complaint (Details panel)
app.get("/api/complaint/:id", async (req, res) => {
    try {
        const complaint = await Complaint.findById(req.params.id);
        res.json(complaint);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


// ✅ Delete Complaint (optional)
app.delete("/api/delete/:id", async (req, res) => {
    try {
        await Complaint.findByIdAndDelete(req.params.id);
        res.json({ message: "Deleted successfully" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


// ======================
// Dashboard Stats
// ======================
app.get("/api/stats", async (req, res) => {
    try {
        const total = await Complaint.countDocuments();
        const pending = await Complaint.countDocuments({ status: "Pending" });
        const progress = await Complaint.countDocuments({ status: "In Progress" });
        const resolved = await Complaint.countDocuments({ status: "Resolved" });

        res.json({
            total,
            pending,
            progress,
            resolved
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


// ======================
// Server Start
// ======================
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});