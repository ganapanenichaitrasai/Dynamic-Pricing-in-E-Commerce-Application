const express = require("express");
const Product = require("../models/Product");
const Cart = require("../models/Cart");
const authenticateUser = require("../middleware/authMiddleware");
const router = express.Router();

// Helper function to update prices in the same category
const updateCategoryPrices = async (category, addedProductId, isAdding) => {
    const productsInCategory = await Product.find({ category });

    const updatedProducts = productsInCategory.map(product => {
        if (product._id.toString() === addedProductId) {
            // Adjust the price of the added/removed product
            if (isAdding) {
                product.dynamicPrice = Math.min(product.price + 50, product.price * 1.2); // Increase price
            } else {
                product.dynamicPrice = Math.max(product.price - 50, product.price * 0.8); // Decrease price
            }
        } else {
            // Adjust the price of other products in the same category
            if (isAdding) {
                product.dynamicPrice = Math.max(product.price - 50, product.price * 0.8); // Decrease price
            } else {
                product.dynamicPrice = Math.min(product.price + 50, product.price * 1.2); // Increase price
            }
        }
        return product;
    });

    await Product.bulkSave(updatedProducts);
    return updatedProducts;
};

router.post("/add", authenticateUser, async (req, res) => {
    const { productId } = req.body;
    const userId = req.user.userId;

    try {
        const product = await Product.findById(productId);
        if (!product) return res.status(404).json({ message: "Product not found" });

        let cart = await Cart.findOne({ userId });
        if (!cart) {
            cart = new Cart({ userId, products: [] });
        }

        const productIndex = cart.products.findIndex(p => p.productId.toString() === productId);
        if (productIndex > -1) {
            cart.products[productIndex].quantity += 1;
        } else {
            cart.products.push({ productId, quantity: 1 });
        }

        await cart.save();

        // Update prices for products in the same category
        const updatedProducts = await updateCategoryPrices(product.category, productId, true);

        res.json({ updatedProducts, cart: cart.products });
    } catch (err) {
        res.status(500).json({ message: "Server Error" });
    }
});

router.post("/remove", authenticateUser, async (req, res) => {
    const { productId } = req.body;
    const userId = req.user.userId;

    try {
        const product = await Product.findById(productId);
        if (!product) return res.status(404).json({ message: "Product not found" });

        let cart = await Cart.findOne({ userId });
        if (!cart) return res.status(404).json({ message: "Cart not found" });

        const productIndex = cart.products.findIndex(p => p.productId.toString() === productId);
        if (productIndex > -1) {
            if (cart.products[productIndex].quantity > 1) {
                cart.products[productIndex].quantity -= 1;
            } else {
                // Remove the product from the cart if quantity is 1
                cart.products.splice(productIndex, 1);
            }
        }

        await cart.save();

        // Update prices for products in the same category
        const updatedProducts = await updateCategoryPrices(product.category, productId, false);

        // If cart is empty, reset all products to default prices
        if (cart.products.length === 0) {
            const allProducts = await Product.find({});
            const resetProducts = allProducts.map(p => {
                p.dynamicPrice = p.price;
                return p;
            });
            await Product.bulkSave(resetProducts);
            return res.json({ updatedProducts: resetProducts, cart: cart.products });
        }

        res.json({ updatedProducts, cart: cart.products });
    } catch (err) {
        res.status(500).json({ message: "Server Error" });
    }
});

module.exports = router;