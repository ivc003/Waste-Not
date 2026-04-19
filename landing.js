// Landing page script

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

// Helper function to check if a product meets all filter criteria
function meetsFilterCriteria(productDetail, maxPrice, freshnessLimit, startDate, endDate) {
  const price = productDetail.discountedPrice > 0 ? productDetail.discountedPrice : productDetail.originalPrice;
  const meetsPrice = price <= maxPrice;
  const meetsFreshness = productDetail.daysToExpiry <= freshnessLimit;
  const meetsDateRange = meetsAvailabilityDateRange(productDetail.daysToExpiry, startDate, endDate);
  
  return meetsPrice && meetsFreshness && meetsDateRange;
}

// Helper function to check if a product is fresh for the entire availability date range
function meetsAvailabilityDateRange(daysToExpiry, startDate, endDate) {
  // If no date range specified, product is valid
  if (!startDate && !endDate) {
    return true;
  }
  
  // If only start date specified
  if (startDate && !endDate) {
    const start = new Date(startDate);
    const daysUntilStart = Math.ceil((start - new Date()) / (1000 * 60 * 60 * 24));
    return daysToExpiry > daysUntilStart;
  }
  
  // If only end date specified
  if (!startDate && endDate) {
    const end = new Date(endDate);
    const daysUntilEnd = Math.ceil((end - new Date()) / (1000 * 60 * 60 * 24));
    return daysToExpiry > daysUntilEnd;
  }
  
  // If both dates specified, product must be fresh for entire range
  const end = new Date(endDate);
  const daysUntilEnd = Math.ceil((end - new Date()) / (1000 * 60 * 60 * 24));
  
  return daysToExpiry > daysUntilEnd;
}

document.addEventListener('DOMContentLoaded', function() {
  // Initialize stores list display on page load
  initializeStoresListDisplay();
});

function initializeStoresListDisplay() {
  // Wait a moment for stores.js to load
  setTimeout(() => {
    if (window.allStores && window.allStores.length > 0) {
      console.log('Initializing stores list with', window.allStores.length, 'stores');
      updateStoresListDisplay(window.allStores);
    }
  }, 100);
}

function updateStoresListDisplay(visibleStores) {
  const storesList = document.querySelector('.stores-list');
  
  if (!storesList) {
    console.warn('Stores list container not found');
    return;
  }
  
  if (visibleStores.length === 0) {
    storesList.innerHTML = '<p class="no-stores">No stores within the selected radius.</p>';
    // Update tab heading to show 0 stores
    updateStoresTabHeading(0);
    return;
  }
  
  // Get shopping list from localStorage
  const shoppingList = JSON.parse(localStorage.getItem('shoppingList') || '[]');
  
  // Get current filters from window
  const maxPrice = window.currentFilters?.maxPrice || 50;
  const freshnessLimit = window.currentFilters?.freshness || 7;
  const startDate = window.currentFilters?.availabilityStartDate || '';
  const endDate = window.currentFilters?.availabilityEndDate || '';
  
  // Filter stores by shopping list products if shopping list is not empty
  let storesToDisplay = visibleStores;
  let showProductMatches = false;
  
  if (shoppingList.length > 0) {
    showProductMatches = true;
    storesToDisplay = visibleStores.filter(store => {
      // Check if store has at least one product from the shopping list using fuzzy matching
      // AND meets price, freshness, and date range criteria
      return shoppingList.some(product => 
        store.productDetails && store.productDetails.some(storeProduct => 
          isFuzzyMatch(product, storeProduct.name) &&
          meetsFilterCriteria(storeProduct, maxPrice, freshnessLimit, startDate, endDate)
        )
      );
    });
  } else {
    // If no shopping list, filter by price, freshness, and date range only
    storesToDisplay = visibleStores.filter(store => {
      return store.productDetails && store.productDetails.some(product =>
        meetsFilterCriteria(product, maxPrice, freshnessLimit, startDate, endDate)
      );
    });
  }
  
  // Deduplicate stores
  const uniqueStoresMap = new Map();
  storesToDisplay.forEach(store => {
    const key = `${store.storeName}-${store.storeAddress}`;
    if (!uniqueStoresMap.has(key)) {
      uniqueStoresMap.set(key, store);
    }
  });
  
  const uniqueStores = Array.from(uniqueStoresMap.values());
  
  // Update tab heading with store count
  updateStoresTabHeading(uniqueStores.length);
  
  if (uniqueStores.length === 0 && shoppingList.length > 0) {
    storesList.innerHTML = '<p class="no-stores">No stores have the products in your shopping list.</p>';
    return;
  }
  
  let html = '<div class="stores-items">';
  uniqueStores.forEach(store => {
    // Count matching products from shopping list using fuzzy matching
    let matchCount = 0;
    if (showProductMatches) {
      matchCount = shoppingList.filter(product =>
        store.products.some(storeProduct =>
          isFuzzyMatch(product, storeProduct)
        )
      ).length;
    }
    
    const displayText = showProductMatches 
      ? `<strong>${matchCount}</strong> match${matchCount !== 1 ? 'es' : ''}`
      : `<strong>${store.uniqueProducts}</strong> unique product${store.uniqueProducts !== 1 ? 's' : ''}`;
    
    html += `
      <div class="store-item" onclick="showStoreProducts('${store.storeName.replace(/'/g, "\\'")}', '${store.storeAddress.replace(/'/g, "\\'")}')" style="cursor: pointer;">
        <div class="store-name">${store.storeName}</div>
        <div class="store-address">${store.storeAddress}</div>
        <div class="store-products">${displayText}</div>
      </div>
    `;
  });
  html += '</div>';
  
  storesList.innerHTML = html;
}

function updateStoresTabHeading(count) {
  const storesTab = document.querySelector('.side-menu-tab[data-tab="stores"]');
  if (storesTab) {
    storesTab.textContent = `Stores (${count})`;
  }
}

// Make updateStoresListDisplay globally accessible for map.js
window.updateStoresListDisplay = updateStoresListDisplay;

// Function to show products for a clicked store
function showStoreProducts(storeName, storeAddress) {
  const shoppingList = JSON.parse(localStorage.getItem('shoppingList') || '[]');
  const maxPrice = window.currentFilters?.maxPrice || 50;
  const freshnessLimit = window.currentFilters?.freshness || 7;
  const startDate = window.currentFilters?.availabilityStartDate || '';
  const endDate = window.currentFilters?.availabilityEndDate || '';
  
  // Find the store in allStores
  const store = window.allStores.find(s => 
    s.storeName === storeName && s.storeAddress === storeAddress
  );
  
  if (!store) {
    console.warn('Store not found:', storeName, storeAddress);
    return;
  }
  
  // Group products with their prices and expiry info
  const productMap = new Map();
  
  store.productDetails.forEach(detail => {
    // Filter by price, freshness, and date range
    if (!meetsFilterCriteria(detail, maxPrice, freshnessLimit, startDate, endDate)) {
      return; // Skip products that don't meet criteria
    }
    
    const key = detail.name.toLowerCase();
    if (!productMap.has(key)) {
      productMap.set(key, {
        name: detail.name,
        prices: []
      });
    }
    productMap.get(key).prices.push({
      originalPrice: detail.originalPrice,
      discountedPrice: detail.discountedPrice,
      daysToExpiry: detail.daysToExpiry,
      quantityAvailable: detail.quantityAvailable,
      isAvailable: detail.isAvailable
    });
  });
  
  // Filter to only show matching products if shopping list exists
  let productsArray = Array.from(productMap.values());
  if (shoppingList.length > 0) {
    productsArray = productsArray.filter(item =>
      shoppingList.some(searchProduct =>
        isFuzzyMatch(searchProduct, item.name)
      )
    );
  }
  
  // Update modal title
  document.getElementById('store-products-title').textContent = 
    `${storeName} - ${shoppingList.length > 0 ? 'Matching Products' : 'All Products'}`;
  
  // Create product cards
  const container = document.getElementById('store-products-container');
  container.innerHTML = '';
  
  // Helper function to capitalize first letter of each word
  const toTitleCase = (str) => {
    return str.replace(/\b\w/g, char => char.toUpperCase());
  };
  
  productsArray.forEach(item => {
    const minPrice = Math.min(...item.prices.map(p => p.discountedPrice || p.originalPrice));
    const displayName = toTitleCase(item.name);
    
    const card = document.createElement('div');
    card.className = 'product-card';
    card.innerHTML = `
      <div class="product-card-name">${displayName}</div>
      <div class="product-card-price">From <span>$${minPrice.toFixed(2)}</span></div>
      <button class="see-more-btn" onclick="showProductDetails('${item.name.replace(/'/g, "\\'")}', '${storeName.replace(/'/g, "\\'")}', '${storeAddress.replace(/'/g, "\\'")}')">See More</button>
    `;
    container.appendChild(card);
  });
  
  // Show modal with proper offset
  const modal = document.getElementById('store-products-modal');
  modal.style.display = 'flex';
}

// Function to show detailed inventory for a product
function showProductDetails(productName, storeName, storeAddress) {
  const store = window.allStores.find(s => 
    s.storeName === storeName && s.storeAddress === storeAddress
  );
  
  if (!store) return;
  
  // Find all instances of this product in the store
  const productDetails = store.productDetails.filter(detail =>
    detail.name.toLowerCase() === productName.toLowerCase()
  );
  
  // Create a detailed modal for inventory
  const modal = document.getElementById('store-products-modal');
  const container = document.getElementById('store-products-container');
  
  // Helper function to capitalize first letter of each word
  const toTitleCase = (str) => {
    return str.replace(/\b\w/g, char => char.toUpperCase());
  };
  
  // Create HTML for product details
  let detailsHTML = `
    <div class="product-details-header">
      <h3 class="product-details-title">${toTitleCase(productName)}</h3>
      <div class="product-details-store">${storeName} - ${storeAddress}</div>
    </div>
    <div class="product-inventory-container">
  `;
  
  productDetails.forEach((detail, index) => {
    const originalPrice = detail.originalPrice;
    const discountedPrice = detail.discountedPrice;
    const daysToExpiry = detail.daysToExpiry;
    const quantityAvailable = detail.quantityAvailable;
    const isAvailable = detail.isAvailable;
    
    const displayPrice = discountedPrice > 0 ? discountedPrice : originalPrice;
    const savings = originalPrice - discountedPrice;
    
    const uniqueId = `product-variant-${index}`;
    
    detailsHTML += `
      <div class="inventory-item">
        <div>
          <div class="inventory-label">Price</div>
          <div class="inventory-price">$${displayPrice.toFixed(2)}</div>
          ${savings > 0 ? `<div style="font-size: 0.8rem; color: #e74c3c;">Save $${savings.toFixed(2)}</div>` : ''}
        </div>
        <div>
          <div class="inventory-label">Days to Expiry</div>
          <div class="inventory-value">${daysToExpiry} days</div>
        </div>
        <div>
          <div class="inventory-label">Available</div>
          <div class="inventory-value">${quantityAvailable} units (${isAvailable ? 'In Stock' : 'Low Stock'})</div>
        </div>
        <div style="grid-column: 1 / -1; display: flex; gap: 1rem; align-items: center; margin-top: 0.5rem;">
          <label for="${uniqueId}" style="font-size: 0.9rem; color: #666;">Qty:</label>
          <input type="number" id="${uniqueId}" class="quantity-input" min="0" max="${quantityAvailable}" value="0" data-price="${displayPrice}" data-product-name="${productName.replace(/"/g, '&quot;')}" data-store-name="${storeName.replace(/"/g, '&quot;')}" data-store-address="${storeAddress.replace(/"/g, '&quot;')}" data-days-to-expiry="${daysToExpiry}">
        </div>
      </div>
    `;
  });
  
  detailsHTML += `
    </div>
    <button class="add-to-cart-from-details" onclick="addSelectedProductsToCart('${productName.replace(/'/g, "\\'")}', '${storeName.replace(/'/g, "\\'")}', '${storeAddress.replace(/'/g, "\\'")}')" style="margin-bottom: 0.5rem;">Add Selected to Cart</button>
    <button class="add-to-cart-from-details" style="background-color: #666; margin-top: 0.5rem;" onclick="goBackToStoreProducts()">Back to Products</button>
  `;
  
  container.innerHTML = detailsHTML;
}

// Function to go back to store products list
function goBackToStoreProducts() {
  // This would require storing the current store context
  // For now, we'll close the modal
  document.getElementById('store-products-modal').style.display = 'none';
}

// Function to add product to cart
function addProductToCart(productName, storeName) {
  // This would integrate with your cart system
  console.log('Added to cart:', productName, 'from', storeName);
  alert(`${productName} added to cart from ${storeName}`);
}

// Function to add selected product variants to cart
function addSelectedProductsToCart(productName, storeName, storeAddress) {
  const quantityInputs = document.querySelectorAll('.quantity-input');
  let addedCount = 0;
  const cartItems = [];
  
  quantityInputs.forEach((input) => {
    const quantity = parseInt(input.value) || 0;
    
    if (quantity > 0) {
      const price = parseFloat(input.getAttribute('data-price'));
      const daysToExpiry = parseInt(input.getAttribute('data-days-to-expiry'));
      
      cartItems.push({
        productName: productName,
        storeName: storeName,
        storeAddress: storeAddress,
        quantity: quantity,
        price: price,
        daysToExpiry: daysToExpiry,
        totalPrice: price * quantity,
        timestamp: new Date().toISOString()
      });
      
      addedCount += quantity;
    }
  });
  
  if (addedCount === 0) {
    alert('Please select at least one item to add to cart');
    return;
  }
  
  // Get existing cart from localStorage
  const cart = JSON.parse(localStorage.getItem('cart') || '[]');
  
  // Add new items to cart
  cartItems.forEach(item => {
    cart.push(item);
  });
  
  // Save updated cart
  localStorage.setItem('cart', JSON.stringify(cart));
  
  // Update cart count in UI
  updateCartCount();
  
  // Show success message
  alert(`Added ${addedCount} item(s) to cart`);
  
  // Close modal or reset form
  document.getElementById('store-products-modal').style.display = 'none';
}

// Function to update cart count in navbar
function updateCartCount() {
  const cart = JSON.parse(localStorage.getItem('cart') || '[]');
  const cartCount = document.querySelector('.cart-count');
  if (cartCount) {
    cartCount.textContent = cart.length;
  }
}

// Modal close handler
document.addEventListener('DOMContentLoaded', function() {
  const closeBtn = document.getElementById('close-store-products-modal');
  const modal = document.getElementById('store-products-modal');
  
  if (closeBtn) {
    closeBtn.onclick = function() {
      modal.style.display = 'none';
    };
  }
  
  // Close modal when clicking outside of it
  window.onclick = function(event) {
    if (event.target === modal) {
      modal.style.display = 'none';
    }
  };
});

