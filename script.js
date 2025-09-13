// Global variables
let map;
let userLocation = null;
let groceryStores = [];
let currentSearchResults = [];
let groceryList = [];
let chatbotMinimized = false;

// Gemini API configuration - Replace with your actual API key
const GEMINI_API_KEY = 'AIzaSyAHX7Zus69ppfJxMwiHJjkpzKphmyEBkAk';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

// Typical quantities for common grocery items (fallback data)
const typicalQuantities = {
    'milk': { quantity: 1, unit: 'L', description: '1 liter carton' },
    'bread': { quantity: 1, unit: 'loaf', description: '1 loaf' },
    'apples': { quantity: 2, unit: 'lbs', description: '2 pounds' },
    'bananas': { quantity: 1.5, unit: 'lbs', description: '1.5 pounds' },
    'eggs': { quantity: 1, unit: 'dozen', description: '1 dozen' },
    'chicken': { quantity: 1, unit: 'lb', description: '1 pound breast' },
    'rice': { quantity: 2, unit: 'lbs', description: '2 pound bag' },
    'pasta': { quantity: 1, unit: 'box', description: '1 box' },
    'tomatoes': { quantity: 1, unit: 'lb', description: '1 pound' },
    'onions': { quantity: 2, unit: 'lbs', description: '2 pound bag' },
    'potatoes': { quantity: 3, unit: 'lbs', description: '3 pound bag' },
    'cheese': { quantity: 0.5, unit: 'lb', description: '0.5 pound block' },
    'yogurt': { quantity: 4, unit: 'cups', description: '4-pack cups' },
    'cereal': { quantity: 1, unit: 'box', description: '1 box' },
    'orange juice': { quantity: 1, unit: 'L', description: '1 liter carton' }
};

// Sample grocery data - in a real app, this would come from an API
const sampleGroceryData = {
    stores: [
        {
            id: 1,
            name: "FreshMart",
            lat: 43.4723,
            lng: -80.5449,
            address: "200 University Ave W, Waterloo, ON",
            phone: "(519) 888-4567",
            hours: "7:00 AM - 11:00 PM",
            products: {
                "milk": { name: "2% Milk (1L)", price: 3.49, brand: "Beatrice" },
                "bread": { name: "Whole Wheat Bread", price: 2.99, brand: "Wonder" },
                "apples": { name: "Gala Apples (1lb)", price: 2.49, brand: "Local Farm" },
                "bananas": { name: "Bananas (1lb)", price: 1.29, brand: "Chiquita" },
                "eggs": { name: "Large Eggs (12ct)", price: 4.99, brand: "Free Range" },
                "chicken": { name: "Chicken Breast (1lb)", price: 8.99, brand: "Fresh" }
            }
        },
        {
            id: 2,
            name: "ValueGrocer",
            lat: 43.4643,
            lng: -80.5204,
            address: "150 University Ave W, Waterloo, ON",
            phone: "(519) 888-5678",
            hours: "8:00 AM - 10:00 PM",
            products: {
                "milk": { name: "2% Milk (1L)", price: 3.29, brand: "Neilson" },
                "bread": { name: "Whole Wheat Bread", price: 2.79, brand: "Dempsters" },
                "apples": { name: "Gala Apples (1lb)", price: 2.29, brand: "Ontario" },
                "bananas": { name: "Bananas (1lb)", price: 1.19, brand: "Del Monte" },
                "eggs": { name: "Large Eggs (12ct)", price: 4.79, brand: "Grade A" },
                "chicken": { name: "Chicken Breast (1lb)", price: 7.99, brand: "Fresh" }
            }
        },
        {
            id: 3,
            name: "SuperSave",
            lat: 43.4755,
            lng: -80.5372,
            address: "300 King St N, Waterloo, ON",
            phone: "(519) 888-9012",
            hours: "6:00 AM - 12:00 AM",
            products: {
                "milk": { name: "2% Milk (1L)", price: 3.69, brand: "Lactantia" },
                "bread": { name: "Whole Wheat Bread", price: 3.19, brand: "Country Harvest" },
                "apples": { name: "Gala Apples (1lb)", price: 2.69, brand: "Premium" },
                "bananas": { name: "Bananas (1lb)", price: 1.39, brand: "Fresh" },
                "eggs": { name: "Large Eggs (12ct)", price: 5.29, brand: "Organic" },
                "chicken": { name: "Chicken Breast (1lb)", price: 9.49, brand: "Premium" }
            }
        },
        {
            id: 4,
            name: "QuickStop Market",
            lat: 43.4589,
            lng: -80.5456,
            address: "85 University Ave W, Waterloo, ON",
            phone: "(519) 888-3456",
            hours: "24/7",
            products: {
                "milk": { name: "2% Milk (1L)", price: 3.99, brand: "Beatrice" },
                "bread": { name: "Whole Wheat Bread", price: 3.49, brand: "Wonder" },
                "apples": { name: "Gala Apples (1lb)", price: 2.89, brand: "Fresh" },
                "bananas": { name: "Bananas (1lb)", price: 1.49, brand: "Chiquita" },
                "eggs": { name: "Large Eggs (12ct)", price: 5.49, brand: "Free Range" },
                "chicken": { name: "Chicken Breast (1lb)", price: 10.99, brand: "Premium" }
            }
        }
    ]
};

// Initialize the application
async function initializeApp() {
    await initializeMap();
    await getUserLocation();
    await loadRealStoreData();
    setupEventListeners();
    initializeChatbot();
    
    // Add store markers to map
    groceryStores.forEach(store => {
        addStoreMarker(store);
    });
}

// Load real store data from APIs
async function loadRealStoreData() {
    try {
        // Try to get real Walmart stores for Waterloo area
        const walmartStores = await walmartAPI.searchStores('N2L 3G1'); // Waterloo postal code
        
        if (walmartStores && walmartStores.data && walmartStores.data.nearByNodes) {
            const realStores = [];
            for (const node of walmartStores.data.nearByNodes.nodes) {
                const storeProducts = await loadStoreProducts(node.id, 'walmart') || mockStores[0].products;
                realStores.push({
                    id: `walmart_${node.id}`,
                    name: node.displayName,
                    address: `${node.address.address1}, ${node.address.city}, ${node.address.state} ${node.address.postalCode}`,
                    phone: node.phone || 'N/A',
                    hours: node.operationalHours ? formatHours(node.operationalHours) : 'Hours vary',
                    lat: parseFloat(node.geoPoint.latitude),
                    lng: parseFloat(node.geoPoint.longitude),
                    type: 'walmart',
                    products: storeProducts
                });
            }
            
            // Combine real Walmart data with mock data for other stores
            groceryStores = [...realStores.slice(0, 2), ...mockStores.slice(1)];
            console.log('Loaded real Walmart store data:', realStores.length, 'stores');
        } else {
            throw new Error('No Walmart data available');
        }
    } catch (error) {
        console.warn('Using mock store data due to API limitations:', error.message);
        groceryStores = mockStores;
    }
}

// Load products for a specific store
async function loadStoreProducts(storeId, storeType) {
    const commonProducts = ['milk', 'bread', 'eggs', 'chicken breast', 'bananas', 'apples'];
    const products = {};
    
    try {
        if (storeType === 'walmart') {
            for (const product of commonProducts.slice(0, 3)) { // Limit API calls for demo
                const productData = await walmartAPI.searchProducts(product, storeId);
                if (productData && productData.data && productData.data.search) {
                    const items = productData.data.search.searchResult.itemStacks[0]?.itemsV2;
                    if (items && items.length > 0) {
                        const item = items[0];
                        products[product] = {
                            name: item.name,
                            brand: item.brand || 'Walmart',
                            price: item.priceInfo?.currentPrice?.price || 0
                        };
                    }
                }
                // Add delay to avoid rate limiting
                await new Promise(resolve => setTimeout(resolve, 100));
            }
        }
    } catch (error) {
        console.warn('Failed to load products for store:', storeId, error);
    }
    
    return Object.keys(products).length > 0 ? products : null;
}

// Format store hours from API response
function formatHours(operationalHours) {
    if (!operationalHours || !operationalHours.regularHours) {
        return 'Hours vary';
    }
    
    const hours = operationalHours.regularHours;
    if (hours.length === 0) return 'Hours vary';
    
    // Simplify to show general hours
    const firstDay = hours[0];
    return `${firstDay.openTime} - ${firstDay.closeTime}`;
}

// Walmart Canada API Integration
class WalmartCanadaAPI {
    constructor() {
        this.baseUrl = 'https://www.walmart.ca';
        this.headers = {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:139.0) Gecko/20100101 Firefox/139.0',
            'Accept': 'application/json',
            'Accept-Language': 'en-CA',
            'x-o-segment': 'oaoh',
            'x-o-platform': 'rweb',
            'x-o-bu': 'WALMART-CA',
            'x-o-mart': 'B2C',
            'Content-Type': 'application/json'
        };
    }

    async searchStores(postalCode) {
        const formattedPostalCode = postalCode.replace(' ', '%20');
        const url = `${this.baseUrl}/orchestra/graphql/nearByNodes/383d44ac5962240870e513c4f53bb3d05a143fd7b19acb32e8a83e39f1ed266c?variables=%7B%22input%22%3A%7B%22postalCode%22%3A%22${formattedPostalCode}%22%2C%22accessTypes%22%3A%5B%22PICKUP_INSTORE%22%2C%22PICKUP_CURBSIDE%22%5D%2C%22nodeTypes%22%3A%5B%22STORE%22%2C%22PICKUP_SPOKE%22%2C%22PICKUP_POPUP%22%5D%2C%22latitude%22%3Anull%2C%22longitude%22%3Anull%2C%22radius%22%3Anull%7D%2C%22checkItemAvailability%22%3Afalse%2C%22checkWeeklyReservation%22%3Afalse%2C%22enableStoreSelectorMarketplacePickup%22%3Afalse%2C%22enableVisionStoreSelector%22%3Afalse%2C%22enableStorePagesAndFinderPhase2%22%3Afalse%2C%22enableStoreBrandFormat%22%3Afalse%2C%22disableNodeAddressPostalCode%22%3Afalse%7D`;
        
        try {
            const response = await fetch(url, {
                method: 'GET',
                headers: this.headers,
                mode: 'cors'
            });
            
            if (response.ok) {
                return await response.json();
            }
        } catch (error) {
            console.warn('Walmart API failed, using fallback data:', error);
        }
        return null;
    }

    async searchProducts(query, storeId) {
        const searchUrl = `${this.baseUrl}/orchestra/snb/graphql/search?query=${encodeURIComponent(query)}&page=1&displayGuidedNav=true`;
        
        const searchHeaders = {
            ...this.headers,
            'deliveryCatchment': storeId,
            'defaultNearestStoreId': storeId
        };

        try {
            const response = await fetch(searchUrl, {
                method: 'GET',
                headers: searchHeaders,
                mode: 'cors'
            });
            
            if (response.ok) {
                return await response.json();
            }
        } catch (error) {
            console.warn('Walmart product search failed:', error);
        }
        return null;
    }
}

// Initialize Walmart API
const walmartAPI = new WalmartCanadaAPI();

// Fallback mock data for development/demo
const mockStores = [
    {
        id: 'walmart_waterloo',
        name: 'Walmart Supercentre (Waterloo)',
        address: '550 King St N, Waterloo, ON N2L 5W6',
        phone: '(519) 886-0460',
        hours: 'Mon-Sun: 7:00 AM - 11:00 PM',
        lat: 43.4851,
        lng: -80.5372,
        type: 'walmart',
        products: {
            'milk': { name: 'Great Value 2% Milk', brand: 'Great Value', price: 4.97 },
            'bread': { name: 'Wonder White Bread', brand: 'Wonder', price: 2.47 },
            'eggs': { name: 'Large White Eggs', brand: 'Great Value', price: 3.97 },
            'chicken breast': { name: 'Boneless Chicken Breast', brand: 'Fresh', price: 13.97 },
            'bananas': { name: 'Bananas', brand: 'Fresh', price: 1.68 },
            'apples': { name: 'Gala Apples', brand: 'Fresh', price: 4.47 }
        }
    },
    {
        id: 'superstore_waterloo',
        name: 'Real Canadian Superstore',
        address: '625 King St N, Waterloo, ON N2V 2B8',
        phone: '(519) 746-4321',
        hours: 'Mon-Sun: 8:00 AM - 10:00 PM',
        lat: 43.4892,
        lng: -80.5401,
        type: 'superstore',
        products: {
            'milk': { name: 'Beatrice 2% Milk', brand: 'Beatrice', price: 4.99 },
            'bread': { name: 'Country Harvest Whole Wheat', brand: 'Country Harvest', price: 2.99 },
            'eggs': { name: 'Free Range Large Eggs', brand: 'PC Free Range', price: 4.49 },
            'chicken breast': { name: 'PC Chicken Breast', brand: 'PC', price: 12.99 },
            'bananas': { name: 'Organic Bananas', brand: 'PC Organics', price: 1.99 },
            'rice': { name: 'PC Jasmine Rice', brand: 'PC', price: 5.99 }
        }
    },
    {
        id: 'metro_waterloo',
        name: 'Metro',
        address: '465 Phillip St, Waterloo, ON N2L 6C7',
        phone: '(519) 886-7370',
        hours: 'Mon-Sun: 8:00 AM - 10:00 PM',
        lat: 43.4643,
        lng: -80.5204,
        type: 'metro',
        products: {
            'milk': { name: 'Natrel 2% Milk', brand: 'Natrel', price: 5.29 },
            'bread': { name: 'Dempsters Whole Grain', brand: 'Dempsters', price: 2.79 },
            'eggs': { name: 'Grade A Large Eggs', brand: 'Metro', price: 3.79 },
            'bananas': { name: 'Fair Trade Bananas', brand: 'Metro', price: 2.29 },
            'apples': { name: 'Honeycrisp Apples', brand: 'Fresh', price: 4.99 },
            'rice': { name: 'Basmati Rice', brand: 'Tilda', price: 6.49 }
        }
    }
];

// Initialize the application
document.addEventListener('DOMContentLoaded', initializeApp);

// Initialize the map
function initializeMap() {
    // Default to Waterloo, ON coordinates
    const defaultLat = 43.4643;
    const defaultLng = -80.5204;
    
    map = L.map('map').setView([defaultLat, defaultLng], 13);
    
    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 18
    }).addTo(map);
    
    // Store loading will be handled by loadRealStoreData() in initializeApp()
}

// Setup event listeners
function setupEventListeners() {
    const searchBtn = document.getElementById('searchBtn');
    const productSearch = document.getElementById('productSearch');
    const locationBtn = document.getElementById('locationBtn');
    const centerMapBtn = document.getElementById('centerMapBtn');
    const closeModal = document.getElementById('closeModal');
    const addItemBtn = document.getElementById('addItemBtn');
    const groceryItem = document.getElementById('groceryItem');
    const optimizeBtn = document.getElementById('optimizeBtn');
    const toggleChat = document.getElementById('toggleChat');
    const sendChatBtn = document.getElementById('sendChatBtn');
    const chatInput = document.getElementById('chatInput');
    
    searchBtn.addEventListener('click', performSearch);
    productSearch.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            performSearch();
        }
    });
    
    locationBtn.addEventListener('click', getUserLocation);
    centerMapBtn.addEventListener('click', centerMapOnUser);
    closeModal.addEventListener('click', closeStoreModal);
    
    // Grocery list events
    addItemBtn.addEventListener('click', addGroceryItem);
    groceryItem.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            addGroceryItem();
        }
    });
    optimizeBtn.addEventListener('click', optimizeShoppingList);
    
    // Chatbot events
    toggleChat.addEventListener('click', toggleChatbot);
    sendChatBtn.addEventListener('click', sendChatMessage);
    chatInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            sendChatMessage();
        }
    });
    
    // Close modal when clicking outside
    document.getElementById('storeModal').addEventListener('click', function(e) {
        if (e.target === this) {
            closeStoreModal();
        }
    });
}

// Get user's current location
function getUserLocation() {
    const locationText = document.getElementById('locationText');
    locationText.textContent = 'Getting your location...';
    
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            function(position) {
                userLocation = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                };
                
                // Update location text
                locationText.textContent = `Location found (${userLocation.lat.toFixed(4)}, ${userLocation.lng.toFixed(4)})`;
                
                // Center map on user location
                map.setView([userLocation.lat, userLocation.lng], 14);
                
                // Add user location marker
                if (window.userMarker) {
                    map.removeLayer(window.userMarker);
                }
                
                window.userMarker = L.marker([userLocation.lat, userLocation.lng], {
                    icon: L.divIcon({
                        className: 'user-location-marker',
                        html: '<i class="fas fa-user" style="color: #4f46e5; font-size: 20px;"></i>',
                        iconSize: [30, 30],
                        iconAnchor: [15, 15]
                    })
                }).addTo(map).bindPopup('Your Location');
                
                // Recalculate distances
                updateStoreDistances();
            },
            function(error) {
                console.error('Geolocation error:', error);
                locationText.textContent = 'Location access denied - using default area';
            }
        );
    } else {
        locationText.textContent = 'Geolocation not supported - using default area';
    }
}

// Add store marker to map with icon
function addStoreMarker(store) {
    const marker = L.marker([store.lat, store.lng], {
        icon: L.divIcon({
            className: 'store-marker',
            html: '<i class="fas fa-store" style="color: #10b981; font-size: 18px;"></i>',
            iconSize: [25, 25],
            iconAnchor: [12, 12]
        })
    }).addTo(map);
    
    // Create popup content
    const popupContent = createStorePopupContent(store);
    marker.bindPopup(popupContent);
    
    // Store reference for later use
    store.marker = marker;
    
    // Add click event to show detailed modal
    marker.on('click', () => showStoreModal(store));
}

// Create store popup content
function createStorePopupContent(store) {
    return `
        <div class="store-popup">
            <h3>${store.name}</h3>
            <p><i class="fas fa-map-marker-alt"></i> ${store.address}</p>
            <p><i class="fas fa-phone"></i> ${store.phone}</p>
            <p><i class="fas fa-clock"></i> ${store.hours}</p>
            ${store.distance ? `<p><i class="fas fa-route"></i> ${store.distance} km away</p>` : ''}
            <div class="price-highlight">Click for detailed prices</div>
        </div>
    `;
}

// Calculate distance between two points
function calculateDistance(lat1, lng1, lat2, lng2) {
    const R = 6371; // Radius of the Earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}

// Update store distances from user location
function updateStoreDistances() {
    if (!userLocation) return;
    
    groceryStores.forEach(store => {
        store.distance = calculateDistance(
            userLocation.lat, userLocation.lng,
            store.lat, store.lng
        ).toFixed(1);
        
        // Update popup content
        const popupContent = createStorePopupContent(store);
        store.marker.setPopupContent(popupContent);
    });
}

// Perform product search
function performSearch() {
    const searchTerm = document.getElementById('productSearch').value.toLowerCase().trim();
    
    if (!searchTerm) {
        alert('Please enter a product to search for');
        return;
    }
    
    showLoadingSpinner();
    
    // Simulate API delay
    setTimeout(() => {
        const results = searchProducts(searchTerm);
        displaySearchResults(results, searchTerm);
        hideLoadingSpinner();
    }, 1000);
}

// Search for products across all stores
function searchProducts(searchTerm) {
    const results = [];
    
    groceryStores.forEach(store => {
        Object.keys(store.products).forEach(productKey => {
            if (productKey.includes(searchTerm) || 
                store.products[productKey].name.toLowerCase().includes(searchTerm)) {
                
                const product = store.products[productKey];
                results.push({
                    store: store,
                    product: product,
                    productKey: productKey
                });
            }
        });
    });
    
    // Sort by price (lowest first)
    results.sort((a, b) => a.product.price - b.product.price);
    
    return results;
}

// Display search results
function displaySearchResults(results, searchTerm) {
    const priceResults = document.getElementById('priceResults');
    const productList = document.getElementById('productList');
    
    if (results.length === 0) {
        priceResults.classList.remove('hidden');
        productList.innerHTML = `
            <div style="text-align: center; padding: 20px; color: #64748b;">
                <i class="fas fa-search" style="font-size: 2rem; margin-bottom: 10px;"></i>
                <p>No products found for "${searchTerm}"</p>
                <p style="font-size: 0.9rem; margin-top: 5px;">Try searching for: milk, bread, apples, bananas, eggs, or chicken</p>
            </div>
        `;
        return;
    }
    
    priceResults.classList.remove('hidden');
    
    let html = '';
    results.forEach(result => {
        const { store, product } = result;
        html += `
            <div class="product-item" onclick="highlightStore(${store.id})">
                <div class="product-header">
                    <span class="product-name">${product.name}</span>
                    <span class="product-price">$${product.price.toFixed(2)}</span>
                </div>
                <div class="store-info">
                    <span class="store-name">${store.name}</span>
                    ${store.distance ? `<span class="store-distance">${store.distance} km</span>` : ''}
                </div>
            </div>
        `;
    });
    
    productList.innerHTML = html;
    currentSearchResults = results;
}

// Highlight a specific store on the map
function highlightStore(storeId) {
    const store = groceryStores.find(s => s.id === storeId);
    if (store) {
        map.setView([store.lat, store.lng], 16);
        store.marker.openPopup();
        
        // Add a temporary highlight effect
        const originalIcon = store.marker.getIcon();
        store.marker.setIcon(L.divIcon({
            className: 'store-marker highlighted',
            html: '<i class="fas fa-store" style="color: #ef4444; font-size: 22px;"></i>',
            iconSize: [30, 30],
            iconAnchor: [15, 15]
        }));
        
        setTimeout(() => {
            store.marker.setIcon(originalIcon);
        }, 2000);
    }
}

// Show store details modal
function showStoreModal(store, highlightItems = []) {
    const modal = document.getElementById('storeModal');
    const title = document.getElementById('storeModalTitle');
    const details = document.getElementById('storeDetails');
    
    title.textContent = store.name;
    
    let html = `
        <div style="margin-bottom: 20px;">
            <p><strong><i class="fas fa-map-marker-alt"></i> Address:</strong> ${store.address}</p>
            <p><strong><i class="fas fa-phone"></i> Phone:</strong> ${store.phone}</p>
            <p><strong><i class="fas fa-clock"></i> Hours:</strong> ${store.hours}</p>
            ${store.distance ? `<p><strong><i class="fas fa-route"></i> Distance:</strong> ${store.distance} km</p>` : ''}
        </div>
    `;
    
    // Show grocery list items if available
    if (highlightItems.length > 0) {
        html += `
            <h4 style="margin-bottom: 15px; color: #1e293b;">Your Grocery List at ${store.name}:</h4>
            <div style="display: grid; gap: 10px; margin-bottom: 20px;">
        `;
        
        highlightItems.forEach(item => {
            if (item.available) {
                html += `
                    <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px; background: #dcfce7; border-radius: 8px; border-left: 4px solid #10b981;">
                        <div>
                            <strong>${item.product.name}</strong>
                            <br>
                            <small style="color: #64748b;">${item.product.brand} • ${item.quantity} ${item.unit}</small>
                        </div>
                        <span style="font-weight: 600; color: #10b981; font-size: 1.1rem;">$${item.totalPrice.toFixed(2)}</span>
                    </div>
                `;
            } else {
                html += `
                    <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px; background: #fef2f2; border-radius: 8px; border-left: 4px solid #ef4444;">
                        <div>
                            <strong>${item.name}</strong>
                            <br>
                            <small style="color: #64748b;">${item.quantity} ${item.unit}</small>
                        </div>
                        <span style="font-weight: 600; color: #64748b; font-size: 0.9rem;">Information unavailable</span>
                    </div>
                `;
            }
        });
        
        html += '</div>';
    }
    
    html += `
        <h4 style="margin-bottom: 15px; color: #1e293b;">All Available Products:</h4>
        <div style="display: grid; gap: 10px;">
    `;
    
    Object.values(store.products).forEach(product => {
        const isHighlighted = highlightItems.some(item => item.available && item.product.name === product.name);
        html += `
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px; background: ${isHighlighted ? '#e0f2fe' : '#f8fafc'}; border-radius: 8px; ${isHighlighted ? 'border-left: 3px solid #0ea5e9;' : ''}">
                <div>
                    <strong>${product.name}</strong>
                    <br>
                    <small style="color: #64748b;">${product.brand}</small>
                </div>
                <span style="font-weight: 600; color: #10b981; font-size: 1.1rem;">$${product.price.toFixed(2)}</span>
            </div>
        `;
    });
    
    html += '</div>';
    details.innerHTML = html;
    modal.classList.remove('hidden');
}

// View store details with grocery list context
function viewStoreDetails(storeId) {
    const store = groceryStores.find(s => s.id === storeId);
    if (!store) return;
    
    // Highlight store on map
    highlightStore(storeId);
    
    // Prepare grocery list items for this store
    const storeItems = [];
    groceryList.forEach(groceryItem => {
        const storeProduct = findMatchingProduct(store, groceryItem.name);
        if (storeProduct) {
            storeItems.push({
                name: groceryItem.name,
                quantity: groceryItem.quantity,
                unit: groceryItem.unit,
                product: storeProduct,
                totalPrice: storeProduct.price * groceryItem.quantity,
                available: true
            });
        } else {
            storeItems.push({
                name: groceryItem.name,
                quantity: groceryItem.quantity,
                unit: groceryItem.unit,
                available: false
            });
        }
    });
    
    // Show modal with grocery list context
    showStoreModal(store, storeItems);
}

// Close store modal
function closeStoreModal() {
    document.getElementById('storeModal').classList.add('hidden');
}

// Center map on user location
function centerMapOnUser() {
    if (userLocation) {
        map.setView([userLocation.lat, userLocation.lng], 14);
        if (window.userMarker) {
            window.userMarker.openPopup();
        }
    } else {
        alert('Location not available. Please allow location access first.');
    }
}

// Show loading spinner
function showLoadingSpinner() {
    document.getElementById('loadingSpinner').classList.remove('hidden');
}

// Hide loading spinner
function hideLoadingSpinner() {
    document.getElementById('loadingSpinner').classList.add('hidden');
}

// Grocery List Management Functions
function addGroceryItem() {
    const input = document.getElementById('groceryItem');
    const itemName = input.value.trim().toLowerCase();
    
    if (!itemName) {
        return;
    }
    
    // Check if item already exists
    if (groceryList.some(item => item.name === itemName)) {
        input.value = '';
        return;
    }
    
    // Get typical quantity for the item
    getTypicalQuantity(itemName).then(quantity => {
        const groceryItem = {
            id: Date.now(),
            name: itemName,
            quantity: quantity.quantity,
            unit: quantity.unit,
            description: quantity.description
        };
        
        groceryList.push(groceryItem);
        updateGroceryListDisplay();
        input.value = '';
        
        // Show optimize button if list has items
        if (groceryList.length > 0) {
            document.getElementById('optimizeBtn').classList.remove('hidden');
        }
    });
}

function removeGroceryItem(itemId) {
    const itemIndex = groceryList.findIndex(item => item.id === itemId);
    if (itemIndex > -1) {
        groceryList.splice(itemIndex, 1);
        updateGroceryListDisplay();
        
        // Hide optimize button if list is empty
        if (groceryList.length === 0) {
            document.getElementById('optimizeBtn').classList.add('hidden');
            document.getElementById('shoppingRecommendations').classList.add('hidden');
        }
    }
}

function updateGroceryListDisplay() {
    const container = document.getElementById('groceryList');
    
    if (groceryList.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #64748b; padding: 20px;">Your grocery list is empty. Add some items above!</p>';
        return;
    }
    
    let html = '';
    groceryList.forEach(item => {
        html += `
            <div class="grocery-item">
                <div>
                    <span class="grocery-item-name">${item.name}</span>
                    <span class="grocery-item-quantity">(${item.description})</span>
                </div>
                <button class="remove-item-btn" onclick="removeGroceryItem(${item.id})">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

// Get typical quantity using Gemini API or fallback data
async function getTypicalQuantity(itemName) {
    // First check our fallback data
    if (typicalQuantities[itemName]) {
        return typicalQuantities[itemName];
    }
    
    // Try to use Gemini API if key is provided
    if (GEMINI_API_KEY && GEMINI_API_KEY.startsWith('AIzaSy')) {
        try {
            const response = await callGeminiAPI(
                `What is the typical quantity that an average family of 4 would buy for "${itemName}" during a weekly grocery shopping trip? Please respond in this exact format: "quantity|unit|description" (e.g., "2|lbs|2 pound bag" or "1|box|1 box"). Only respond with this format, no other text.`
            );
            
            const parts = response.split('|');
            if (parts.length === 3) {
                return {
                    quantity: parseFloat(parts[0]) || 1,
                    unit: parts[1].trim(),
                    description: parts[2].trim()
                };
            }
        } catch (error) {
            console.error('Gemini API error:', error);
        }
    }
    
    // Default fallback
    return { quantity: 1, unit: 'item', description: '1 item' };
}

// Shopping Optimization Functions
async function optimizeShoppingList() {
    if (groceryList.length === 0) {
        return;
    }
    
    showLoadingSpinner();
    
    try {
        const recommendations = await calculateOptimalShopping();
        displayShoppingRecommendations(recommendations);
        
    } catch (error) {
        console.error('Optimization error:', error);
    } finally {
        hideLoadingSpinner();
    }
}

async function calculateOptimalShopping() {
    const storeRecommendations = [];
    
    for (const store of groceryStores) {
        let totalCost = 0;
        let availableItems = [];
        let missingItems = [];
        
        for (const groceryItem of groceryList) {
            const storeProduct = findMatchingProduct(store, groceryItem.name);
            
            if (storeProduct) {
                const itemCost = storeProduct.price * groceryItem.quantity;
                totalCost += itemCost;
                availableItems.push({
                    name: groceryItem.name,
                    quantity: groceryItem.quantity,
                    unit: groceryItem.unit,
                    unitPrice: storeProduct.price,
                    totalPrice: itemCost,
                    product: storeProduct
                });
            } else {
                missingItems.push({
                    name: groceryItem.name,
                    quantity: groceryItem.quantity,
                    unit: groceryItem.unit
                });
            }
        }
        
        storeRecommendations.push({
            store: store,
            totalCost: totalCost,
            availableItems: availableItems,
            missingItems: missingItems,
            completeness: (availableItems.length / groceryList.length) * 100
        });
    }
    
    // Sort by total cost (lowest first), then by completeness (highest first)
    storeRecommendations.sort((a, b) => {
        if (a.completeness !== b.completeness) {
            return b.completeness - a.completeness;
        }
        return a.totalCost - b.totalCost;
    });
    
    return storeRecommendations;
}

function findMatchingProduct(store, itemName) {
    // Direct match
    if (store.products[itemName]) {
        return store.products[itemName];
    }
    
    // Fuzzy matching for similar items
    const productKeys = Object.keys(store.products);
    for (const key of productKeys) {
        if (key.includes(itemName) || itemName.includes(key)) {
            return store.products[key];
        }
    }
    
    return null;
}

function displayShoppingRecommendations(recommendations) {
    const recommendationsDiv = document.getElementById('shoppingRecommendations');
    const recommendationsList = document.getElementById('recommendationsList');
    
    recommendationsList.innerHTML = '';
    
    recommendations.forEach((rec, index) => {
        const card = document.createElement('div');
        card.className = 'recommendation-card';
        if (index === 0) card.classList.add('best-option');
        
        const availableItems = rec.availableItems || [];
        const unavailableItems = rec.unavailableItems || [];
        const totalItems = availableItems.length + unavailableItems.length;
        
        card.innerHTML = `
            <div class="store-header">
                <h4>${rec.store.name}</h4>
                <div class="store-stats">
                    <span class="completeness">${availableItems.length}/${totalItems} items available</span>
                    <span class="total-cost">Total: $${rec.totalCost.toFixed(2)}</span>
                </div>
            </div>
            <div class="items-breakdown">
                ${availableItems.length > 0 ? `
                    <div class="available-items">
                        <strong>Available:</strong> ${availableItems.map(item => `${item.name} ($${item.totalPrice.toFixed(2)})`).join(', ')}
                    </div>
                ` : ''}
                ${rec.missingItems.length > 0 ? `
                    <div class="unavailable-items">
                        <strong>Not available:</strong> ${rec.missingItems.map(item => item.name).join(', ')}
                    </div>
                ` : ''}
            </div>
            <button class="view-store-btn" onclick="openStoreModal('${rec.store.id}')">
                <i class="fas fa-store"></i> View Store Details
            </button>
        `;
        
        recommendationsList.appendChild(card);
    });
    
    recommendationsDiv.style.display = 'block';
    
    // Setup expand toggle functionality
    setupExpandToggle();
}

function setupExpandToggle() {
    const expandToggle = document.getElementById('expandToggle');
    const recommendationsDiv = document.getElementById('shoppingRecommendations');
    
    expandToggle.onclick = function() {
        const isExpanded = recommendationsDiv.classList.contains('expanded');
        
        if (isExpanded) {
            recommendationsDiv.classList.remove('expanded');
            expandToggle.innerHTML = '<i class="fas fa-expand-arrows-alt"></i> Expand';
        } else {
            recommendationsDiv.classList.add('expanded');
            expandToggle.innerHTML = '<i class="fas fa-compress-arrows-alt"></i> Collapse';
        }
    };
}

// Chatbot Functions
function initializeChatbot() {
    // Chatbot is already initialized with welcome message in HTML
}

function toggleChatbot() {
    const chatbot = document.getElementById('chatbot');
    const toggleBtn = document.getElementById('toggleChat');
    const icon = toggleBtn.querySelector('i');
    
    chatbotMinimized = !chatbotMinimized;
    
    if (chatbotMinimized) {
        chatbot.classList.add('minimized');
        icon.className = 'fas fa-chevron-up';
    } else {
        chatbot.classList.remove('minimized');
        icon.className = 'fas fa-chevron-down';
    }
}

async function sendChatMessage() {
    const input = document.getElementById('chatInput');
    const message = input.value.trim();
    
    if (!message) return;
    
    // Add user message
    addChatMessage('user', message);
    input.value = '';
    
    // Generate bot response
    try {
        const response = await generateChatResponse(message);
        addChatMessage('bot', response);
    } catch (error) {
        console.error('Chat error:', error);
        addChatMessage('bot', 'Sorry, I\'m having trouble responding right now. Please try asking about grocery prices, store locations, or shopping tips!');
    }
}

function addChatMessage(sender, message) {
    const messagesContainer = document.getElementById('chatMessages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `chat-message ${sender}-message`;
    
    const icon = sender === 'bot' ? '<i class="fas fa-robot"></i>' : '<i class="fas fa-user"></i>';
    messageDiv.innerHTML = `
        ${icon}
        <p>${message}</p>
    `;
    
    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

async function generateChatResponse(userMessage) {
    const lowerMessage = userMessage.toLowerCase();
    
    // Try Gemini API with comprehensive context
    if (GEMINI_API_KEY && GEMINI_API_KEY.startsWith('AIzaSy')) {
        try {
            // Build comprehensive store and product information
            const storeDetails = groceryStores.map(store => {
                const productList = Object.entries(store.products).map(([key, product]) => 
                    `${product.name} (${product.brand}) - $${product.price.toFixed(2)}`
                ).join('; ');
                
                return `${store.name}:
                - Address: ${store.address}
                - Phone: ${store.phone}
                - Hours: ${store.hours}
                ${store.distance ? `- Distance: ${store.distance} km away` : ''}
                - Products: ${productList}`;
            }).join('\n\n');
            
            const groceryListDetails = groceryList.length > 0 
                ? groceryList.map(item => `${item.name} (${item.description})`).join(', ')
                : 'No items in grocery list yet';
            
            const prompt = `You are GroceryMap's AI shopping assistant. Your role is to help users with grocery shopping, price comparisons, and store recommendations using the specific data provided below.

IMPORTANT GUIDELINES:
- ONLY answer questions related to grocery shopping, food, stores, prices, or shopping tips
- If asked about non-grocery topics, politely redirect: "I'm focused on helping with grocery shopping. Ask me about store prices, product availability, or shopping tips!", but that can be reworded
- Use the specific store and product data below to give accurate, helpful answers
- Keep responses concise and practical
- Do NOT recommend specific stores for entire shopping lists (that's handled by the optimization feature)

CURRENT DATA:

User's Grocery List: ${groceryListDetails}

Nearby Stores and Products:
${storeDetails}

User Question: "${userMessage}"

Provide a helpful, accurate response using the store and product data above. Focus on answering their specific question about groceries, prices, or stores.`;
            
            return await callGeminiAPI(prompt);
        } catch (error) {
            console.error('Gemini API error:', error);
            return 'Sorry, I\'m having trouble connecting to my AI service right now. Please try again in a moment!';
        }
    }
    
    return 'Please configure your Gemini API key to enable AI responses. Check the SETUP.md file for instructions.';
}

// Gemini API Integration
async function callGeminiAPI(prompt) {
    if (!GEMINI_API_KEY || !GEMINI_API_KEY.startsWith('AIzaSy')) {
        throw new Error('Gemini API key not configured');
    }
    
    console.log('Calling Gemini API with key:', GEMINI_API_KEY.substring(0, 10) + '...');
    
    try {
        const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: prompt
                    }]
                }],
                generationConfig: {
                    temperature: 0.7,
                    topK: 40,
                    topP: 0.95,
                    maxOutputTokens: 200
                }
            })
        });
        
        console.log('Gemini API response status:', response.status);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Gemini API error response:', errorText);
            throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
        }
        
        const data = await response.json();
        console.log('Gemini API success:', data);
        
        if (data.candidates && data.candidates[0] && data.candidates[0].content) {
            return data.candidates[0].content.parts[0].text;
        } else {
            throw new Error('Invalid response format from Gemini API');
        }
    } catch (error) {
        console.error('Gemini API call failed:', error);
        throw error;
    }
}

// Update the existing highlightStore function to work with new modal
function highlightStore(storeId) {
    const store = groceryStores.find(s => s.id === storeId);
    if (store) {
        map.setView([store.lat, store.lng], 16);
        store.marker.openPopup();
        
        // Add a temporary highlight effect
        const originalIcon = store.marker.getIcon();
        store.marker.setIcon(L.divIcon({
            className: 'store-marker highlighted',
            html: '<i class="fas fa-store" style="color: #ef4444; font-size: 22px;"></i>',
            iconSize: [30, 30],
            iconAnchor: [15, 15]
        }));
        
        setTimeout(() => {
            store.marker.setIcon(originalIcon);
        }, 2000);
    }
}

// Close recommendations panel
function closeRecommendations() {
    const container = document.getElementById('shoppingRecommendations');
    container.classList.add('hidden');
    container.classList.remove('draggable');
}

// Make recommendations panel draggable
function makeDraggable() {
    const container = document.getElementById('shoppingRecommendations');
    const header = container.querySelector('.recommendations-header');
    
    if (!header) return;
    
    let isDragging = false;
    let currentX;
    let currentY;
    let initialX;
    let initialY;
    let xOffset = 0;
    let yOffset = 0;
    
    // Add draggable class and initial position
    container.classList.add('draggable');
    
    // Set initial position (center-right of screen)
    const rect = container.getBoundingClientRect();
    const initialLeft = window.innerWidth - rect.width - 50;
    const initialTop = 100;
    
    container.style.left = initialLeft + 'px';
    container.style.top = initialTop + 'px';
    
    xOffset = initialLeft;
    yOffset = initialTop;
    
    function dragStart(e) {
        if (e.type === "touchstart") {
            initialX = e.touches[0].clientX - xOffset;
            initialY = e.touches[0].clientY - yOffset;
        } else {
            initialX = e.clientX - xOffset;
            initialY = e.clientY - yOffset;
        }
        
        if (e.target === header || header.contains(e.target)) {
            isDragging = true;
            container.style.transition = 'none';
        }
    }
    
    function dragEnd(e) {
        initialX = currentX;
        initialY = currentY;
        isDragging = false;
        container.style.transition = 'all 0.3s ease';
        
        // Keep within screen bounds
        const rect = container.getBoundingClientRect();
        let newX = xOffset;
        let newY = yOffset;
        
        if (newX < 0) newX = 0;
        if (newY < 0) newY = 0;
        if (newX + rect.width > window.innerWidth) newX = window.innerWidth - rect.width;
        if (newY + rect.height > window.innerHeight) newY = window.innerHeight - rect.height;
        
        if (newX !== xOffset || newY !== yOffset) {
            xOffset = newX;
            yOffset = newY;
            container.style.left = newX + 'px';
            container.style.top = newY + 'px';
        }
    }
    
    function drag(e) {
        if (isDragging) {
            e.preventDefault();
            
            if (e.type === "touchmove") {
                currentX = e.touches[0].clientX - initialX;
                currentY = e.touches[0].clientY - initialY;
            } else {
                currentX = e.clientX - initialX;
                currentY = e.clientY - initialY;
            }
            
            xOffset = currentX;
            yOffset = currentY;
            
            container.style.left = currentX + 'px';
            container.style.top = currentY + 'px';
        }
    }
    
    // Mouse events
    header.addEventListener('mousedown', dragStart);
    document.addEventListener('mousemove', drag);
    document.addEventListener('mouseup', dragEnd);
    
    // Touch events for mobile
    header.addEventListener('touchstart', dragStart, { passive: false });
    document.addEventListener('touchmove', drag, { passive: false });
    document.addEventListener('touchend', dragEnd);
    
    // Prevent text selection while dragging
    header.addEventListener('selectstart', (e) => e.preventDefault());
}

// Add some custom CSS for highlighted markers
const style = document.createElement('style');
style.textContent = `
    .store-marker.highlighted {
        animation: pulse 1s ease-in-out infinite;
    }
    
    @keyframes pulse {
        0% { transform: scale(1); }
        50% { transform: scale(1.2); }
        100% { transform: scale(1); }
    }
    
    .user-location-marker {
        background: rgba(79, 70, 229, 0.2);
        border: 2px solid #4f46e5;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
    }
`;
document.head.appendChild(style);
