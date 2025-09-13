// Global variables
let map;
let userLocation = null;
let groceryStores = [];
let currentSearchResults = [];

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
document.addEventListener('DOMContentLoaded', function() {
    initializeMap();
    setupEventListeners();
    getUserLocation();
});

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
    
    // Load grocery stores
    loadGroceryStores();
}

// Setup event listeners
function setupEventListeners() {
    const searchBtn = document.getElementById('searchBtn');
    const productSearch = document.getElementById('productSearch');
    const locationBtn = document.getElementById('locationBtn');
    const centerMapBtn = document.getElementById('centerMapBtn');
    const closeModal = document.getElementById('closeModal');
    
    searchBtn.addEventListener('click', performSearch);
    productSearch.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            performSearch();
        }
    });
    
    locationBtn.addEventListener('click', getUserLocation);
    centerMapBtn.addEventListener('click', centerMapOnUser);
    closeModal.addEventListener('click', closeStoreModal);
    
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

// Load grocery stores onto the map
function loadGroceryStores() {
    groceryStores = sampleGroceryData.stores;
    
    groceryStores.forEach(store => {
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
    });
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
function showStoreModal(store) {
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
        
        <h4 style="margin-bottom: 15px; color: #1e293b;">Available Products:</h4>
        <div style="display: grid; gap: 10px;">
    `;
    
    Object.values(store.products).forEach(product => {
        html += `
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px; background: #f8fafc; border-radius: 8px;">
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
