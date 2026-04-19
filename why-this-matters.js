// JavaScript for the Why This Matters page
// Displays the story/narrative content with Mapbox visualizations

let currentStepIndex = 0;
let mapboxMap = null;

document.addEventListener('DOMContentLoaded', function() {
  displayCurrentStep();
  setupNavigation();
});

function displayCurrentStep() {
  const step = storySteps[currentStepIndex];
  const container = document.getElementById('narration-box-static');
  
  container.innerHTML = `
    <div class="story-step">
      <div class="story-content">
        <h2 class="story-title">${step.title}</h2>
        <h3 class="story-subtitle">${step.subtitle}</h3>
        <p class="story-text">${step.text}</p>
      </div>
      <div id="map-container" class="story-map-container"></div>
      <div class="story-controls">
        <button id="prevBtn" class="story-nav-btn" ${currentStepIndex === 0 ? 'disabled' : ''}>← Previous</button>
        <span class="step-counter">${currentStepIndex + 1} of ${storySteps.length}</span>
        <button id="nextBtn" class="story-nav-btn" ${currentStepIndex === storySteps.length - 1 ? 'disabled' : ''}>Next →</button>
      </div>
    </div>
  `;
  
  // Initialize map if mapView is defined
  if (step.mapView) {
    initializeMapbox(step.mapView);
  }
  
  // Attach event listeners
  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');
  
  if (prevBtn) {
    prevBtn.addEventListener('click', goToPreviousStep);
  }
  if (nextBtn) {
    nextBtn.addEventListener('click', goToNextStep);
  }
}

function initializeMapbox(mapView) {
  // Set Mapbox token (same as in map.js)
  mapboxgl.accessToken = 'pk.eyJ1IjoidmFsYXUiLCJhIjoiY202MWtrZjhlMGw0eTJqcHl4aHBqc2M3eCJ9.vqMTDeNjunLGYJWNZUTJuw';
  
  if (typeof mapboxgl === 'undefined') {
    console.warn('Mapbox GL JS is not loaded');
    return;
  }
  
  const mapContainer = document.getElementById('map-container');
  if (!mapContainer) return;
  
  // Define view configurations
  const viewConfigs = {
    usa: {
      center: [-95.7129, 37.0902],
      zoom: 3.5,
      pitch: 0,
      bearing: 0
    },
    massachusetts: {
      center: [-71.5301, 42.2302],
      zoom: 8,
      pitch: 0,
      bearing: 0
    }
  };
  
  const config = viewConfigs[mapView] || viewConfigs.usa;
  
  // Destroy old map if it exists
  if (mapboxMap) {
    mapboxMap.remove();
    mapboxMap = null;
  }
  
  // Create new map
  try {
    mapboxMap = new mapboxgl.Map({
      container: mapContainer,
      style: 'mapbox://styles/mapbox/light-v10',
      center: config.center,
      zoom: config.zoom,
      pitch: config.pitch,
      bearing: config.bearing
    });
    
    // Resize map after it loads
    mapboxMap.on('load', function() {
      setTimeout(() => {
        mapboxMap.resize();
      }, 100);
      
      // If Massachusetts view, load and plot food generators data
      if (mapView === 'massachusetts') {
        loadFoodGeneratorsData();
      }
    });
  } catch (error) {
    console.error('Error initializing Mapbox:', error);
    mapContainer.innerHTML = '<p style="padding: 20px; color: #666;">Map visualization error</p>';
  }
}

function loadFoodGeneratorsData() {
  // Remove existing layer and source if they exist
  if (mapboxMap.getLayer('food-generators-layer')) {
    mapboxMap.removeLayer('food-generators-layer');
  }
  if (mapboxMap.getSource('food-generators')) {
    mapboxMap.removeSource('food-generators');
  }
  
  // Fetch the CSV file
  fetch('./exploratory_data/food_generators_MA.csv')
    .then(response => response.text())
    .then(data => {
      const lines = data.trim().split('\n');
      const headers = parseCSVLine(lines[0]);
      
      console.log('Headers:', headers);
      
      // Find column indices
      const latIndex = headers.indexOf('Lat');
      const lonIndex = headers.indexOf('Long');
      
      console.log('Lat index:', latIndex, 'Lon index:', lonIndex);
      
      const features = [];
      let validCount = 0;
      let outOfBoundsCount = 0;
      
      // Parse all data rows
      for (let i = 1; i < lines.length; i++) {
        const cols = parseCSVLine(lines[i]);
        
        if (cols.length > Math.max(latIndex, lonIndex)) {
          const lat = parseFloat(cols[latIndex]);
          const lon = parseFloat(cols[lonIndex]);
          
          // Check if coordinates are valid
          if (!isNaN(lat) && !isNaN(lon)) {
            validCount++;
            
            // Only include valid coordinates within Massachusetts bounds
            // Massachusetts bounds: lat 41.0 to 43.0, lon -73.7 to -69.9
            if (lat >= 41 && lat <= 43 && lon >= -73.7 && lon <= -69.9) {
              features.push({
                type: 'Feature',
                geometry: {
                  type: 'Point',
                  coordinates: [lon, lat]
                },
                properties: {
                  name: cols[1] || 'Food Generator',
                  tons: cols[6] || 'N/A'
                }
              });
            } else {
              outOfBoundsCount++;
            }
          }
        }
      }
      
      console.log('Valid coordinates:', validCount, 'Out of bounds:', outOfBoundsCount, 'Loaded:', features.length);
      
      // Add GeoJSON source and layer to map
      if (features.length > 0 && mapboxMap) {
        try {
          mapboxMap.addSource('food-generators', {
            type: 'geojson',
            data: {
              type: 'FeatureCollection',
              features: features
            }
          });
          
          mapboxMap.addLayer({
            id: 'food-generators-layer',
            type: 'circle',
            source: 'food-generators',
            paint: {
              'circle-radius': 6,
              'circle-color': '#ff6b6b',
              'circle-opacity': 0.8,
              'circle-stroke-width': 2,
              'circle-stroke-color': '#fff'
            }
          });
          console.log('Food generators layer added to map');
        } catch (error) {
          console.error('Error adding layer to map:', error);
        }
      }
    })
    .catch(error => console.error('Error loading food generators data:', error));
}

// Helper function to parse CSV lines with proper quote handling
function parseCSVLine(line) {
  const result = [];
  let current = '';
  let insideQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];
    
    if (char === '"') {
      if (insideQuotes && nextChar === '"') {
        // Escaped quote
        current += '"';
        i++;
      } else {
        // Toggle quote state
        insideQuotes = !insideQuotes;
      }
    } else if (char === ',' && !insideQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current.trim());
  return result;
}


function goToNextStep() {
  if (currentStepIndex < storySteps.length - 1) {
    currentStepIndex++;
    displayCurrentStep();
    window.scrollTo(0, 0);
  }
}

function goToPreviousStep() {
  if (currentStepIndex > 0) {
    currentStepIndex--;
    displayCurrentStep();
    window.scrollTo(0, 0);
  }
}

function setupNavigation() {
  // Allow keyboard navigation
  document.addEventListener('keydown', function(e) {
    if (e.key === 'ArrowRight') goToNextStep();
    if (e.key === 'ArrowLeft') goToPreviousStep();
  });
}
