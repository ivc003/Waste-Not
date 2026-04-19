// Mapbox configuration and initialization
console.log('Map.js script loaded');

// Fuzzy matching functions
// Calculate Levenshtein distance between two strings
function levenshteinDistance(str1, str2) {
  const len1 = str1.length;
  const len2 = str2.length;
  const matrix = Array(len2 + 1).fill(null).map(() => Array(len1 + 1).fill(0));

  for (let i = 0; i <= len1; i++) {
    matrix[0][i] = i;
  }

  for (let j = 0; j <= len2; j++) {
    matrix[j][0] = j;
  }

  for (let j = 1; j <= len2; j++) {
    for (let i = 1; i <= len1; i++) {
      const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1,
        matrix[j - 1][i] + 1,
        matrix[j - 1][i - 1] + indicator
      );
    }
  }

  return matrix[len2][len1];
}

// Check if two strings are similar enough (fuzzy match)
// Returns true if match is good enough, false otherwise
function isFuzzyMatch(input, target, threshold = 0.7) {
  const input_lower = input.toLowerCase().trim();
  const target_lower = target.toLowerCase().trim();

  // Exact match
  if (input_lower === target_lower) {
    return true;
  }

  // Substring match (e.g., "chicken" matches "chicken breast")
  if (target_lower.includes(input_lower) || input_lower.includes(target_lower)) {
    return true;
  }

  // Fuzzy match using Levenshtein distance
  const maxLen = Math.max(input_lower.length, target_lower.length);
  const distance = levenshteinDistance(input_lower, target_lower);
  const similarity = 1 - (distance / maxLen);

  return similarity >= threshold;
}

// Check that Mapbox GL JS is loaded
console.log('Mapbox GL JS Loaded:', typeof mapboxgl !== 'undefined' ? 'Yes' : 'No');
console.log('Turf loaded:', typeof turf !== 'undefined' ? 'Yes' : 'No');

// Set your Mapbox access token here
mapboxgl.accessToken = 'pk.eyJ1IjoidmFsYXUiLCJhIjoiY21vNTlvenR0MWVlejJwcHNyaDQyMWk1dyJ9._Z2m36NY-HnfdP_mGii0Sg';

// Log for debugging
console.log('Page hostname:', window.location.hostname);
console.log('Page protocol:', window.location.protocol);
console.log('Full URL:', window.location.href);
console.log('Mapbox Token Set:', mapboxgl.accessToken ? 'Yes' : 'No');

// Fixed restaurant coordinates at real grocery store areas in Washington DC
const restaurants = {
  'restaurant-x': [-77.0369, 38.8977], // Near Whole Foods Market - Downtown DC / Chinatown
  'restaurant-y': [-77.0648, 38.9076], // Near Giant Food - Upper NW / Woodley Park area
  'restaurant-z': [-77.0248, 38.8947]  // Near Safeway - Capitol Hill / Navy Yard area
};

console.log('Restaurant Coordinates:', restaurants);

// Store markers management
let storeMarkers = [];
let filteredStores = [];

// Function to check if a point is within a radius
function isPointInRadius(point, center, radiusMiles) {
  const from = turf.point(center);
  const to = turf.point(point);
  const distance = turf.distance(from, to, { units: 'miles' });
  return distance <= radiusMiles;
}

// Function to filter stores by radius
function filterStoresByRadius(radiusMiles, centerCoords) {
  if (!window.allStores) {
    console.warn('allStores data not loaded yet');
    return [];
  }
  
  return window.allStores.filter(store => {
    return isPointInRadius([store.longitude, store.latitude], centerCoords, radiusMiles);
  });
}

// Function to filter stores by shopping list products
function filterStoresByShoppingList(stores) {
  const shoppingList = JSON.parse(localStorage.getItem('shoppingList') || '[]');
  
  // If shopping list is empty, return all stores
  if (shoppingList.length === 0) {
    return stores;
  }
  
  // Filter stores that have at least one product from the shopping list using fuzzy matching
  return stores.filter(store => {
    return shoppingList.some(product =>
      store.products.some(storeProduct =>
        isFuzzyMatch(product, storeProduct)
      )
    );
  });
}

// Function to create a circle GeoJSON from center point and radius
function createCircleGeoJSON(centerLngLat, radiusMiles) {
  const radiusMeters = radiusMiles * 1609.34; // Convert miles to meters
  const center = turf.point(centerLngLat);
  const circleFeature = turf.circle(center, radiusMeters / 1000, { units: 'kilometers' });
  return circleFeature;
}

// Wait for DOM to be fully loaded before initializing map
function initMap() {
  try {
    const mapContainer = document.getElementById('map');
    
    if (!mapContainer) {
      console.error('❌ Map container not found!');
      console.error('Looking for element with id="map"');
      return;
    }
    
    console.log('✅ Map container found');
    console.log('Container dimensions:', mapContainer.offsetWidth, 'x', mapContainer.offsetHeight);
    
    // Initialize the map
    const map = new mapboxgl.Map({
      container: 'map', // ID of the div where the map will render
      style: 'mapbox://styles/mapbox/streets-v12', // Map style
      center: [-77.0369, 38.9072], // [longitude, latitude] - Washington DC
      zoom: 12, // Initial zoom level
      minZoom: 5, // Minimum allowed zoom
      maxZoom: 18, // Maximum allowed zoom
      attributionControl: true,
      customAttribution: 'Map data © Mapbox',
      failIfMajorPerformanceCaveat: false // Allow map to load even with performance issues
    });
    
    // Log map events for debugging
    map.on('load', () => {
      console.log('✅ Map loaded successfully!');
      console.log('Map center:', map.getCenter());
      console.log('Map zoom:', map.getZoom());

      // Food desert overlay — USDA low income + low access census tracts (DC)
      const foodDesertData = {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            properties: { name: 'Ward 8 — Anacostia / Congress Heights' },
            geometry: { type: 'Polygon', coordinates: [[
              [-77.020, 38.826], [-76.944, 38.826], [-76.944, 38.872], [-77.020, 38.872], [-77.020, 38.826]
            ]]}
          },
          {
            type: 'Feature',
            properties: { name: 'Ward 7 — Deanwood / Benning Heights' },
            geometry: { type: 'Polygon', coordinates: [[
              [-76.950, 38.870], [-76.884, 38.870], [-76.884, 38.920], [-76.950, 38.920], [-76.950, 38.870]
            ]]}
          },
          {
            type: 'Feature',
            properties: { name: 'Ward 5 — Trinidad / Ivy City' },
            geometry: { type: 'Polygon', coordinates: [[
              [-76.999, 38.893], [-76.960, 38.893], [-76.960, 38.918], [-76.999, 38.918], [-76.999, 38.893]
            ]]}
          }
        ]
      };

      map.addSource('food-deserts', { type: 'geojson', data: foodDesertData });

      map.addLayer({
        id: 'food-deserts-fill',
        type: 'fill',
        source: 'food-deserts',
        paint: { 'fill-color': '#d62728', 'fill-opacity': 0.18 }
      });

      map.addLayer({
        id: 'food-deserts-outline',
        type: 'line',
        source: 'food-deserts',
        paint: { 'line-color': '#d62728', 'line-width': 1.5, 'line-opacity': 0.5 }
      });

      const tooltip = new mapboxgl.Popup({ closeButton: false, closeOnClick: false });
      map.on('mouseenter', 'food-deserts-fill', (e) => {
        map.getCanvas().style.cursor = 'pointer';
        tooltip.setLngLat(e.lngLat)
          .setHTML(`<strong>${e.features[0].properties.name}</strong><br>Food desert — low income &amp; low grocery access`)
          .addTo(map);
      });
      map.on('mouseleave', 'food-deserts-fill', () => {
        map.getCanvas().style.cursor = '';
        tooltip.remove();
      });

      // Legend
      const legend = document.createElement('div');
      legend.id = 'food-desert-legend';
      legend.style.cssText = `
        position: absolute; bottom: 36px; right: 10px;
        background: rgba(255,255,255,0.92); padding: 8px 12px;
        border-radius: 6px; font-size: 12px; line-height: 1.6;
        box-shadow: 0 1px 4px rgba(0,0,0,0.2); pointer-events: none; z-index: 10;
      `;
      legend.innerHTML = `
        <div style="display:flex;align-items:center;gap:8px">
          <div style="width:14px;height:14px;background:#d62728;opacity:0.5;border-radius:2px;flex-shrink:0"></div>
          <span>Food desert (low income + low access)</span>
        </div>
      `;
      document.getElementById('map').appendChild(legend);
    });
    
    map.on('error', (e) => {
      console.error('❌ Map error:', e);
      console.error('Error message:', e.message);
      console.error('Error object:', e);
    });
    
    map.on('style.load', () => {
      console.log('✅ Map style loaded');
    });
    
    // Optional: Add zoom and rotation controls
    map.addControl(new mapboxgl.NavigationControl());
    console.log('✅ Navigation control added');

    // Add all grocery store markers on initial load
    if (window.allStores && window.allStores.length > 0) {
      console.log('Adding store markers to map. Total stores:', window.allStores.length);
      
      window.allStores.forEach((store, index) => {
        // Create a red pin marker element
        const markerElement = document.createElement('div');
        markerElement.className = 'store-marker';
        markerElement.style.width = '32px';
        markerElement.style.height = '32px';
        markerElement.style.backgroundImage = `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23ff0000" stroke="white" stroke-width="2"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" /><circle cx="12" cy="9" r="2" fill="white"/></svg>')`;
        markerElement.style.backgroundSize = 'contain';
        markerElement.style.backgroundRepeat = 'no-repeat';
        markerElement.style.backgroundPosition = 'center';
        markerElement.style.cursor = 'pointer';
        
        // Create a popup for the store marker
        const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(
          `<strong>${store.storeName}</strong><br/>${store.storeAddress}<br/><small>${store.uniqueProducts} products</small>`
        );
        
        // Create and add the marker
        const marker = new mapboxgl.Marker(markerElement)
          .setLngLat([store.longitude, store.latitude])
          .setPopup(popup)
          .addTo(map);
        
        storeMarkers.push({
          marker: marker,
          store: store,
          element: markerElement
        });
      });
      
      console.log('✅ All store markers added to map');
      
      // Initialize filtered stores list
      filteredStores = [...window.allStores];
    } else {
      console.warn('No stores data available');
    }

    // Create markers for each restaurant (but don't add to map yet)
    const markers = {};

    Object.entries(restaurants).forEach(([restaurantId, coords]) => {
      // Create a custom marker element
      const markerElement = document.createElement('div');
      markerElement.className = 'restaurant-marker';
      markerElement.style.width = '40px';
      markerElement.style.height = '40px';
      markerElement.style.backgroundImage = `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%232b7821" stroke="white" stroke-width="2"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" /><circle cx="12" cy="9" r="2.5" fill="white"/></svg>')`;
      markerElement.style.backgroundSize = 'contain';
      markerElement.style.backgroundRepeat = 'no-repeat';
      markerElement.style.backgroundPosition = 'center';
      
      // Create a popup for the marker
      const popup = new mapboxgl.Popup({ offset: 25 }).setText(
        restaurantId.replace('-', ' ').toUpperCase()
      );
      
      // Create the marker (but don't add to map yet)
      const marker = new mapboxgl.Marker(markerElement)
        .setLngLat(coords)
        .setPopup(popup);
      
      markers[restaurantId] = marker;
    });

    // Keep track of currently selected restaurant
    let currentSelectedRestaurant = null;

    // Function to update the radius circle
    function updateRadiusCircle(restaurantCoords, radiusMiles) {
      // Remove existing circle source and layer if they exist
      if (map.getSource('radius-circle')) {
        map.removeLayer('radius-circle-fill');
        map.removeLayer('radius-circle-stroke');
        map.removeSource('radius-circle');
      }
      
      // Create a proper circle using turf.js
      const circleFeature = createCircleGeoJSON(restaurantCoords, radiusMiles);
      
      // Add the circle source
      map.addSource('radius-circle', {
        type: 'geojson',
        data: circleFeature
      });
      
      // Add circle fill layer
      map.addLayer({
        id: 'radius-circle-fill',
        type: 'fill',
        source: 'radius-circle',
        paint: {
          'fill-color': '#ff0000',
          'fill-opacity': 0.2
        }
      });
      
      // Add circle stroke layer
      map.addLayer({
        id: 'radius-circle-stroke',
        type: 'line',
        source: 'radius-circle',
        paint: {
          'line-color': '#ff0000',
          'line-width': 2,
          'line-opacity': 0.8
        }
      });
    }

    // Handle location dropdown changes
    const locationDropdown = document.getElementById('floatingLocationSelect');
    const radiusSlider = document.getElementById('floatingRadiusSlider');

    if (locationDropdown) {
      locationDropdown.addEventListener('change', (e) => {
        const selectedLocation = e.target.value;
        
        // Remove previous marker if one was selected
        if (currentSelectedRestaurant && markers[currentSelectedRestaurant]) {
          markers[currentSelectedRestaurant].remove();
        }
        
        if (selectedLocation && restaurants[selectedLocation]) {
          const coords = restaurants[selectedLocation];
          
          // Add the marker for the selected restaurant
          markers[selectedLocation].addTo(map);
          currentSelectedRestaurant = selectedLocation;
          
          // Draw the radius circle with current slider value
          const radiusValue = parseInt(radiusSlider.value);
          updateRadiusCircle(coords, radiusValue);
          
          // Filter stores by radius
          filteredStores = filterStoresByRadius(radiusValue, coords);
          // Apply shopping list filter
          filteredStores = filterStoresByShoppingList(filteredStores);
          console.log('Filtered stores by radius:', filteredStores.length);
          
          // Update store markers visibility
          updateStoreMarkersVisibility(filteredStores);
          
          // Update stores list in side menu
          updateStoresListDisplay(filteredStores);
          
          // Calculate offset for side menu and floating bar
          // Side menu is 250px wide, floating bar is ~80px tall
          const sideMenuWidth = 250;
          const floatingBarHeight = 80;
          
          // Get map container dimensions
          const mapContainer = document.getElementById('map');
          const mapWidth = mapContainer.clientWidth;
          const mapHeight = mapContainer.clientHeight;
          
          // Calculate the offset in pixels (center adjusted to account for side menu)
          const offsetX = (mapWidth - sideMenuWidth) / 2 + sideMenuWidth / 2;
          const offsetY = (mapHeight - floatingBarHeight) / 2 + floatingBarHeight / 2;
          
          // Convert pixel offset to map coordinates using unproject
          const point = new mapboxgl.Point(offsetX, offsetY);
          const offsetCoords = map.unproject(point);
          
          // Animate to the selected location with smooth transition
          map.flyTo({
            center: coords,
            zoom: 14,
            duration: 2000, // 2 second animation
            offset: [sideMenuWidth / 2, floatingBarHeight / 2]
          });
        } else {
          currentSelectedRestaurant = null;
          // Remove circle if no restaurant is selected
          if (map.getSource('radius-circle')) {
            map.removeLayer('radius-circle-fill');
            map.removeLayer('radius-circle-stroke');
            map.removeSource('radius-circle');
          }
          
          // Show all stores again, but apply shopping list filter
          filteredStores = [...window.allStores];
          filteredStores = filterStoresByShoppingList(filteredStores);
          updateStoreMarkersVisibility(filteredStores);
          updateStoresListDisplay(filteredStores);
        }
      });
    }

    // Handle radius slider changes
    if (radiusSlider) {
      radiusSlider.addEventListener('input', (e) => {
        const radiusValue = parseInt(e.target.value);
        
        // Update the radius display value
        document.getElementById('floatingRadiusValue').textContent = radiusValue;
        
        // If a restaurant is selected, update the circle and filter stores
        if (currentSelectedRestaurant && restaurants[currentSelectedRestaurant]) {
          const coords = restaurants[currentSelectedRestaurant];
          updateRadiusCircle(coords, radiusValue);
          
          // Re-filter stores based on new radius
          filteredStores = filterStoresByRadius(radiusValue, coords);
          // Apply shopping list filter
          filteredStores = filterStoresByShoppingList(filteredStores);
          console.log('Filtered stores by new radius:', filteredStores.length);
          
          // Update store markers visibility
          updateStoreMarkersVisibility(filteredStores);
          
          // Update stores list in side menu
          updateStoresListDisplay(filteredStores);
        }
      });
    }
    
    // Function to update store markers visibility
    function updateStoreMarkersVisibility(visibleStores) {
      const visibleStoreSet = new Set(visibleStores.map(s => `${s.storeName}-${s.storeAddress}`));
      
      storeMarkers.forEach(({ marker, store, element }) => {
        const storeKey = `${store.storeName}-${store.storeAddress}`;
        if (visibleStoreSet.has(storeKey)) {
          // Make marker visible
          element.style.display = 'block';
          element.style.opacity = '1';
        } else {
          // Hide marker
          element.style.display = 'none';
          element.style.opacity = '0';
        }
      });
    }
    

  } catch (error) {
    console.error('❌ Error initializing map:', error);
    console.error('Error details:', error.message);
    console.error('Error stack:', error.stack);
  }
}

// Initialize map when DOM is ready
console.log('Document ready state:', document.readyState);

if (document.readyState === 'loading') {
  console.log('DOM still loading, adding DOMContentLoaded listener');
  document.addEventListener('DOMContentLoaded', initMap);
} else {
  console.log('DOM already loaded, initializing map now');
  initMap();
}

