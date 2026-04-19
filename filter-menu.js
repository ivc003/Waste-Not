// Side Menu Tab Interactions

const sideTabs = document.querySelectorAll('.side-menu-tab');
const sideMenuContents = document.querySelectorAll('.side-menu-content');

sideTabs.forEach(tab => {
  tab.addEventListener('click', () => {
    const tabName = tab.getAttribute('data-tab');
    
    // Remove active class from all tabs
    sideTabs.forEach(t => t.classList.remove('active'));
    
    // Hide all content
    sideMenuContents.forEach(content => content.hidden = true);
    
    // Add active class to clicked tab
    tab.classList.add('active');
    
    // Show corresponding content
    const contentElement = document.getElementById(`${tabName}-tab`);
    if (contentElement) {
      contentElement.hidden = false;
    }
  });
})

// Sync floating bar location dropdown with any internal reference
const floatingLocationSelect = document.getElementById('floatingLocationSelect');
const floatingRadiusSlider = document.getElementById('floatingRadiusSlider');
const floatingRadiusValue = document.getElementById('floatingRadiusValue');

if (floatingRadiusSlider && floatingRadiusValue) {
  floatingRadiusSlider.addEventListener('input', (e) => {
    floatingRadiusValue.textContent = e.target.value;
  });
}

// Collapsible products section
const collapsibleHeader = document.querySelector('.collapsible-header');
const collapsibleContent = document.getElementById('productsList');

if (collapsibleHeader && collapsibleContent) {
  collapsibleHeader.addEventListener('click', () => {
    const isExpanded = collapsibleHeader.getAttribute('aria-expanded') === 'true';
    collapsibleHeader.setAttribute('aria-expanded', String(!isExpanded));
    collapsibleContent.hidden = isExpanded;
  });
}

// Radius slider update
const radiusSlider = document.getElementById('radiusSlider');
const radiusValue = document.getElementById('radiusValue');

if (radiusSlider && radiusValue) {
  radiusSlider.addEventListener('input', (e) => {
    radiusValue.textContent = e.target.value;
  });
}

// Price range slider sync
const maxPriceSlider = document.getElementById('maxPriceSlider');
const maxPriceDisplay = document.getElementById('maxPrice');

if (maxPriceSlider) {
  maxPriceSlider.addEventListener('input', (e) => {
    maxPriceDisplay.textContent = e.target.value;
  });
}

// ===== MENU SELECT DROPDOWN =====
function loadMenusIntoDropdown() {
  const menusList = document.getElementById('menus-list');
  if (!menusList) return;
  
  // Check if user is logged in (via authManager which should be loaded from auth.js)
  const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
  
  if (!isLoggedIn) {
    menusList.innerHTML = '<p class="no-menus-text">Log in to view and select your menus.</p>';
    return;
  }
  
  // Get menus from localStorage
  const menus = JSON.parse(localStorage.getItem('userMenus') || '[]');
  
  if (menus.length === 0) {
    menusList.innerHTML = '<p class="no-menus-text">No menus created yet. Create one in My Account.</p>';
    return;
  }
  
  // Clear existing items
  menusList.innerHTML = '';
  
  // Create checkbox items for each menu
  menus.forEach((menu, index) => {
    const menuItem = document.createElement('div');
    menuItem.className = 'menu-checkbox-item';
    
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.id = `menu-checkbox-${index}`;
    checkbox.dataset.menuIndex = index;
    checkbox.addEventListener('change', handleMenuCheckboxChange);
    
    const label = document.createElement('label');
    label.htmlFor = `menu-checkbox-${index}`;
    label.textContent = menu.name;
    
    menuItem.appendChild(checkbox);
    menuItem.appendChild(label);
    menusList.appendChild(menuItem);
  });
}

function handleMenuCheckboxChange(e) {
  const menuIndex = parseInt(e.target.dataset.menuIndex);
  const isChecked = e.target.checked;
  const menus = JSON.parse(localStorage.getItem('userMenus') || '[]');
  
  if (isChecked) {
    // Add ingredients from this menu to shopping list
    const menu = menus[menuIndex];
    if (menu && menu.recipes) {
      menu.recipes.forEach(recipe => {
        if (recipe.ingredients) {
          recipe.ingredients.forEach(ingredient => {
            addToShoppingList(ingredient);
          });
        }
      });
    }
  } else {
    // Remove ingredients from this menu from shopping list
    const menu = menus[menuIndex];
    if (menu && menu.recipes) {
      menu.recipes.forEach(recipe => {
        if (recipe.ingredients) {
          recipe.ingredients.forEach(ingredient => {
            removeFromShoppingList(ingredient);
          });
        }
      });
    }
  }
  
  updateShoppingListDisplay();
}

function addToShoppingList(ingredient) {
  const shoppingList = JSON.parse(localStorage.getItem('shoppingList') || '[]');
  
  // Check if ingredient already exists
  const exists = shoppingList.find(item => item.toLowerCase() === ingredient.toLowerCase());
  
  if (!exists) {
    shoppingList.push(ingredient);
    localStorage.setItem('shoppingList', JSON.stringify(shoppingList));
    updateShoppingListDisplay();
  }
}

function removeFromShoppingList(ingredient) {
  const shoppingList = JSON.parse(localStorage.getItem('shoppingList') || '[]');
  
  // Remove ingredient
  const updatedList = shoppingList.filter(item => item.toLowerCase() !== ingredient.toLowerCase());
  localStorage.setItem('shoppingList', JSON.stringify(updatedList));
}

function updateShoppingListDisplay() {
  const productsList = document.querySelector('.products-list');
  if (!productsList) return;
  
  const shoppingList = JSON.parse(localStorage.getItem('shoppingList') || '[]');
  const collapsibleHeader = document.querySelector('.collapsible-header');
  
  if (collapsibleHeader) {
    collapsibleHeader.textContent = '▼ Shopping List (' + shoppingList.length + ')';
  }
  
  if (shoppingList.length === 0) {
    productsList.innerHTML = '<p class="no-products">No products selected. Use search bar or menus to add products.</p>';
    return;
  }
  
  productsList.innerHTML = '';
  shoppingList.forEach(item => {
    const productItem = document.createElement('div');
    productItem.className = 'product-item';
    productItem.innerHTML = `
      <span>${item}</span>
      <button class="remove-product-btn" data-ingredient="${item}">Remove</button>
    `;
    productsList.appendChild(productItem);
    
    // Add event listener to remove button
    const removeBtn = productItem.querySelector('.remove-product-btn');
    removeBtn.addEventListener('click', () => {
      removeFromShoppingList(item);
      updateShoppingListDisplay();
    });
  });
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  loadMenusIntoDropdown();
  updateShoppingListDisplay();
});

// Search bar handler
const searchInput = document.querySelector('.filter-search');

if (searchInput) {
  searchInput.addEventListener('keypress', (e) => {
    // Handle Enter key press
    if (e.key === 'Enter') {
      const searchTerm = e.target.value.trim();
      if (searchTerm) {
        // Add to shopping list
        addToShoppingList(searchTerm);
        // Clear the search bar
        searchInput.value = '';
      }
    }
  });
}

// Apply filters button
const applyFiltersBtn = document.querySelector('.apply-filters-btn');

if (applyFiltersBtn) {
  applyFiltersBtn.addEventListener('click', () => {
    // Collect all filter values
    const filters = {
      search: searchInput ? searchInput.value : '',
      location: document.getElementById('locationSelect')?.value || '',
      radius: document.getElementById('radiusSlider')?.value || 5,
      minPrice: document.getElementById('minPriceSlider')?.value || 0,
      maxPrice: document.getElementById('maxPriceSlider')?.value || 50,
      freshness: document.getElementById('freshnessInput')?.value || 0,
      availabilityStartDate: document.getElementById('availabilityStartDate')?.value || '',
      availabilityEndDate: document.getElementById('availabilityEndDate')?.value || '',
    };

    console.log('Filters applied:', filters);
    // Send filters to backend or process them

    // Switch to stores tab
    const storesTab = document.querySelector('.side-menu-tab[data-tab="stores"]');
    if (storesTab) {
      storesTab.click();
    }
  });
}

// Freshness filter input
const freshnessInput = document.getElementById('freshnessInput');

if (freshnessInput) {
  freshnessInput.addEventListener('input', (e) => {
    // Ensure value is not negative
    if (parseInt(e.target.value) < 0) {
      e.target.value = 0;
    }
    console.log('Freshness filter set to:', e.target.value, 'days');
  });

  freshnessInput.addEventListener('blur', (e) => {
    // Validate on blur
    if (e.target.value === '' || parseInt(e.target.value) < 0) {
      e.target.value = 0;
    }
  });
}

// Availability date range filters
const availabilityStartDate = document.getElementById('availabilityStartDate');
const availabilityEndDate = document.getElementById('availabilityEndDate');

if (availabilityStartDate && availabilityEndDate) {
  // Set today's date as default for start date
  const today = new Date().toISOString().split('T')[0];
  availabilityStartDate.value = today;

  // Set minimum date for both inputs to today
  availabilityStartDate.min = today;
  availabilityEndDate.min = today;

  // Update end date minimum when start date changes
  availabilityStartDate.addEventListener('change', (e) => {
    availabilityEndDate.min = e.target.value;
    
    // If end date is before start date, update it
    if (availabilityEndDate.value && availabilityEndDate.value < e.target.value) {
      availabilityEndDate.value = e.target.value;
    }
    
    console.log('Availability start date set to:', e.target.value);
  });

  availabilityEndDate.addEventListener('change', (e) => {
    // Validate that end date is not before start date
    if (e.target.value && availabilityStartDate.value && e.target.value < availabilityStartDate.value) {
      e.target.value = availabilityStartDate.value;
    }
    
    console.log('Availability end date set to:', e.target.value);
  });
}

// ===== CART MODAL =====
const cartIcon = document.querySelector('.cart-icon');
const cartModal = document.getElementById('cart-modal');
const closeCartModal = document.getElementById('close-cart-modal');

if (cartIcon) {
  cartIcon.addEventListener('click', (e) => {
    e.preventDefault();
    displayCartModal();
    cartModal.style.display = 'flex';
  });
}

if (closeCartModal) {
  closeCartModal.addEventListener('click', () => {
    cartModal.style.display = 'none';
  });
}

// Close cart modal when clicking outside
if (cartModal) {
  cartModal.addEventListener('click', (e) => {
    if (e.target === cartModal) {
      cartModal.style.display = 'none';
    }
  });
}

function displayCartModal() {
  const cartItemsList = document.getElementById('cart-items-list');
  const shoppingList = JSON.parse(localStorage.getItem('shoppingList') || '[]');
  
  if (shoppingList.length === 0) {
    cartItemsList.innerHTML = '<p class="empty-cart-message">There are no items in cart</p>';
    return;
  }
  
  cartItemsList.innerHTML = '';
  shoppingList.forEach(item => {
    const cartItem = document.createElement('div');
    cartItem.className = 'cart-item';
    cartItem.innerHTML = `
      <span class="cart-item-name">${item}</span>
      <button class="cart-item-remove" data-ingredient="${item}">Remove</button>
    `;
    cartItemsList.appendChild(cartItem);
    
    // Add event listener to remove button
    const removeBtn = cartItem.querySelector('.cart-item-remove');
    removeBtn.addEventListener('click', () => {
      removeFromShoppingList(item);
      displayCartModal(); // Refresh the cart display
    });
  });
}

