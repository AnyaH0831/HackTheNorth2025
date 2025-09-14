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

// Function to get coordinates for an address using a simple geocoding approach
// In production, you'd use a proper geocoding service like Google Maps API
function getCoordinatesForAddress(address) {
    // This is a simple mapping - in reality you'd use a geocoding service
    const addressMappings = {
        '500 Phillip St, Waterloo, ON': { lat: 43.4750, lng: -80.5310 },  // Slightly different from original Sobeys
        '500 Lester St, Waterloo, ON': { lat: 43.4690, lng: -80.5250 },   // Different location
        // Add more mappings as needed
    };
    
    return addressMappings[address] || null;
}

async function fixDuplicateCoordinates() {
    try {
        console.log('🔌 Connecting to MongoDB Atlas...');
        await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('✅ Connected to MongoDB Atlas successfully!');

        console.log('\n🔧 Fixing duplicate coordinates...');
        
        // Fix Sobey_test coordinates
        const sobeyTest = await Store.findOne({ name: 'Sobey_test' });
        if (sobeyTest) {
            const newCoords = getCoordinatesForAddress(sobeyTest.address);
            if (newCoords) {
                await Store.updateOne(
                    { name: 'Sobey_test' },
                    { $set: { lat: newCoords.lat, lng: newCoords.lng } }
                );
                console.log(`✅ Updated Sobey_test coordinates to ${newCoords.lat}, ${newCoords.lng}`);
            } else {
                // Use a different coordinate near the original
                await Store.updateOne(
                    { name: 'Sobey_test' },
                    { $set: { lat: 43.4750, lng: -80.5310 } }
                );
                console.log('✅ Updated Sobey_test coordinates to 43.4750, -80.5310 (offset from original)');
            }
        }

        // Fix Sobey_test2 coordinates  
        const sobeyTest2 = await Store.findOne({ name: 'Sobey_test2' });
        if (sobeyTest2) {
            const newCoords = getCoordinatesForAddress(sobeyTest2.address);
            if (newCoords) {
                await Store.updateOne(
                    { name: 'Sobey_test2' },
                    { $set: { lat: newCoords.lat, lng: newCoords.lng } }
                );
                console.log(`✅ Updated Sobey_test2 coordinates to ${newCoords.lat}, ${newCoords.lng}`);
            } else {
                // Use a different coordinate near the original
                await Store.updateOne(
                    { name: 'Sobey_test2' },
                    { $set: { lat: 43.4690, lng: -80.5250 } }
                );
                console.log('✅ Updated Sobey_test2 coordinates to 43.4690, -80.5250 (different location)');
            }
        }

        console.log('\n📊 Verifying fix...');
        const stores = await Store.find();
        const coords = stores.map(store => ({name: store.name, lat: store.lat, lng: store.lng}));
        const uniqueCoords = new Set(coords.map(c => `${c.lat},${c.lng}`));
        
        console.log(`Total stores: ${coords.length}`);
        console.log(`Unique coordinate pairs: ${uniqueCoords.size}`);
        
        if (uniqueCoords.size === coords.length) {
            console.log('🎉 SUCCESS: All stores now have unique coordinates!');
        } else {
            console.log('⚠️  Still have duplicate coordinates');
        }

        await mongoose.disconnect();
        console.log('\n🔌 Disconnected from database');
        
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

fixDuplicateCoordinates();