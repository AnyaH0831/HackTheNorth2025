const mongoose = require('mongoose');
require('dotenv').config();

// Store Schema (same as in server.js)
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

// Sample data
const sampleStores = [
  {
    name: "FreshMart",
    address: "200 University Ave W, Waterloo, ON",
    phone: "(519) 888-4567",
    hours: "7:00 AM - 11:00 PM",
    lat: 43.4723,
    lng: -80.5449,
    products: [
      { productId: "milk", name: "2% Milk (1L)", price: 3.49, brand: "Beatrice" },
      { productId: "bread", name: "Whole Wheat Bread", price: 2.99, brand: "Wonder" },
      { productId: "apples", name: "Gala Apples (1lb)", price: 2.49, brand: "Local Farm" }
    ]
  },
  {
    name: "ValueGrocer",
    address: "170 University Ave W, Waterloo, ON",
    phone: "(519) 888-9876",
    hours: "8:00 AM - 10:00 PM",
    lat: 43.4696,
    lng: -80.5428,
    products: [
      { productId: "milk", name: "2% Milk (1L)", price: 3.29, brand: "Natrel" },
      { productId: "bread", name: "Whole Wheat Bread", price: 2.79, brand: "Dempsters" },
      { productId: "apples", name: "Red Delicious (1lb)", price: 2.19, brand: "Ontario" }
    ]
  }
];

async function testDatabase() {
  try {
    console.log('🔌 Connecting to MongoDB Atlas...');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ Connected to MongoDB Atlas successfully!');
    
    // Test 1: Check existing stores
    console.log('\n📊 Checking existing stores...');
    const existingStores = await Store.find();
    console.log(`Found ${existingStores.length} existing stores`);
    
    if (existingStores.length > 0) {
      console.log('Existing stores:');
      existingStores.forEach(store => {
        console.log(`- ${store.name} (${store.products.length} products)`);
      });
    }
    
    // Test 2: Insert sample data if no stores exist
    if (existingStores.length === 0) {
      console.log('\n➕ No stores found. Inserting sample data...');
      
      const insertedStores = await Store.insertMany(sampleStores);
      console.log(`✅ Inserted ${insertedStores.length} sample stores`);
      
      insertedStores.forEach(store => {
        console.log(`- ${store.name} added with ID: ${store._id}`);
      });
    }
    
    // Test 3: Search functionality
    console.log('\n🔍 Testing search functionality...');
    const milkStores = await Store.find({
      'products.productId': 'milk'
    });
    console.log(`Found ${milkStores.length} stores selling milk:`);
    milkStores.forEach(store => {
      const milkProduct = store.products.find(p => p.productId === 'milk');
      console.log(`- ${store.name}: ${milkProduct.name} - $${milkProduct.price}`);
    });
    
    // Test 4: Verify connection is working
    console.log('\n🏥 Database health check...');
    const dbState = mongoose.connection.readyState;
    const states = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting'
    };
    console.log(`Database state: ${states[dbState]}`);
    
    console.log('\n🎉 All tests completed successfully!');
    console.log('Your database is properly connected and working.');
    
  } catch (error) {
    console.error('❌ Database test failed:', error.message);
    
    if (error.message.includes('authentication failed')) {
      console.log('💡 Fix: Check your username/password in the connection string');
    } else if (error.message.includes('network')) {
      console.log('💡 Fix: Check your internet connection and MongoDB Atlas network access');
    } else if (error.message.includes('timeout')) {
      console.log('💡 Fix: Check if your IP address is whitelisted in MongoDB Atlas');
    }
  } finally {
    // Close the connection
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from database');
    process.exit(0);
  }
}

// Run the test
console.log('🚀 Starting database connection test...');
testDatabase();