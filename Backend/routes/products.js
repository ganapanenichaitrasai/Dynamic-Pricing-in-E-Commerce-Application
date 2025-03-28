const express = require("express");
const Product = require("../models/Product");
const router = express.Router();

// Fetch all products
router.get("/", async (req, res) => {
    try {
        const products = await Product.find({});
        res.json(products);
    } catch (err) {
        res.status(500).json({ message: "Server Error" });
    }
});

module.exports = router;