const mongoose = require('mongoose');
require('dotenv').config();

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

async function getAllStores() {
    try {
        console.log('🔌 Connecting to MongoDB Atlas...');
        await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('✅ Connected to MongoDB Atlas successfully!');

        console.log('\n📊 Fetching all stores from database...');
        const stores = await Store.find();
        
        console.log(`\n🏪 Found ${stores.length} stores in database:`);
        stores.forEach((store, index) => {
            console.log(`\n${index + 1}. ${store.name}`);
            console.log(`   Address: ${store.address}`);
            console.log(`   Coordinates: ${store.lat}, ${store.lng}`);
            console.log(`   Products: ${store.products.length} items`);
            if (store.products.length > 0) {
                console.log(`   Sample products: ${store.products.slice(0, 2).map(p => p.name).join(', ')}`);
            }
        });

        console.log('\n🎯 Key issue check: Are coordinates different?');
        const coords = stores.map(store => ({name: store.name, lat: store.lat, lng: store.lng}));
        const uniqueCoords = new Set(coords.map(c => `${c.lat},${c.lng}`));
        console.log(`Total stores: ${coords.length}`);
        console.log(`Unique coordinate pairs: ${uniqueCoords.size}`);
        
        if (uniqueCoords.size < coords.length) {
            console.log('\n⚠️  PROBLEM FOUND: Some stores have duplicate coordinates!');
            const coordCounts = {};
            coords.forEach(coord => {
                const key = `${coord.lat},${coord.lng}`;
                if (!coordCounts[key]) coordCounts[key] = [];
                coordCounts[key].push(coord.name);
            });
            
            Object.entries(coordCounts).forEach(([coord, names]) => {
                if (names.length > 1) {
                    console.log(`   📍 ${coord}: ${names.join(', ')}`);
                }
            });
        } else {
            console.log('✅ All stores have unique coordinates');
        }

        await mongoose.disconnect();
        console.log('\n🔌 Disconnected from database');
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

getAllStores();