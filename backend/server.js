require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const User = require("./models/User");
const Product = require("./models/Product");
const Order = require("./models/Order");

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Check environment variables
if (!process.env.MONGO_URI || !process.env.JWT_SECRET) {
  console.error("Missing MONGO_URI or JWT_SECRET in backend/.env");
  process.exit(1);
}

// Helper: create JWT
function generateToken(user) {
  return jwt.sign(
    { id: user._id.toString() },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
}

// Middleware: authentication
async function protect(req, res, next) {
  try {
    const header = req.headers.authorization || "";

    if (!header.startsWith("Bearer ")) {
      return res.status(401).json({
        message: "Please log in",
      });
    }

    const token = header.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id || decoded.userId);

    if (!user) {
      return res.status(401).json({
        message: "User not found",
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      message: "Invalid or expired token",
    });
  }
}

// Middleware: admin authorization
function adminOnly(req, res, next) {
  if (req.user.role !== "admin") {
    return res.status(403).json({
      message: "Admin access required",
    });
  }

  next();
}

// Health check
app.get("/", (req, res) => {
  res.send("SportZone API is running!");
});

// ---------------- AUTHENTICATION ----------------

// Register
app.post("/api/auth/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name?.trim() || !email?.trim() || !password) {
      return res.status(400).json({
        message: "Name, email and password are required",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        message: "Password must contain at least 6 characters",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await User.findOne({
      email: normalizedEmail,
    });

    if (existingUser) {
      return res.status(400).json({
        message: "Email is already registered",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      role: "user",
    });

    res.status(201).json({
      token: generateToken(user),
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Register error:", error);

    res.status(500).json({
      message: "Registration failed",
    });
  }
});

// Login
app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required",
      });
    }

    const user = await User.findOne({
      email: email.trim().toLowerCase(),
    });

    if (!user) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    const validPassword = await bcrypt.compare(
      password,
      user.password
    );

    if (!validPassword) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    res.json({
      token: generateToken(user),
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Login error:", error);

    res.status(500).json({
      message: "Login failed",
    });
  }
});

// Get logged-in user
app.get("/api/auth/me", protect, async (req, res) => {
  res.json({
    id: req.user._id,
    name: req.user.name,
    email: req.user.email,
    role: req.user.role,
  });
});

// ---------------- PRODUCTS ----------------

// Get all products
app.get("/api/products", async (req, res) => {
  try {
    const { category, search } = req.query;
    const filter = {};

    if (category && category !== "All") {
      filter.category = category;
    }

    if (search) {
      filter.name = {
        $regex: search,
        $options: "i",
      };
    }

    const products = await Product.find(filter).sort({
      createdAt: -1,
    });

    res.json(products);
  } catch (error) {
    console.error("Fetch products error:", error);

    res.status(500).json({
      message: "Failed to fetch products",
    });
  }
});

// Get single product
app.get("/api/products/:id", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        message: "Invalid product ID",
      });
    }

    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        message: "Product not found",
      });
    }

    res.json(product);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch product",
    });
  }
});

// ---------------- ADMIN PRODUCTS ----------------

function validateProduct(body) {
  const name = String(body.name || "").trim();
  const description = String(body.description || "").trim();
  const category = String(body.category || "").trim();
  const image = String(body.image || "").trim();
  const price = Number(body.price);
  const stock = Number(body.stock);

  if (!name || !description || !category || !image) {
    return {
      error: "All product fields are required",
    };
  }

  if (
    !Number.isFinite(price) ||
    price < 0 ||
    !Number.isInteger(stock) ||
    stock < 0
  ) {
    return {
      error: "Enter a valid price and stock quantity",
    };
  }

  // Only permit web image URLs.
  try {
    const parsed = new URL(image);

    if (!["http:", "https:"].includes(parsed.protocol)) {
      throw new Error("Invalid protocol");
    }
  } catch {
    return {
      error: "Enter a valid HTTP or HTTPS image URL",
    };
  }

  return {
    product: {
      name,
      description,
      category,
      image,
      price,
      stock,
      featured:
        body.featured === true ||
        body.featured === "true",
    },
  };
}

// Add product
app.post(
  "/api/admin/products",
  protect,
  adminOnly,
  async (req, res) => {
    try {
      const result = validateProduct(req.body);

      if (result.error) {
        return res.status(400).json({
          message: result.error,
        });
      }

      const product = await Product.create(result.product);

      res.status(201).json({
        message: "Product added successfully",
        product,
      });
    } catch (error) {
      console.error("Add product error:", error);

      res.status(500).json({
        message: "Failed to add product",
      });
    }
  }
);

// Edit product
app.put(
  "/api/admin/products/:id",
  protect,
  adminOnly,
  async (req, res) => {
    try {
      const { id } = req.params;

      if (!mongoose.isValidObjectId(id)) {
        return res.status(400).json({
          message: "Invalid product ID",
        });
      }

      const result = validateProduct(req.body);

      if (result.error) {
        return res.status(400).json({
          message: result.error,
        });
      }

      const product = await Product.findByIdAndUpdate(
        id,
        { $set: result.product },
        {
          new: true,
          runValidators: true,
        }
      );

      if (!product) {
        return res.status(404).json({
          message: "Product not found",
        });
      }

      res.json({
        message: "Product updated successfully",
        product,
      });
    } catch (error) {
      console.error("Edit product error:", error);

      res.status(500).json({
        message: "Failed to update product",
      });
    }
  }
);

// Delete product
app.delete(
  "/api/admin/products/:id",
  protect,
  adminOnly,
  async (req, res) => {
    try {
      if (!mongoose.isValidObjectId(req.params.id)) {
        return res.status(400).json({
          message: "Invalid product ID",
        });
      }

      const product = await Product.findByIdAndDelete(
        req.params.id
      );

      if (!product) {
        return res.status(404).json({
          message: "Product not found",
        });
      }

      res.json({
        message: "Product deleted successfully",
      });
    } catch (error) {
      console.error("Delete product error:", error);

      res.status(500).json({
        message: "Failed to delete product",
      });
    }
  }
);

// ---------------- ORDERS ----------------

// Place Cash on Delivery order
app.post("/api/orders", protect, async (req, res) => {
  const stockChanges = [];

  try {
    const { items, shippingAddress } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        message: "Your cart is empty",
      });
    }

    const requiredFields = [
      "fullName",
      "phone",
      "address",
      "city",
      "postalCode",
    ];

    if (
      !shippingAddress ||
      requiredFields.some(
        (field) =>
          !String(shippingAddress[field] || "").trim()
      )
    ) {
      return res.status(400).json({
        message: "Complete all shipping details",
      });
    }

    const quantities = new Map();

    for (const item of items) {
      const id = String(item.productId || "");
      const quantity = Number(item.quantity);

      if (
        !mongoose.isValidObjectId(id) ||
        !Number.isInteger(quantity) ||
        quantity < 1
      ) {
        return res.status(400).json({
          message: "Invalid cart item",
        });
      }

      quantities.set(
        id,
        (quantities.get(id) || 0) + quantity
      );
    }

    const orderItems = [];
    let totalAmount = 0;

    // Use database prices, not client-provided prices.
    for (const [productId, quantity] of quantities) {
      const product = await Product.findOneAndUpdate(
        {
          _id: productId,
          stock: { $gte: quantity },
        },
        {
          $inc: { stock: -quantity },
        },
        { new: false }
      );

      if (!product) {
        throw new Error(
          "A product is unavailable or has insufficient stock"
        );
      }

      stockChanges.push({ productId, quantity });

      orderItems.push({
        product: product._id,
        name: product.name,
        price: product.price,
        quantity,
      });

      totalAmount += product.price * quantity;
    }

    const order = await Order.create({
      user: req.user._id,
      items: orderItems,
      shippingAddress: {
        fullName: String(shippingAddress.fullName).trim(),
        phone: String(shippingAddress.phone).trim(),
        address: String(shippingAddress.address).trim(),
        city: String(shippingAddress.city).trim(),
        postalCode: String(
          shippingAddress.postalCode
        ).trim(),
      },
      totalAmount,
      paymentMethod: "COD",
      status: "Pending",
    });

    res.status(201).json({
      message: "Order placed successfully",
      order,
    });
  } catch (error) {
    console.error("Create order error:", error);

    // Best-effort stock restoration if order creation fails.
    for (const change of stockChanges) {
      try {
        await Product.findByIdAndUpdate(
          change.productId,
          {
            $inc: { stock: change.quantity },
          }
        );
      } catch (restoreError) {
        console.error(
          "Stock restoration failed:",
          restoreError
        );
      }
    }

    res.status(400).json({
      message:
        error.message || "Failed to place order",
    });
  }
});

// Get logged-in user's orders
app.get("/api/orders/my", protect, async (req, res) => {
  try {
    const orders = await Order.find({
      user: req.user._id,
    }).sort({ createdAt: -1 });

    res.json(orders);
  } catch (error) {
    console.error("My orders error:", error);

    res.status(500).json({
      message: "Failed to fetch orders",
    });
  }
});

// ---------------- ADMIN ORDERS ----------------

// View all orders
app.get(
  "/api/admin/orders",
  protect,
  adminOnly,
  async (req, res) => {
    try {
      const orders = await Order.find()
        .populate("user", "name email")
        .sort({ createdAt: -1 });

      res.json(orders);
    } catch (error) {
      console.error("Admin orders error:", error);

      res.status(500).json({
        message: "Failed to fetch orders",
      });
    }
  }
);

// Update order status
app.patch(
  "/api/admin/orders/:id",
  protect,
  adminOnly,
  async (req, res) => {
    try {
      const { status } = req.body;

      const allowedStatuses = [
        "Pending",
        "Processing",
        "Shipped",
        "Delivered",
        "Cancelled",
      ];

      if (!allowedStatuses.includes(status)) {
        return res.status(400).json({
          message: "Invalid order status",
        });
      }

      if (!mongoose.isValidObjectId(req.params.id)) {
        return res.status(400).json({
          message: "Invalid order ID",
        });
      }

      const order = await Order.findByIdAndUpdate(
        req.params.id,
        { $set: { status } },
        {
          new: true,
          runValidators: true,
        }
      );

      if (!order) {
        return res.status(404).json({
          message: "Order not found",
        });
      }

      res.json({
        message: "Order status updated successfully",
        order,
      });
    } catch (error) {
      console.error("Update order error:", error);

      res.status(500).json({
        message: "Failed to update order",
      });
    }
  }
);

// Unknown API routes should return JSON, not HTML.
app.use("/api", (req, res) => {
  res.status(404).json({
    message: `API route not found: ${req.method} ${req.originalUrl}`,
  });
});

// Start server after connecting to MongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB connected successfully");

    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error("MongoDB connection failed:", error);
    process.exit(1);
  });
