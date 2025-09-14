const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('Connected to MongoDB Atlas'))
.catch(err => console.error('MongoDB connection error:', err));

// Store Schema
const storeSchema = new mongoose.Schema({
  name: { type: String, required: true },
  address: { type: String, required: true },
  phone: String,
  hours: String,
  lat: { type: Number, required: true },
  lng: { type: Number, required: true },
  products: [{
    productId: String,
    name: String,
    price: Number,
    brand: String,
    lastUpdated: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

const Store = mongoose.model('Store', storeSchema);

// Product Schema
const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  category: String,
  description: String
}, { timestamps: true });

const Product = mongoose.model('Product', productSchema);

// Routes

// Get all stores
app.get('/api/stores', async (req, res) => {
  try {
    const stores = await Store.find();
    res.json(stores);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get stores by product
app.get('/api/stores/search/:productName', async (req, res) => {
  try {
    const productName = req.params.productName;
    const stores = await Store.find({
      'products.name': { $regex: productName, $options: 'i' }
    });
    res.json(stores);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add new store
app.post('/api/stores', async (req, res) => {
  try {
    const store = new Store(req.body);
    await store.save();
    res.status(201).json(store);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update store prices
app.put('/api/stores/:id/products', async (req, res) => {
  try {
    const { id } = req.params;
    const { products } = req.body;
    
    const store = await Store.findByIdAndUpdate(
      id,
      { $set: { products } },
      { new: true }
    );
    
    res.json(store);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get all products
app.get('/api/products', async (req, res) => {
  try {
    const products = await Product.find();
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add new product
app.post('/api/products', async (req, res) => {
  try {
    const product = new Product(req.body);
    await product.save();
    res.status(201).json(product);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Root route
app.get('/', (req, res) => {
  res.json({
    message: 'Grocery Map API Server',
    status: 'Running',
    endpoints: {
      stores: '/api/stores',
      products: '/api/products',
      search: '/api/stores/search/:productName'
    }
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});