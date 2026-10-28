
require("dotenv").config();

const mongoose = require("mongoose");
const Product = require("./models/Product");

const products = [
  // ========== FOOTBALL ==========
  {
    name: "Football",
    description: "Durable football for training and outdoor matches.",
    price: 799,
    category: "Football",
    image: "https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=800",
    stock: 30,
    featured: true,
  },
  {
    name: "Professional Football",
    description: "Premium match football with excellent control.",
    price: 1499,
    category: "Football",
    image: "https://images.unsplash.com/photo-1614632537190-23e4146777db?w=800",
    stock: 20,
    featured: false,
  },
  {
    name: "Football Boots",
    description: "Comfortable football boots for better traction.",
    price: 2499,
    category: "Football",
    image: "https://images.unsplash.com/photo-1511882150382-421056c89033?w=800",
    stock: 15,
    featured: false,
  },
  {
    name: "Goalkeeper Gloves",
    description: "Protective gloves with improved ball grip.",
    price: 899,
    category: "Football",
    image: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800",
    stock: 25,
    featured: false,
  },
  {
    name: "Football Training Kit",
    description: "Training essentials for football practice.",
    price: 1299,
    category: "Football",
    image: "https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=800",
    stock: 18,
    featured: false,
  },
  {
    name: "Football Jersey",
    description: "Lightweight and breathable football jersey.",
    price: 699,
    category: "Football",
    image: "https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=800",
    stock: 35,
    featured: false,
  },

  // ========== BASKETBALL ==========
  {
    name: "Basketball",
    description: "High-quality basketball with excellent grip.",
    price: 999,
    category: "Basketball",
    image: "https://images.unsplash.com/photo-1546519638-68e109498ffc?w=800",
    stock: 15,
    featured: true,
  },
  {
    name: "Professional Basketball",
    description: "Competition basketball for indoor courts.",
    price: 1599,
    category: "Basketball",
    image: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800",
    stock: 20,
    featured: false,
  },
  {
    name: "Basketball Shoes",
    description: "High-top shoes for basketball players.",
    price: 2999,
    category: "Basketball",
    image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800",
    stock: 12,
    featured: false,
  },
  {
    name: "Basketball Jersey",
    description: "Breathable jersey for basketball training.",
    price: 799,
    category: "Basketball",
    image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800",
    stock: 30,
    featured: false,
  },
  {
    name: "Basketball Training Ball",
    description: "Durable basketball for everyday practice.",
    price: 699,
    category: "Basketball",
    image: "https://images.unsplash.com/photo-1519861531473-9200262188bf?w=800",
    stock: 25,
    featured: false,
  },
  {
    name: "Basketball Hoop",
    description: "Basketball hoop for recreational practice.",
    price: 3499,
    category: "Basketball",
    image: "https://images.unsplash.com/photo-1546519638-68e109498ffc?w=800",
    stock: 10,
    featured: false,
  },

  // ========== CRICKET ==========
  {
    name: "Cricket Bat",
    description: "Strong and lightweight cricket bat.",
    price: 1499,
    category: "Cricket",
    image: "https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=800",
    stock: 12,
    featured: true,
  },
  {
    name: "Professional Cricket Bat",
    description: "Premium cricket bat for competitive matches.",
    price: 3999,
    category: "Cricket",
    image: "https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=800",
    stock: 10,
    featured: false,
  },
  {
    name: "Cricket Ball",
    description: "Durable cricket ball for practice and matches.",
    price: 399,
    category: "Cricket",
    image: "https://images.unsplash.com/photo-1593341646782-e0b495cff86d?w=800",
    stock: 40,
    featured: false,
  },
  {
    name: "Cricket Helmet",
    description: "Protective helmet for cricket players.",
    price: 1999,
    category: "Cricket",
    image: "https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=800",
    stock: 15,
    featured: false,
  },
  {
    name: "Cricket Batting Gloves",
    description: "Comfortable protective batting gloves.",
    price: 899,
    category: "Cricket",
    image: "https://images.unsplash.com/photo-1593341646782-e0b495cff86d?w=800",
    stock: 22,
    featured: false,
  },
  {
    name: "Cricket Stumps",
    description: "Wooden cricket stumps for training.",
    price: 799,
    category: "Cricket",
    image: "https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=800",
    stock: 18,
    featured: false,
  },

  // ========== CLOTHING ==========
  {
    name: "Sports T-Shirt",
    description: "Breathable sports T-shirt for gym and training.",
    price: 599,
    category: "Clothing",
    image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800",
    stock: 25,
    featured: false,
  },
  {
    name: "Gym T-Shirt",
    description: "Lightweight T-shirt for everyday workouts.",
    price: 699,
    category: "Clothing",
    image: "https://images.unsplash.com/photo-1503341504253-dff4815485f1?w=800",
    stock: 30,
    featured: false,
  },
  {
    name: "Sports Shorts",
    description: "Comfortable shorts for running and training.",
    price: 499,
    category: "Clothing",
    image: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800",
    stock: 35,
    featured: false,
  },
  {
    name: "Training Tracksuit",
    description: "Comfortable tracksuit for outdoor workouts.",
    price: 1899,
    category: "Clothing",
    image: "https://images.unsplash.com/photo-1556906781-9a412961c28c?w=800",
    stock: 20,
    featured: false,
  },
  {
    name: "Sports Hoodie",
    description: "Warm hoodie for sports and casual wear.",
    price: 1299,
    category: "Clothing",
    image: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=800",
    stock: 25,
    featured: false,
  },
  {
    name: "Running Jacket",
    description: "Lightweight jacket for running outdoors.",
    price: 1599,
    category: "Clothing",
    image: "https://images.unsplash.com/photo-1544923246-77307dd654cb?w=800",
    stock: 15,
    featured: false,
  },

  // ========== BADMINTON ==========
  {
    name: "Badminton Racket",
    description: "Lightweight racket for beginner players.",
    price: 899,
    category: "Badminton",
    image: "https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?w=800",
    stock: 18,
    featured: false,
  },
  {
    name: "Professional Badminton Racket",
    description: "Premium racket with improved control.",
    price: 2499,
    category: "Badminton",
    image: "https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?w=800",
    stock: 12,
    featured: false,
  },
  {
    name: "Badminton Shuttlecocks",
    description: "Durable shuttlecocks for regular practice.",
    price: 499,
    category: "Badminton",
    image: "https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?w=800",
    stock: 40,
    featured: false,
  },
  {
    name: "Badminton Shoes",
    description: "Non-marking court shoes with strong grip.",
    price: 2199,
    category: "Badminton",
    image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800",
    stock: 16,
    featured: false,
  },
  {
    name: "Badminton Racket Bag",
    description: "Protective bag for badminton equipment.",
    price: 799,
    category: "Badminton",
    image: "https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?w=800",
    stock: 20,
    featured: false,
  },
  {
    name: "Badminton Net",
    description: "Portable net for badminton practice.",
    price: 1199,
    category: "Badminton",
    image: "https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?w=800",
    stock: 14,
    featured: false,
  },

  // ========== SHOES ==========
  {
    name: "Running Shoes",
    description: "Comfortable lightweight running shoes.",
    price: 2499,
    category: "Shoes",
    image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800",
    stock: 20,
    featured: true,
  },
  {
    name: "Nike Running Shoes",
    description: "Stylish running shoes for daily workouts.",
    price: 3499,
    category: "Shoes",
    image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800",
    stock: 15,
    featured: false,
  },
  {
    name: "Adidas Sports Shoes",
    description: "Comfortable shoes for gym and training.",
    price: 2999,
    category: "Shoes",
    image: "https://images.unsplash.com/photo-1600185365926-3a2ce3cdb9eb?w=800",
    stock: 18,
    featured: false,
  },
  {
    name: "Training Shoes",
    description: "Versatile sports shoes for fitness workouts.",
    price: 1999,
    category: "Shoes",
    image: "https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?w=800",
    stock: 22,
    featured: false,
  },
  {
    name: "Walking Shoes",
    description: "Soft cushioned shoes for daily walking.",
    price: 1799,
    category: "Shoes",
    image: "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=800",
    stock: 25,
    featured: false,
  },
  {
    name: "Sports Sneakers",
    description: "Modern sneakers for casual and sports use.",
    price: 2299,
    category: "Shoes",
    image: "https://images.unsplash.com/photo-1600269452121-4f2416e55c28?w=800",
    stock: 20,
    featured: false,
  },
];

async function seedProducts() {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI is missing from .env");
    }

    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB connected");

    for (const product of products) {
      const { stock, ...productDetails } = product;

      // Existing products retain their current stock.
      // New products receive the initial stock quantity.
      await Product.updateOne(
        { name: product.name },
        {
          $set: productDetails,
          $setOnInsert: { stock },
        },
        { upsert: true }
      );

      console.log(`Seeded: ${product.name}`);
    }

    console.log(
      `Successfully seeded ${products.length} products!`
    );
  } catch (error) {
    console.error("Seeding failed:", error);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

seedProducts();
