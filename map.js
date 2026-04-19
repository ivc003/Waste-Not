// Import Mapbox as an ESM module
import mapboxgl from 'https://cdn.jsdelivr.net/npm/mapbox-gl@2.15.0/+esm';

// Check that Mapbox GL JS is loaded
console.log('Mapbox GL JS Loaded:', mapboxgl);

// Set your Mapbox access token here
mapboxgl.accessToken = 'pk.eyJ1IjoidmFsYXUiLCJhIjoiY21vNTlvenR0MWVlejJwcHNyaDQyMWk1dyJ9._Z2m36NY-HnfdP_mGii0Sg';

// Log for debugging
console.log('Page hostname:', window.location.hostname);
console.log('Page protocol:', window.location.protocol);
console.log('Full URL:', window.location.href);

// Fixed restaurant coordinates at real grocery store areas in Washington DC
const restaurants = {
  'restaurant-x': [-77.0369, 38.8977], // Near Whole Foods Market - Downtown DC / Chinatown
  'restaurant-y': [-77.0648, 38.9076], // Near Giant Food - Upper NW / Woodley Park area
  'restaurant-z': [-77.0248, 38.8947]  // Near Safeway - Capitol Hill / Navy Yard area
};

console.log('Restaurant Coordinates:', restaurants);

// Function to convert miles to kilometers
function milesToKm(miles) {
  return miles * 1.60934;
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
  const mapContainer = document.getElementById('map');
  
  if (!mapContainer) {
    console.error('Map container not found!');
    return;
  }
  
  console.log('Map container found, initializing map...');
  
  // Initialize the map
  const map = new mapboxgl.Map({
    container: 'map', // ID of the div where the map will render
    style: 'mapbox://styles/mapbox/streets-v12', // Map style
    center: [-77.0369, 38.9072], // [longitude, latitude] - Washington DC
    zoom: 12, // Initial zoom level
    minZoom: 5, // Minimum allowed zoom
    maxZoom: 18, // Maximum allowed zoom
    attributionControl: true,
    customAttribution: 'Map data © Mapbox'
  });
  
  // Log map events for debugging
  map.on('load', () => {
    console.log('Map loaded successfully!');
  });
  
  map.on('error', (e) => {
    console.error('Map error:', e);
  });
  
  // Optional: Add zoom and rotation controls
  map.addControl(new mapboxgl.NavigationControl());

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
      }
    });
  }

  // Handle radius slider changes
  if (radiusSlider) {
    radiusSlider.addEventListener('input', (e) => {
      const radiusValue = parseInt(e.target.value);
      
      // Update the radius display value
      document.getElementById('floatingRadiusValue').textContent = radiusValue;
      
      // If a restaurant is selected, update the circle
      if (currentSelectedRestaurant && restaurants[currentSelectedRestaurant]) {
        const coords = restaurants[currentSelectedRestaurant];
        updateRadiusCircle(coords, radiusValue);
      }
    });
  }
}

// Initialize map when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initMap);
} else {
  initMap();
}


