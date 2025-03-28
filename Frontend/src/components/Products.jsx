import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./AuthContext";
import Sidebar from "./Sidebar";
import "./Products.css";
import "./Sidebar.css";

const Products = () => {
    const [products, setProducts] = useState([]);
    const [cart, setCart] = useState([]);
    const [categories, setCategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState("all");
    const [loading, setLoading] = useState(false);
    const [itemPrices, setItemPrices] = useState({}); // Track original prices at time of adding
    const [isSidebarOpen, setIsSidebarOpen] = useState(false); // State for sidebar
    const productsRef = useRef(products);
    const itemPricesRef = useRef(itemPrices);
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();

    // Keep refs updated with latest state
    useEffect(() => {
        productsRef.current = products;
        itemPricesRef.current = itemPrices;
    }, [products, itemPrices]);

    // Redirect to login if not authenticated
    useEffect(() => {
        if (!isAuthenticated) {
            navigate("/login");
        }
    }, [isAuthenticated, navigate]);

    // Fetch products from the backend - independent function with no dependencies
    const fetchProducts = useCallback(async () => {
        try {
            const response = await fetch("http://localhost:5000/api/products");
            if (!response.ok) {
                throw new Error("Failed to fetch products");
            }
            const data = await response.json();
            setProducts(data);

            // Extract unique categories
            const uniqueCategories = [...new Set(data.map((p) => p.category))];
            setCategories(uniqueCategories);
            return data;
        } catch (err) {
            console.error("Error fetching products:", err);
            return [];
        }
    }, []);

    // Fetch user's cart - independent function with no dependencies
    const fetchUserCart = useCallback(async () => {
        try {
            const response = await fetch("http://localhost:5000/api/cart", {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
            });

            if (response.ok) {
                const data = await response.json();
                // Access latest products through ref
                const currentProducts = productsRef.current;
                const currentItemPrices = itemPricesRef.current;
                
                const updatedCart = data.cart.map((item) => {
                    const product = currentProducts.find((p) => p._id === item.productId);
                    return {
                        ...item,
                        name: product?.name || "Unknown",
                        unitPrice: currentItemPrices[item.productId] || (product ? product.dynamicPrice || product.price : 0),
                    };
                });
                setCart(updatedCart);
                return updatedCart;
            }
            return [];
        } catch (err) {
            console.error("Error fetching cart:", err);
            return [];
        }
    }, []);

    // Load initial data - only runs once when authenticated
    useEffect(() => {
        let isMounted = true;
        
        const loadInitialData = async () => {
            setLoading(true);
            try {
                const productsData = await fetchProducts();
                if (isMounted && productsData.length > 0) {
                    await fetchUserCart();
                }
            } catch (error) {
                console.error("Error loading initial data:", error);
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };
        
        if (isAuthenticated) {
            loadInitialData();
        }
        
        return () => {
            isMounted = false; // Prevent state updates if component unmounts
        };
    }, [isAuthenticated, fetchProducts, fetchUserCart]);

    // Add to Cart
    const handleAddToCart = async (product) => {
        setLoading(true);
        try {
            const token = localStorage.getItem("token");
            if (!token) {
                navigate("/login");
                return;
            }
    
            const response = await fetch("http://localhost:5000/api/cart/add", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ productId: product._id }),
            });
    
            if (response.status === 401 || response.status === 481) {
                // Token is invalid or expired
                localStorage.removeItem("token");
                navigate("/login");
                return;
            }
    
            if (!response.ok) {
                const errorData = await response.json();
                console.error("Failed to add to cart:", errorData.message || response.statusText);
                return;
            }
    
            const data = await response.json();
            // Update products and cart state
            if (data.updatedProducts) {
                highlightPriceChanges(data.updatedProducts);
                setProducts(data.updatedProducts);
            }
            if (data.cart) {
                setCart(data.cart);
            }
        } catch (err) {
            console.error("Error adding to cart:", err);
        } finally {
            setLoading(false);
        }
    };

    // Remove from Cart
    const handleRemoveFromCart = async (product) => {
        setLoading(true);
        try {
            const response = await fetch("http://localhost:5000/api/cart/remove", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
                body: JSON.stringify({ productId: product._id }),
            });

            if (response.ok) {
                const data = await response.json();
                
                // Update item prices if item is being completely removed
                const cartItem = cart.find((item) => item.productId === product._id);
                if (cartItem && cartItem.quantity <= 1) {
                    setItemPrices((prev) => {
                        const updated = { ...prev };
                        delete updated[product._id];
                        return updated;
                    });
                }

                // Update products with new dynamic prices
                if (data.updatedProducts) {
                    highlightPriceChanges(data.updatedProducts);
                    setProducts(data.updatedProducts);
                }

                // Update cart data
                if (data.cart) {
                    const updatedCart = data.cart.map((item) => {
                        const prod = data.updatedProducts.find((p) => p._id === item.productId);
                        return {
                            ...item,
                            name: prod?.name || "Unknown",
                            unitPrice: itemPrices[item.productId] || (prod ? prod.dynamicPrice || prod.price : 0),
                        };
                    });
                    setCart(updatedCart);
                }
            } else {
                const errorData = await response.json();
                console.error("Failed to remove from cart:", errorData.message || response.statusText);
            }
        } catch (err) {
            console.error("Error removing from cart:", err);
        } finally {
            setLoading(false);
        }
    };

    // Highlight price changes
    const highlightPriceChanges = (newProducts) => {
        // Create a copy of current product prices, using productRef to avoid stale closure
        const currentPrices = {};
        productsRef.current.forEach((p) => {
            currentPrices[p._id] = p.dynamicPrice || p.price;
        });

        // Mark products that have changed prices
        const productsWithChanges = newProducts.map((p) => ({
            ...p,
            priceChanged: currentPrices[p._id] !== (p.dynamicPrice || p.price),
        }));

        setProducts(productsWithChanges);

        // Reset the highlighting after a delay
        setTimeout(() => {
            setProducts((currentProducts) => 
                currentProducts.map((p) => ({ ...p, priceChanged: false }))
            );
        }, 2000);
    };

    // Calculate cart total
    const calculateCartTotal = () => {
        return cart
            .reduce((total, item) => total + (item.unitPrice || 0) * item.quantity, 0)
            .toFixed(2);
    };

    // Filter products by category
    const filteredProducts =
        selectedCategory === "all"
            ? products
            : products.filter((p) => p.category === selectedCategory);

    // Get cart quantity for a product
    const getCartQuantity = (productId) => {
        const item = cart.find((item) => item.productId === productId);
        return item ? item.quantity : 0;
    };

    return (
        <div className="dashboard-container">
            {/* Sidebar */}
            <Sidebar 
                isSidebarOpen={isSidebarOpen} 
                setIsSidebarOpen={setIsSidebarOpen} 
                handleLogout={() => {}} // Add logout functionality if needed
            />

            {/* Main Content */}
            <div className="main-content">
                <h1>Products</h1>

                {/* Category filter */}
                <div className="category-filter">
                    <button
                        className={selectedCategory === "all" ? "active" : ""}
                        onClick={() => setSelectedCategory("all")}
                    >
                        All Categories
                    </button>
                    {categories.map((category) => (
                        <button
                            key={category}
                            className={selectedCategory === category ? "active" : ""}
                            onClick={() => setSelectedCategory(category)}
                        >
                            {category}
                        </button>
                    ))}
                </div>

                {loading && <div className="loading">Loading...</div>}

                {/* Products list */}
                <div className="products-list">
                    {filteredProducts.map((product) => (
                        <div
                            key={product._id}
                            className={`product-card ${product.priceChanged ? "price-changed" : ""}`}
                        >
                            <h2>{product.name}</h2>
                            <p>Category: {product.category}</p>
                            <div className="price-container">
                                {product.dynamicPrice !== undefined && product.dynamicPrice !== product.price ? (
                                    <>
                                        <p className="original-price">
                                            <s>${product.price.toFixed(2)}</s>
                                        </p>
                                        <p
                                            className={`dynamic-price ${
                                                product.dynamicPrice > product.price
                                                    ? "price-increase"
                                                    : "price-decrease"
                                            }`}
                                        >
                                            ${product.dynamicPrice.toFixed(2)}
                                        </p>
                                    </>
                                ) : (
                                    <p className="original-price">${product.price.toFixed(2)}</p>
                                )}
                            </div>

                            <div className="cart-actions">
                                <button
                                    className="add-button"
                                    onClick={() => handleAddToCart(product)}
                                    disabled={loading}
                                >
                                    Add to Cart
                                </button>

                                {getCartQuantity(product._id) > 0 && (
                                    <div className="quantity-control">
                                        <button
                                            onClick={() => handleRemoveFromCart(product)}
                                            disabled={loading}
                                        >
                                            -
                                        </button>
                                        <span>{getCartQuantity(product._id)}</span>
                                        <button
                                            onClick={() => handleAddToCart(product)}
                                            disabled={loading}
                                        >
                                            +
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Complementary product badge */}
                            {product.isComplement && (
                                <div className="complementary-badge">Bundle & Save!</div>
                            )}
                        </div>
                    ))}
                </div>

                {/* Cart section */}
                <div className="cart-section">
                    <h2>Your Cart</h2>
                    {cart.length > 0 ? (
                        <>
                            <div className="cart-items">
                                {cart.map((item) => (
                                    <div key={item.productId} className="cart-item">
                                        <div className="cart-item-info">
                                            <p className="item-name">{item.name}</p>
                                            <p className="item-price">
                                                ${(item.unitPrice || 0).toFixed(2)} × {item.quantity}
                                            </p>
                                        </div>
                                        <div className="cart-item-total">
                                            ${((item.unitPrice || 0) * item.quantity).toFixed(2)}
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="cart-total">
                                <strong>Total: ${calculateCartTotal()}</strong>
                            </div>
                            <button className="checkout-button">Checkout</button>
                        </>
                    ) : (
                        <p>Your cart is empty.</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Products;