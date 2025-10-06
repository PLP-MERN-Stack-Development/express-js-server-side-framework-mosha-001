// server.js - Complete Express API for Products

// Import required modules
const express = require('express');
const bodyParser = require('body-parser');
const { v4: uuidv4 } = require('uuid');

// Custom Error Classes
class NotFoundError extends Error {
  constructor(message) {
    super(message);
    this.name = 'NotFoundError';
    this.statusCode = 404;
  }
}

class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ValidationError';
    this.statusCode = 400;
  }
}

class AuthError extends Error {
  constructor(message) {
    super(message);
    this.name = 'AuthError';
    this.statusCode = 401;
  }
}

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;
const API_KEY = process.env.API_KEY || "my-secret-key"; // Example API key

// Middleware: JSON parsing
app.use(bodyParser.json());

// Custom Logger Middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});

// Authentication Middleware
const authenticate = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  if (!apiKey || apiKey !== API_KEY) {
    return next(new AuthError("Invalid or missing API Key"));
  }
  next();
};

// Validation Middleware for product creation/update
const validateProduct = (req, res, next) => {
  const { name, description, price, category, inStock } = req.body;
  if (!name || !description || typeof price !== 'number' || !category || typeof inStock !== 'boolean') {
    return next(new ValidationError("Invalid product data. Ensure all fields are provided correctly."));
  }
  next();
};

// Sample in-memory products database
let products = [
  {
    id: '1',
    name: 'Laptop',
    description: 'High-performance laptop with 16GB RAM',
    price: 1200,
    category: 'electronics',
    inStock: true
  },
  {
    id: '2',
    name: 'Smartphone',
    description: 'Latest model with 128GB storage',
    price: 800,
    category: 'electronics',
    inStock: true
  },
  {
    id: '3',
    name: 'Coffee Maker',
    description: 'Programmable coffee maker with timer',
    price: 50,
    category: 'kitchen',
    inStock: false
  }
];

// Root route
app.get('/', (req, res) => {
  res.send('Welcome to the Product API! Go to /api/products to see all products.');
});

// =====================
// CRUD Routes
// =====================

// GET /api/products - Get all products (with filtering, pagination)
app.get('/api/products', (req, res) => {
  let { category, page = 1, limit = 10 } = req.query;
  let filtered = [...products];

  if (category) {
    filtered = filtered.filter(p => p.category === category);
  }

  // Pagination
  page = parseInt(page);
  limit = parseInt(limit);
  const start = (page - 1) * limit;
  const end = start + limit;

  const paginated = filtered.slice(start, end);

  res.json({
    total: filtered.length,
    page,
    limit,
    data: paginated
  });
});

// GET /api/products/:id - Get a specific product
app.get('/api/products/:id', (req, res, next) => {
  const product = products.find(p => p.id === req.params.id);
  if (!product) return next(new NotFoundError("Product not found"));
  res.json(product);
});

// POST /api/products - Create a new product
app.post('/api/products', authenticate, validateProduct, (req, res) => {
  const { name, description, price, category, inStock } = req.body;
  const newProduct = { id: uuidv4(), name, description, price, category, inStock };
  products.push(newProduct);
  res.status(201).json(newProduct);
});

// PUT /api/products/:id - Update an existing product
app.put('/api/products/:id', authenticate, validateProduct, (req, res, next) => {
  const index = products.findIndex(p => p.id === req.params.id);
  if (index === -1) return next(new NotFoundError("Product not found"));

  const { name, description, price, category, inStock } = req.body;
  products[index] = { ...products[index], name, description, price, category, inStock };
  res.json(products[index]);
});

// DELETE /api/products/:id - Delete a product
app.delete('/api/products/:id', authenticate, (req, res, next) => {
  const index = products.findIndex(p => p.id === req.params.id);
  if (index === -1) return next(new NotFoundError("Product not found"));

  const deleted = products.splice(index, 1);
  res.json({ message: "Product deleted", deleted });
});

// =====================
// Extra Features
// =====================

// Search by name
app.get('/api/products/search/:name', (req, res) => {
  const term = req.params.name.toLowerCase();
  const results = products.filter(p => p.name.toLowerCase().includes(term));
  res.json(results);
});

// Product statistics (count by category)
app.get('/api/products/stats', (req, res) => {
  const stats = products.reduce((acc, product) => {
    acc[product.category] = (acc[product.category] || 0) + 1;
    return acc;
  }, {});
  res.json(stats);
});

// =====================
// Error Handling Middleware
// =====================
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.statusCode || 500).json({
    error: err.name || "InternalServerError",
    message: err.message || "Something went wrong"
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

// Export app for testing
module.exports = app;
