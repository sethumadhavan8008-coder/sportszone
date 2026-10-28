
import { useEffect, useState } from "react";
import {
  Link,
  Routes,
  Route,
  useNavigate,
  useParams,
  useSearchParams,
  useLocation
} from "react-router-dom";

// Backend URL
const API = (
  import.meta.env.VITE_API_URL || "http://localhost:5000"
).replace(/\/+$/, "");

// Product categories
const categories = [
  "All",
  "Shoes",
  "Football",
  "Basketball",
  "Cricket",
  "Clothing",
  "Badminton"
];

const placeholder = "https://placehold.co/600x450?text=SportZone";

const money = (value) =>
  `₹${Number(value || 0).toLocaleString("en-IN")}`;

// Connect React to Express backend
async function apiRequest(path, options = {}) {
  const token = localStorage.getItem("sportzone_token");

  const response = await fetch(`${API}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers
    }
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Something went wrong");
  }

  return data;
}

// Display product images
function ProductImage({ src, alt, className = "" }) {
  const [image, setImage] = useState(src || placeholder);

  useEffect(() => {
    setImage(src || placeholder);
  }, [src]);

  return (
    <img
      className={className}
      src={image}
      alt={alt}
      onError={() => {
        if (image !== placeholder) setImage(placeholder);
      }}
    />
  );
}

// MAIN APP
export default function App() {
  const navigate = useNavigate();

  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("sportzone_user"));
    } catch {
      return null;
    }
  });

  const [cart, setCart] = useState(() => {
    try {
      const saved = JSON.parse(
        localStorage.getItem("sportzone_cart")
      );
      return Array.isArray(saved) ? saved : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem("sportzone_cart", JSON.stringify(cart));
  }, [cart]);

  // Verify saved login with backend
  useEffect(() => {
    if (!localStorage.getItem("sportzone_token")) return;

    apiRequest("/api/auth/me")
      .then((data) => {
        setUser(data);
        localStorage.setItem(
          "sportzone_user",
          JSON.stringify(data)
        );
      })
      .catch(() => {
        localStorage.removeItem("sportzone_token");
        localStorage.removeItem("sportzone_user");
        setUser(null);
      });
  }, []);

  function handleLogin(data) {
    localStorage.setItem("sportzone_token", data.token);
    localStorage.setItem(
      "sportzone_user",
      JSON.stringify(data.user)
    );
    setUser(data.user);
    navigate("/");
  }

  function logout() {
    localStorage.removeItem("sportzone_token");
    localStorage.removeItem("sportzone_user");
    setUser(null);
    navigate("/");
  }

  function addToCart(product) {
    if (product.stock <= 0) {
      alert("Product is out of stock");
      return;
    }

    const existing = cart.find(
      (item) => item._id === product._id
    );

    if (existing && existing.quantity >= product.stock) {
      alert("Maximum available stock reached");
      return;
    }

    setCart((previous) => {
      const found = previous.find(
        (item) => item._id === product._id
      );

      if (found) {
        return previous.map((item) =>
          item._id === product._id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }

      return [...previous, { ...product, quantity: 1 }];
    });

    alert("Product added to cart!");
  }

  function changeQuantity(id, amount) {
    setCart((previous) =>
      previous
        .map((item) =>
          item._id === id
            ? {
                ...item,
                quantity: Math.max(
                  0,
                  Math.min(
                    item.stock,
                    item.quantity + amount
                  )
                )
              }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  }

  function removeFromCart(id) {
    setCart((previous) =>
      previous.filter((item) => item._id !== id)
    );
  }

  const cartCount = cart.reduce(
    (sum, item) => sum + item.quantity,
    0
  );

  return (
    <>
      <header className="navbar">
        <Link to="/" className="logo">
          SPORT<span>ZONE</span>
        </Link>

        <nav>
          <Link to="/">Home</Link>
          <Link to="/products">Products</Link>
          <Link to="/cart">Cart ({cartCount})</Link>

          {user ? (
            <>
              <Link to="/orders">My Orders</Link>

              {user.role === "admin" && (
                <Link to="/admin">Admin</Link>
              )}

              <button
                className="nav-button"
                onClick={logout}
              >
                Logout
              </button>
            </>
          ) : (
            <Link to="/login">Login / Signup</Link>
          )}
        </nav>
      </header>

      <main>
        <Routes>
          <Route
            path="/"
            element={
              <Home addToCart={addToCart} />
            }
          />

          <Route
            path="/products"
            element={
              <Products addToCart={addToCart} />
            }
          />

          <Route
            path="/products/:id"
            element={
              <ProductDetails addToCart={addToCart} />
            }
          />

          <Route
            path="/cart"
            element={
              <Cart
                cart={cart}
                changeQuantity={changeQuantity}
                removeFromCart={removeFromCart}
              />
            }
          />

          <Route
            path="/login"
            element={
              <Auth onLogin={handleLogin} />
            }
          />

          <Route
            path="/checkout"
            element={
              <Checkout
                cart={cart}
                user={user}
                clearCart={() => setCart([])}
              />
            }
          />

          <Route
            path="/order-success"
            element={<OrderSuccess />}
          />

          <Route
            path="/orders"
            element={<Orders user={user} />}
          />

          <Route
            path="/admin"
            element={<Admin user={user} />}
          />

          <Route
            path="*"
            element={
              <section className="container">
                <h2>Page not found</h2>
                <Link to="/" className="btn">
                  Go Home
                </Link>
              </section>
            }
          />
        </Routes>
      </main>

      <footer>
        <strong>SPORTZONE</strong>
        <p>Your Game. Your Gear. Your Store.</p>
        <small>
          © 2026 SportZone. All rights reserved.
        </small>
      </footer>
    </>
  );
}

// REUSABLE PRODUCT CARD
function ProductCard({ product, addToCart }) {
  return (
    <article className="product-card">
      <Link to={`/products/${product._id}`}>
        <ProductImage
          src={product.image}
          alt={product.name}
          className="product-photo"
        />
      </Link>

      <div className="product-info">
        <small>{product.category}</small>

        <Link to={`/products/${product._id}`}>
          <h3>{product.name}</h3>
        </Link>

        <p className="price">
          {money(product.price)}
        </p>

        <p className="stock">
          {product.stock > 0
            ? `${product.stock} in stock`
            : "Out of stock"}
        </p>

        <button
          className="btn"
          disabled={product.stock <= 0}
          onClick={() => addToCart(product)}
        >
          {product.stock > 0
            ? "Add to Cart"
            : "Out of Stock"}
        </button>
      </div>
    </article>
  );
}

// HOMEPAGE
function Home({ addToCart }) {
  const [products, setProducts] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    apiRequest("/api/products")
      .then(setProducts)
      .catch((err) => setError(err.message));
  }, []);

  const featured = products.filter(
    (product) => product.featured
  );

  const displayed = (
    featured.length ? featured : products
  ).slice(0, 4);

  const categoryIcons = {
    Shoes: "👟",
    Football: "⚽",
    Basketball: "🏀",
    Cricket: "🏏",
    Clothing: "👕",
    Badminton: "🏸"
  };

  return (
    <>
      <section className="hero">
        <div className="hero-content">
          <p className="eyebrow">
            WELCOME TO SPORTZONE
          </p>

          <h1>
            GEAR UP.
            <br />
            GAME ON.
          </h1>

          <p>
            Discover sports equipment, running shoes,
            activewear and accessories for every athlete.
          </p>

          <Link to="/products" className="btn">
            Shop Collection
          </Link>
        </div>

        <div className="hero-art">🏆</div>
      </section>

      <section className="container">
        <div className="section-heading">
          <div>
            <h2>Shop by Category</h2>
            <p>Choose your favorite sport.</p>
          </div>
        </div>

        <div className="category-grid">
          {categories.slice(1).map((category) => (
            <Link
              key={category}
              to={`/products?category=${encodeURIComponent(category)}`}
              className="category-card"
            >
              <span className="category-icon">
                {categoryIcons[category]}
              </span>

              <h3>{category}</h3>
              <p>Shop Now</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="container">
        <div className="section-heading">
          <div>
            <h2>Featured Products</h2>
            <p>Our popular sports essentials.</p>
          </div>

          <Link to="/products" className="view-all">
            View All Products →
          </Link>
        </div>

        {error && (
          <p className="error">{error}</p>
        )}

        <div className="product-grid">
          {displayed.map((product) => (
            <ProductCard
              key={product._id}
              product={product}
              addToCart={addToCart}
            />
          ))}
        </div>
      </section>

      <section className="promo">
        <h2>READY FOR YOUR NEXT GAME?</h2>

        <p>
          Quality sports essentials at affordable prices.
        </p>

        <Link to="/products" className="btn">
          Explore Products
        </Link>
      </section>

      <section className="container benefits">
        <div>
          <h3>📦 Easy Ordering</h3>
          <p>Simple shopping and checkout.</p>
        </div>

        <div>
          <h3>💵 Cash on Delivery</h3>
          <p>Pay when your order arrives.</p>
        </div>

        <div>
          <h3>🏅 Sports Collection</h3>
          <p>Equipment for different sports.</p>
        </div>
      </section>
    </>
  );
}

// PRODUCTS PAGE
function Products({ addToCart }) {
  const [searchParams, setSearchParams] =
    useSearchParams();

  const category =
    searchParams.get("category") || "All";

  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadProducts() {
      try {
        setLoading(true);

        const data = await apiRequest(
          "/api/products"
        );

        setProducts(data);
        setError("");
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadProducts();
  }, []);

  const availableCategories = [
    ...new Set([
      ...categories,
      ...products.map(
        (product) => product.category
      )
    ])
  ];

  const filtered = products.filter((product) => {
    const matchesSearch = product.name
      .toLowerCase()
      .includes(search.toLowerCase());

    const matchesCategory =
      category === "All" ||
      product.category === category;

    return matchesSearch && matchesCategory;
  });

  return (
    <section className="container">
      <div className="page-heading">
        <h1>Our Products</h1>
        <p>Find the perfect gear for your sport.</p>
      </div>

      <div className="filters">
        <input
          placeholder="Search sports products..."
          value={search}
          onChange={(e) =>
            setSearch(e.target.value)
          }
        />

        <select
          value={category}
          onChange={(e) =>
            setSearchParams(
              e.target.value === "All"
                ? {}
                : { category: e.target.value }
            )
          }
        >
          {availableCategories.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </div>

      {loading && <p>Loading products...</p>}

      {error && (
        <p className="error">{error}</p>
      )}

      {!loading && !error && (
        <>
          <p className="result-count">
            Showing {filtered.length} products
          </p>

          <div className="product-grid">
            {filtered.map((product) => (
              <ProductCard
                key={product._id}
                product={product}
                addToCart={addToCart}
              />
            ))}
          </div>

          {filtered.length === 0 && (
            <p>No products found.</p>
          )}
        </>
      )}
    </section>
  );
}

// PRODUCT DETAILS
function ProductDetails({ addToCart }) {
  const { id } = useParams();

  const [product, setProduct] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    apiRequest(`/api/products/${id}`)
      .then(setProduct)
      .catch((err) => setError(err.message));
  }, [id]);

  if (error) {
    return (
      <p className="container error">{error}</p>
    );
  }

  if (!product) {
    return (
      <p className="container">
        Loading product...
      </p>
    );
  }

  return (
    <section className="container detail-layout">
      <ProductImage
        src={product.image}
        alt={product.name}
        className="detail-image"
      />

      <div className="detail-content">
        <Link
          to="/products"
          className="back-link"
        >
          ← Back to Products
        </Link>

        <p className="category-label">
          {product.category}
        </p>

        <h1>{product.name}</h1>

        <h2 className="price">
          {money(product.price)}
        </h2>

        <p>{product.description}</p>

        <p className="stock">
          {product.stock > 0
            ? `${product.stock} items available`
            : "Out of stock"}
        </p>

        <button
          className="btn"
          disabled={product.stock <= 0}
          onClick={() => addToCart(product)}
        >
          Add to Cart
        </button>
      </div>
    </section>
  );
}

// SHOPPING CART
function Cart({
  cart,
  changeQuantity,
  removeFromCart
}) {
  const total = cart.reduce(
    (sum, item) =>
      sum + item.price * item.quantity,
    0
  );

  return (
    <section className="container">
      <h1>Shopping Cart</h1>

      {cart.length === 0 ? (
        <div className="empty-state">
          <h2>🛒 Your cart is empty</h2>

          <p>
            Explore our products and add
            something you like.
          </p>

          <Link
            to="/products"
            className="btn"
          >
            Continue Shopping
          </Link>
        </div>
      ) : (
        <div className="cart-layout">
          <div>
            {cart.map((item) => (
              <div
                className="cart-item"
                key={item._id}
              >
                <ProductImage
                  src={item.image}
                  alt={item.name}
                  className="cart-photo"
                />

                <div className="cart-details">
                  <h3>{item.name}</h3>

                  <p>{money(item.price)}</p>

                  <div className="quantity">
                    <button
                      onClick={() =>
                        changeQuantity(
                          item._id,
                          -1
                        )
                      }
                    >
                      −
                    </button>

                    <span>
                      {item.quantity}
                    </span>

                    <button
                      disabled={
                        item.quantity >= item.stock
                      }
                      onClick={() =>
                        changeQuantity(
                          item._id,
                          1
                        )
                      }
                    >
                      +
                    </button>
                  </div>

                  <button
                    className="remove-btn"
                    onClick={() =>
                      removeFromCart(item._id)
                    }
                  >
                    Remove
                  </button>
                </div>

                <strong>
                  {money(
                    item.price * item.quantity
                  )}
                </strong>
              </div>
            ))}
          </div>

          <aside className="summary">
            <h2>Order Summary</h2>

            <p>
              Total Items:{" "}
              {cart.reduce(
                (sum, item) =>
                  sum + item.quantity,
                0
              )}
            </p>

            <div className="summary-total">
              <strong>Total</strong>
              <strong>
                {money(total)}
              </strong>
            </div>

            <p>
              Payment: Cash on Delivery
            </p>

            <Link
              to="/checkout"
              className="btn"
            >
              Proceed to Checkout
            </Link>

            <Link
              to="/products"
              className="continue-link"
            >
              Continue Shopping
            </Link>
          </aside>
        </div>
      )}
    </section>
  );
}

// LOGIN AND SIGNUP
function Auth({ onLogin }) {
  const [isRegister, setIsRegister] =
    useState(false);

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: ""
  });

  const [error, setError] = useState("");
  const [loading, setLoading] =
    useState(false);

  async function submit(e) {
    e.preventDefault();

    setLoading(true);
    setError("");

    try {
      const endpoint = isRegister
        ? "/api/auth/register"
        : "/api/auth/login";

      const data = await apiRequest(
        endpoint,
        {
          method: "POST",
          body: JSON.stringify(form)
        }
      );

      onLogin(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="auth-box">
      <h1>
        {isRegister
          ? "Create Account"
          : "Welcome Back"}
      </h1>

      <p>
        {isRegister
          ? "Join SportZone and start shopping."
          : "Login to your SportZone account."}
      </p>

      <form onSubmit={submit}>
        {isRegister && (
          <input
            required
            placeholder="Full Name"
            value={form.name}
            onChange={(e) =>
              setForm({
                ...form,
                name: e.target.value
              })
            }
          />
        )}

        <input
          type="email"
          required
          placeholder="Email Address"
          value={form.email}
          onChange={(e) =>
            setForm({
              ...form,
              email: e.target.value
            })
          }
        />

        <input
          type="password"
          required
          minLength={
            isRegister ? 6 : undefined
          }
          placeholder="Password"
          value={form.password}
          onChange={(e) =>
            setForm({
              ...form,
              password: e.target.value
            })
          }
        />

        {error && (
          <p className="error">{error}</p>
        )}

        <button
          className="btn"
          disabled={loading}
        >
          {loading
            ? "Please wait..."
            : isRegister
            ? "Sign Up"
            : "Login"}
        </button>
      </form>

      <p>
        {isRegister
          ? "Already have an account?"
          : "Don't have an account?"}
        {" "}

        <button
          className="text-button"
          onClick={() => {
            setIsRegister(!isRegister);
            setError("");
          }}
        >
          {isRegister
            ? "Login"
            : "Sign Up"}
        </button>
      </p>
    </section>
  );
}

// CASH ON DELIVERY CHECKOUT
function Checkout({
  cart,
  user,
  clearCart
}) {
  const navigate = useNavigate();

  const [address, setAddress] = useState({
    fullName: user?.name || "",
    phone: "",
    address: "",
    city: "",
    postalCode: ""
  });

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const total = cart.reduce(
    (sum, item) =>
      sum + item.price * item.quantity,
    0
  );

  async function placeOrder(e) {
    e.preventDefault();

    setLoading(true);
    setError("");

    try {
      const result = await apiRequest(
        "/api/orders",
        {
          method: "POST",
          body: JSON.stringify({
            items: cart.map((item) => ({
              productId: item._id,
              quantity: item.quantity
            })),
            shippingAddress: address
          })
        }
      );

      clearCart();

      navigate("/order-success", {
        state: {
          order: result.order
        }
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (!user) {
    return (
      <section className="container empty-state">
        <h2>
          Please log in before checkout
        </h2>

        <Link
          to="/login"
          className="btn"
        >
          Login
        </Link>
      </section>
    );
  }

  if (cart.length === 0) {
    return (
      <section className="container empty-state">
        <h2>Your cart is empty</h2>

        <Link
          to="/products"
          className="btn"
        >
          Shop Now
        </Link>
      </section>
    );
  }

  return (
    <section className="container">
      <h1>Checkout</h1>

      <div className="checkout-layout">
        <form
          className="checkout-form"
          onSubmit={placeOrder}
        >
          <h2>Shipping Details</h2>

          {[
            ["fullName", "Full Name"],
            ["phone", "Phone Number"],
            ["address", "Street Address"],
            ["city", "City"],
            ["postalCode", "Postal Code"]
          ].map(([key, label]) => (
            <label key={key}>
              {label}

              <input
                required
                value={address[key]}
                onChange={(e) =>
                  setAddress({
                    ...address,
                    [key]: e.target.value
                  })
                }
              />
            </label>
          ))}

          <h3>Payment Method</h3>

          <div className="payment-option">
            <strong>
              💵 Cash on Delivery
            </strong>

            <p>
              Pay when your order arrives.
            </p>
          </div>

          {error && (
            <p className="error">
              {error}
            </p>
          )}

          <button
            className="btn"
            disabled={loading}
          >
            {loading
              ? "Placing Order..."
              : "Place Order"}
          </button>
        </form>

        <aside className="summary">
          <h2>Your Order</h2>

          {cart.map((item) => (
            <div
              className="summary-line"
              key={item._id}
            >
              <span>
                {item.name} × {item.quantity}
              </span>

              <strong>
                {money(
                  item.price * item.quantity
                )}
              </strong>
            </div>
          ))}

          <div className="summary-total">
            <strong>
              Estimated Total
            </strong>

            <strong>
              {money(total)}
            </strong>
          </div>

          <small>
            Final total is calculated
            by the backend.
          </small>
        </aside>
      </div>
    </section>
  );
}

// ORDER SUCCESS PAGE
function OrderSuccess() {
  const location = useLocation();
  const navigate = useNavigate();

  const order = location.state?.order;

  return (
    <section className="container">
      <div className="success-card">
        <div className="success-icon">
          ✓
        </div>

        <h1>
          Order Placed Successfully!
        </h1>

        <p>
          Thank you for shopping
          with SportZone.
        </p>

        {order && (
          <>
            <p>
              Order ID:{" "}
              <strong>{order._id}</strong>
            </p>

            <p>
              Total:{" "}
              <strong>
                {money(order.totalAmount)}
              </strong>
            </p>
          </>
        )}

        <p>
          Payment Method:
          Cash on Delivery
        </p>

        <button
          className="btn"
          onClick={() =>
            navigate("/orders")
          }
        >
          View My Orders
        </button>
      </div>
    </section>
  );
}

// MY ORDERS
function Orders({ user }) {
  const [orders, setOrders] =
    useState([]);

  const [error, setError] =
    useState("");

  useEffect(() => {
    if (!user) return;

    apiRequest("/api/orders/my")
      .then(setOrders)
      .catch((err) =>
        setError(err.message)
      );
  }, [user]);

  if (!user) {
    return (
      <section className="container">
        <h2>
          Please log in to view orders.
        </h2>

        <Link
          to="/login"
          className="btn"
        >
          Login
        </Link>
      </section>
    );
  }

  return (
    <section className="container">
      <h1>My Orders</h1>

      {error && (
        <p className="error">
          {error}
        </p>
      )}

      {orders.length === 0 &&
        !error && (
          <div className="empty-state">
            <h2>No orders yet</h2>

            <Link
              to="/products"
              className="btn"
            >
              Start Shopping
            </Link>
          </div>
        )}

      {orders.map((order) => (
        <div
          className="order-card"
          key={order._id}
        >
          <div className="order-header">
            <h3>
              Order #
              {order._id
                .slice(-8)
                .toUpperCase()}
            </h3>

            <span className="status-badge">
              {order.status}
            </span>
          </div>

          <p>
            Date:{" "}
            {new Date(
              order.createdAt
            ).toLocaleDateString()}
          </p>

          {order.items.map(
            (item, index) => (
              <p key={index}>
                {item.name} ×{" "}
                {item.quantity}
              </p>
            )
          )}

          <p>
            Payment: Cash on Delivery
          </p>

          <h3>
            Total:{" "}
            {money(order.totalAmount)}
          </h3>
        </div>
      ))}
    </section>
  );
}

// ADMIN DASHBOARD
function Admin({ user }) {
  const [products, setProducts] =
    useState([]);

  const [orders, setOrders] =
    useState([]);

  const [editingId, setEditingId] =
    useState(null);

  const [error, setError] =
    useState("");

  const [message, setMessage] =
    useState("");

  const emptyForm = {
    name: "",
    description: "",
    price: "",
    category: "Shoes",
    image: "",
    stock: "10",
    featured: false
  };

  const [form, setForm] =
    useState(emptyForm);

  async function loadData() {
    try {
      const [
        productData,
        orderData
      ] = await Promise.all([
        apiRequest("/api/products"),
        apiRequest("/api/admin/orders")
      ]);

      setProducts(productData);
      setOrders(orderData);
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    if (user?.role === "admin") {
      loadData();
    }
  }, [user]);

  if (user?.role !== "admin") {
    return (
      <section className="container">
        <h2>Admin access only</h2>

        <p>
          Please log in with your
          administrator account.
        </p>
      </section>
    );
  }

  function startEdit(product) {
    setEditingId(product._id);

    setForm({
      name: product.name,
      description:
        product.description || "",
      price: String(product.price),
      category: product.category,
      image: product.image || "",
      stock: String(product.stock),
      featured: Boolean(
        product.featured
      )
    });

    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm({ ...emptyForm });
  }

  async function saveProduct(e) {
    e.preventDefault();

    setError("");
    setMessage("");

    try {
      const path = editingId
        ? `/api/admin/products/${editingId}`
        : "/api/admin/products";

      await apiRequest(path, {
        method: editingId
          ? "PUT"
          : "POST",
        body: JSON.stringify({
          ...form,
          price: Number(form.price),
          stock: Number(form.stock)
        })
      });

      setMessage(
        editingId
          ? "Product updated successfully!"
          : "Product added successfully!"
      );

      cancelEdit();
      await loadData();
    } catch (err) {
      setError(err.message);
    }
  }

  async function deleteProduct(id) {
    if (
      !window.confirm(
        "Delete this product?"
      )
    ) {
      return;
    }

    try {
      setError("");

      await apiRequest(
        `/api/admin/products/${id}`,
        {
          method: "DELETE"
        }
      );

      setMessage(
        "Product deleted successfully!"
      );

      await loadData();
    } catch (err) {
      setError(err.message);
    }
  }

  async function updateStatus(
    id,
    status
  ) {
    try {
      setError("");

      await apiRequest(
        `/api/admin/orders/${id}`,
        {
          method: "PATCH",
          body: JSON.stringify({
            status
          })
        }
      );

      setMessage(
        "Order status updated!"
      );

      await loadData();
    } catch (err) {
      setError(err.message);
    }
  }

  const pendingOrders =
    orders.filter(
      (order) =>
        order.status === "Pending"
    ).length;

  return (
    <section className="container">
      <h1>Admin Dashboard</h1>

      <p>
        Manage SportZone products
        and customer orders.
      </p>

      <div className="stats">
        <div>
          <h2>
            {products.length}
          </h2>

          <p>Total Products</p>
        </div>

        <div>
          <h2>
            {orders.length}
          </h2>

          <p>Total Orders</p>
        </div>

        <div>
          <h2>
            {pendingOrders}
          </h2>

          <p>Pending Orders</p>
        </div>
      </div>

      {error && (
        <p className="error">
          {error}
        </p>
      )}

      {message && (
        <p className="success-message">
          {message}
        </p>
      )}

      <div className="admin-section">
        <h2>
          {editingId
            ? "Edit Product"
            : "Add New Product"}
        </h2>

        <form
          className="admin-form"
          onSubmit={saveProduct}
        >
          <input
            required
            placeholder="Product Name"
            value={form.name}
            onChange={(e) =>
              setForm({
                ...form,
                name: e.target.value
              })
            }
          />

          <input
            required
            type="number"
            min="0"
            step="0.01"
            placeholder="Price"
            value={form.price}
            onChange={(e) =>
              setForm({
                ...form,
                price: e.target.value
              })
            }
          />

          <select
            value={form.category}
            onChange={(e) =>
              setForm({
                ...form,
                category: e.target.value
              })
            }
          >
            {categories
              .slice(1)
              .map((category) => (
                <option key={category}>
                  {category}
                </option>
              ))}
          </select>

          <input
            required
            type="number"
            min="0"
            placeholder="Stock Quantity"
            value={form.stock}
            onChange={(e) =>
              setForm({
                ...form,
                stock: e.target.value
              })
            }
          />

          <input
            type="url"
            placeholder="Product Image URL"
            value={form.image}
            onChange={(e) =>
              setForm({
                ...form,
                image: e.target.value
              })
            }
          />

          <textarea
            placeholder="Product Description"
            value={form.description}
            onChange={(e) =>
              setForm({
                ...form,
                description:
                  e.target.value
              })
            }
          />

          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={form.featured}
              onChange={(e) =>
                setForm({
                  ...form,
                  featured:
                    e.target.checked
                })
              }
            />

            Show as Featured Product
          </label>

          {form.image && (
            <ProductImage
              src={form.image}
              alt="Product Preview"
              className="admin-preview"
            />
          )}

          <div className="admin-actions">
            <button className="btn">
              {editingId
                ? "Save Changes"
                : "Add Product"}
            </button>

            {editingId && (
              <button
                type="button"
                className="secondary-btn"
                onClick={cancelEdit}
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="admin-section">
        <h2>Manage Products</h2>

        {products.map((product) => (
          <div
            className="admin-row"
            key={product._id}
          >
            <div className="admin-product">
              <ProductImage
                src={product.image}
                alt={product.name}
                className="admin-thumb"
              />

              <div>
                <strong>
                  {product.name}
                </strong>

                <p>
                  {money(product.price)}
                  {" | "}
                  Stock: {product.stock}
                </p>
              </div>
            </div>

            <div className="admin-actions">
              <button
                className="secondary-btn"
                onClick={() =>
                  startEdit(product)
                }
              >
                Edit
              </button>

              <button
                className="danger"
                onClick={() =>
                  deleteProduct(
                    product._id
                  )
                }
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="admin-section">
        <h2>Customer Orders</h2>

        {orders.length === 0 && (
          <p>No orders yet.</p>
        )}

        {orders.map((order) => (
          <div
            className="order-card"
            key={order._id}
          >
            <div className="order-header">
              <h3>
                Order #
                {order._id
                  .slice(-8)
                  .toUpperCase()}
              </h3>

              <span className="status-badge">
                {order.status}
              </span>
            </div>

            <p>
              Customer:{" "}
              {order.user?.name ||
                "Unknown"}
            </p>

            <p>
              Email:{" "}
              {order.user?.email ||
                "Unknown"}
            </p>

            {order.items.map(
              (item, index) => (
                <p key={index}>
                  {item.name} ×{" "}
                  {item.quantity}
                </p>
              )
            )}

            <p>
              Total:{" "}
              {money(
                order.totalAmount
              )}
            </p>

            <p>
              Payment:
              Cash on Delivery
            </p>

            <label>
              Update Status

              <select
                value={order.status}
                onChange={(e) =>
                  updateStatus(
                    order._id,
                    e.target.value
                  )
                }
              >
                {[
                  "Pending",
                  "Processing",
                  "Shipped",
                  "Delivered",
                  "Cancelled"
                ].map((status) => (
                  <option key={status}>
                    {status}
                  </option>
                ))}
              </select>
            </label>
          </div>
        ))}
      </div>
    </section>
  );
}
