// Account page tab switching
const accountTabs = document.querySelectorAll('.account-tab:not(.logout-btn)');
const accountTabContents = document.querySelectorAll('.account-tab-content');

accountTabs.forEach(tab => {
  tab.addEventListener('click', () => {
    const tabName = tab.getAttribute('data-tab');
    
    // Remove active class from all tabs
    accountTabs.forEach(t => t.classList.remove('active'));
    
    // Hide all content
    accountTabContents.forEach(content => content.classList.remove('active'));
    
    // Add active class to clicked tab
    tab.classList.add('active');
    
    // Show corresponding content
    const contentElement = document.getElementById(`${tabName}-tab`);
    if (contentElement) {
      contentElement.classList.add('active');
    }
  });
});

// Logout button
const logoutBtn = document.getElementById('logout-btn');
if (logoutBtn) {
  logoutBtn.addEventListener('click', () => {
    authManager.logout();
    window.location.href = 'landing.html';
  });
}

// Change Address Modal
const changeAddressBtn = document.getElementById('change-address-btn');
const addressModal = document.getElementById('address-modal');
const closeModal = document.getElementById('close-modal');
const addressForm = document.getElementById('address-form');

if (changeAddressBtn) {
  changeAddressBtn.addEventListener('click', () => {
    addressModal.style.display = 'flex';
  });
}

if (closeModal) {
  closeModal.addEventListener('click', () => {
    addressModal.style.display = 'none';
  });
}

// Close modal when clicking outside
window.addEventListener('click', (e) => {
  if (e.target === addressModal) {
    addressModal.style.display = 'none';
  }
});

// Handle address form submission
if (addressForm) {
  addressForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const newAddress = `${document.getElementById('new-street').value}${document.getElementById('new-apt').value ? ', ' + document.getElementById('new-apt').value : ''}, ${document.getElementById('new-city').value}, ${document.getElementById('new-state').value} ${document.getElementById('new-zip').value}`;
    
    document.getElementById('profile-address').textContent = newAddress;
    
    // Update user data
    if (authManager.currentUser) {
      authManager.currentUser.address = newAddress;
      localStorage.setItem('currentUser', JSON.stringify(authManager.currentUser));
    }
    
    addressModal.style.display = 'none';
    addressForm.reset();
  });
}

// Load user profile data
function loadProfileData() {
  if (authManager.currentUser) {
    document.getElementById('profile-name').textContent = authManager.currentUser.firstName + ' ' + authManager.currentUser.lastName;
    document.getElementById('profile-email').textContent = authManager.currentUser.email;
    document.getElementById('profile-phone').textContent = authManager.currentUser.phone || '(555) 123-4567';
    
    // Format address
    const addr = authManager.currentUser.address;
    if (addr) {
      const fullAddress = `${addr.street}${addr.unit ? ', ' + addr.unit : ''}, ${addr.city}, ${addr.state} ${addr.zip}`;
      document.getElementById('profile-address').textContent = fullAddress;
    }
  }
}

// Load profile data on page load
loadProfileData();

// ===== LOAD MENUS FROM STORAGE =====

function loadMenusFromStorage() {
  const menus = JSON.parse(localStorage.getItem('userMenus') || '[]');
  const menusTab = document.getElementById('menus-tab');
  
  // Remove all existing menu sections (keep the header)
  const menusHeader = document.querySelector('.menus-header');
  const existingMenus = menusTab.querySelectorAll('.menu-section');
  existingMenus.forEach(menu => menu.remove());
  
  // Add all menus from localStorage
  menus.forEach(menu => {
    const menuSection = document.createElement('div');
    menuSection.className = 'menu-section';
    menuSection.dataset.menuId = menu.id;
    
    let recipesHTML = '';
    if (menu.recipes && menu.recipes.length > 0) {
      menu.recipes.forEach(recipe => {
        recipesHTML += `
          <div class="recipe-card" data-recipe-id="${recipe.id}">
            <div class="recipe-title">${recipe.name}</div>
            <div class="recipe-ingredients">
              <strong>Ingredients:</strong>
              <ul>
                ${recipe.ingredients.map(ing => `<li>${ing}</li>`).join('')}
              </ul>
            </div>
            <button class="edit-recipe-btn">Edit</button>
          </div>
        `;
      });
    }
    
    menuSection.innerHTML = `
      <div class="menu-header">
        <h2 class="menu-title">${menu.name}</h2>
        <button class="edit-menu-btn" data-menu-id="${menu.id}">Edit Menu</button>
      </div>
      <div class="recipes-wrapper">
        <button class="scroll-btn scroll-left" style="display: none;">&#10094;</button>
        <div class="recipes-container" data-menu-id="${menu.id}">
          ${recipesHTML}
          <button class="add-recipe-btn" style="flex: 0 0 280px; padding: 2rem; background: #f5f5f5; border: 2px dashed #2b7821; border-radius: 8px; cursor: pointer; font-weight: 600; color: #2b7821;">+ Add Recipe</button>
        </div>
        <button class="scroll-btn scroll-right">&#10095;</button>
      </div>
    `;
    
    // Insert after the header
    menusHeader.parentNode.insertBefore(menuSection, menusHeader.nextSibling);
  });
  
  // Re-setup event listeners for loaded menus
  setupScrollButtons();
  setupEditRecipeButtons();
  setupAddRecipeButtons();
  setupEditMenuButtons();
}

// Add recipe buttons event delegation
function setupAddRecipeButtons() {
  const addRecipeBtns = document.querySelectorAll('.add-recipe-btn');
  addRecipeBtns.forEach(btn => {
    // Remove previous listener by cloning
    const newBtn = btn.cloneNode(true);
    btn.parentNode.replaceChild(newBtn, btn);
    
    newBtn.addEventListener('click', () => {
      const menuSection = newBtn.closest('.menu-section');
      const menuId = parseInt(menuSection.dataset.menuId);
      openRecipeModal(menuId, newBtn.closest('.recipes-container'));
    });
  });
}

// Setup a single edit menu button (used for newly created menus)
function setupSingleEditMenuButton(btn) {
  btn.addEventListener('click', (e) => {
    e.preventDefault();
    const menuId = parseInt(btn.dataset.menuId);
    const menuSection = btn.closest('.menu-section');
    const menuTitle = menuSection.querySelector('.menu-title').textContent;
    
    // Create edit menu modal
    const editMenuModal = document.createElement('div');
    editMenuModal.className = 'modal';
    editMenuModal.style.display = 'flex';
    editMenuModal.innerHTML = `
      <div class="modal-content">
        <span class="modal-close" onclick="this.closest('.modal').remove();">&times;</span>
        <h2>Edit Menu</h2>
        <form class="edit-menu-form">
          <div class="form-group">
            <label for="edit-menu-name">Menu Name:</label>
            <input type="text" id="edit-menu-name" name="menuName" value="${menuTitle}" required>
          </div>
          <div style="display: flex; gap: 0.5rem;">
            <button type="submit" class="login-submit">Update Menu</button>
            <button type="button" class="delete-menu-btn login-submit" style="background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%);">Delete Menu</button>
          </div>
        </form>
      </div>
    `;
    
    document.body.appendChild(editMenuModal);
    
    // Handle form submission
    editMenuModal.querySelector('.edit-menu-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const newName = document.getElementById('edit-menu-name').value;
      
      // Update localStorage
      const menus = JSON.parse(localStorage.getItem('userMenus') || '[]');
      const menu = menus.find(m => m.id === menuId);
      if (menu) {
        menu.name = newName;
        localStorage.setItem('userMenus', JSON.stringify(menus));
      }
      
      menuSection.querySelector('.menu-title').textContent = newName;
      editMenuModal.remove();
    });
    
    // Handle delete menu
    editMenuModal.querySelector('.delete-menu-btn').addEventListener('click', () => {
      if (confirm('Are you sure you want to delete this menu?')) {
        // Delete from localStorage
        const menus = JSON.parse(localStorage.getItem('userMenus') || '[]');
        const filtered = menus.filter(m => m.id !== menuId);
        localStorage.setItem('userMenus', JSON.stringify(filtered));
        
        menuSection.remove();
        editMenuModal.remove();
      }
    });
    
    // Close modal when clicking outside
    editMenuModal.addEventListener('click', (e) => {
      if (e.target === editMenuModal) {
        editMenuModal.remove();
      }
    });
  });
}

// Setup a single scroll button (used for newly created menus)
function setupSingleScrollButton(btn) {
  btn.addEventListener('click', () => {
    const isLeftBtn = btn.classList.contains('scroll-left');
    const container = btn.closest('.recipes-wrapper').querySelector('.recipes-container');
    const scrollAmount = 300; // pixels to scroll
    
    if (isLeftBtn) {
      container.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
    } else {
      container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
    
    // Update button visibility
    updateScrollButtonVisibility(container);
  });
}

// Edit menu buttons event delegation
function setupEditMenuButtons() {
  const editMenuBtns = document.querySelectorAll('.edit-menu-btn');
  editMenuBtns.forEach(btn => {
    // Clone the button to remove all existing event listeners
    const newBtn = btn.cloneNode(true);
    btn.replaceWith(newBtn);
    
    newBtn.addEventListener('click', (e) => {
      e.preventDefault();
      const menuId = parseInt(newBtn.dataset.menuId);
      const menuSection = newBtn.closest('.menu-section');
      const menuTitle = menuSection.querySelector('.menu-title').textContent;
      
      // Create edit menu modal
      const editMenuModal = document.createElement('div');
      editMenuModal.className = 'modal';
      editMenuModal.style.display = 'flex';
      editMenuModal.innerHTML = `
        <div class="modal-content">
          <span class="modal-close" onclick="this.closest('.modal').remove();">&times;</span>
          <h2>Edit Menu</h2>
          <form class="edit-menu-form">
            <div class="form-group">
              <label for="edit-menu-name">Menu Name:</label>
              <input type="text" id="edit-menu-name" name="menuName" value="${menuTitle}" required>
            </div>
            <div style="display: flex; gap: 0.5rem;">
              <button type="submit" class="login-submit">Update Menu</button>
              <button type="button" class="delete-menu-btn login-submit" style="background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%);">Delete Menu</button>
            </div>
          </form>
        </div>
      `;
      
      document.body.appendChild(editMenuModal);
      
      // Handle form submission
      editMenuModal.querySelector('.edit-menu-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const newName = document.getElementById('edit-menu-name').value;
        
        // Update localStorage
        const menus = JSON.parse(localStorage.getItem('userMenus') || '[]');
        const menu = menus.find(m => m.id === menuId);
        if (menu) {
          menu.name = newName;
          localStorage.setItem('userMenus', JSON.stringify(menus));
        }
        
        menuSection.querySelector('.menu-title').textContent = newName;
        editMenuModal.remove();
      });
      
      // Handle delete menu
      editMenuModal.querySelector('.delete-menu-btn').addEventListener('click', () => {
        if (confirm('Are you sure you want to delete this menu?')) {
          // Delete from localStorage
          const menus = JSON.parse(localStorage.getItem('userMenus') || '[]');
          const filtered = menus.filter(m => m.id !== menuId);
          localStorage.setItem('userMenus', JSON.stringify(filtered));
          
          menuSection.remove();
          editMenuModal.remove();
        }
      });
      
      // Close modal when clicking outside
      editMenuModal.addEventListener('click', (e) => {
        if (e.target === editMenuModal) {
          editMenuModal.remove();
        }
      });
    });
  });
}

// Load menus on page load
loadMenusFromStorage();

// ===== MY MENUS SECTION =====

// Create Menu Modal
const createMenuBtn = document.getElementById('create-menu-btn');
const menuModal = document.getElementById('menu-modal');
const closeMenuModal = document.getElementById('close-menu-modal');
const menuForm = document.getElementById('menu-form');

if (createMenuBtn) {
  createMenuBtn.addEventListener('click', () => {
    menuModal.style.display = 'flex';
  });
}

if (closeMenuModal) {
  closeMenuModal.addEventListener('click', () => {
    menuModal.style.display = 'none';
  });
}

// Add Recipe Modal
const recipeModal = document.getElementById('recipe-modal');
const closeRecipeModal = document.getElementById('close-recipe-modal');
const recipeForm = document.getElementById('recipe-form');

if (closeRecipeModal) {
  closeRecipeModal.addEventListener('click', () => {
    recipeModal.style.display = 'none';
  });
}

// Close modals when clicking outside
window.addEventListener('click', (e) => {
  if (e.target === menuModal) {
    menuModal.style.display = 'none';
  }
  if (e.target === recipeModal) {
    recipeModal.style.display = 'none';
  }
});

// Handle menu form submission
if (menuForm) {
  menuForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const menuName = document.getElementById('menu-name').value;
    const description = document.getElementById('menu-description').value;
    
    // Save to localStorage
    const menus = JSON.parse(localStorage.getItem('userMenus') || '[]');
    const newMenu = {
      id: Date.now(),
      name: menuName,
      description: description,
      recipes: []
    };
    menus.push(newMenu);
    localStorage.setItem('userMenus', JSON.stringify(menus));
    
    // Create new menu section
    const menusContainer = document.getElementById('menus-tab');
    const newMenuSection = document.createElement('div');
    newMenuSection.className = 'menu-section';
    newMenuSection.dataset.menuId = newMenu.id;
    newMenuSection.innerHTML = `
      <div class="menu-header">
        <h2 class="menu-title">${menuName}</h2>
        <button class="edit-menu-btn" data-menu-id="${newMenu.id}">Edit Menu</button>
      </div>
      <div class="recipes-wrapper">
        <button class="scroll-btn scroll-left" style="display: none;">&#10094;</button>
        <div class="recipes-container" data-menu-id="${newMenu.id}">
          <button class="add-recipe-btn" style="flex: 0 0 280px; padding: 2rem; background: #f5f5f5; border: 2px dashed #2b7821; border-radius: 8px; cursor: pointer; font-weight: 600; color: #2b7821;">+ Add Recipe</button>
        </div>
        <button class="scroll-btn scroll-right">&#10095;</button>
      </div>
    `;
    
    // Insert before the order history section
    const menusHeader = document.querySelector('.menus-header');
    menusHeader.parentNode.insertBefore(newMenuSection, menusHeader.nextSibling);
    
    // Setup event listeners only for the new menu's edit button
    const newEditBtn = newMenuSection.querySelector('.edit-menu-btn');
    setupSingleEditMenuButton(newEditBtn);
    
    // Setup scroll buttons for the new menu
    newMenuSection.querySelectorAll('.scroll-btn').forEach(btn => {
      setupSingleScrollButton(btn);
    });
    
    // Add click handler to the new add recipe button
    newMenuSection.querySelector('.add-recipe-btn').addEventListener('click', () => {
      openRecipeModal(newMenu.id, newMenuSection.querySelector('.recipes-container'));
    });
    
    // Setup add recipe buttons for the new menu
    setupAddRecipeButtons();
    
    menuModal.style.display = 'none';
    menuForm.reset();
  });
}

// Store reference to current recipes container for adding recipes
let currentRecipesContainer = null;
let currentMenuId = null;

function openRecipeModal(menuId, container) {
  currentMenuId = menuId;
  currentRecipesContainer = container;
  recipeModal.style.display = 'flex';
}

// ===== SCROLL FUNCTIONALITY =====

function setupScrollButtons() {
  const scrollBtns = document.querySelectorAll('.scroll-btn');
  
  scrollBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const isLeftBtn = btn.classList.contains('scroll-left');
      const container = btn.closest('.recipes-wrapper').querySelector('.recipes-container');
      const scrollAmount = 300; // pixels to scroll
      
      if (isLeftBtn) {
        container.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
      } else {
        container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
      }
      
      // Update button visibility
      updateScrollButtonVisibility(container);
    });
  });
}

function updateScrollButtonVisibility(container) {
  const wrapper = container.closest('.recipes-wrapper');
  const leftBtn = wrapper.querySelector('.scroll-left');
  const rightBtn = wrapper.querySelector('.scroll-right');
  
  // Show/hide left button
  if (container.scrollLeft > 0) {
    leftBtn.style.display = 'flex';
  } else {
    leftBtn.style.display = 'none';
  }
  
  // Show/hide right button
  if (container.scrollLeft < container.scrollWidth - container.clientWidth - 10) {
    rightBtn.style.display = 'flex';
  } else {
    rightBtn.style.display = 'none';
  }
}

// Setup scroll buttons on page load and check visibility
setupScrollButtons();

document.querySelectorAll('.recipes-container').forEach(container => {
  updateScrollButtonVisibility(container);
  container.addEventListener('scroll', () => updateScrollButtonVisibility(container));
  window.addEventListener('resize', () => updateScrollButtonVisibility(container));
});

// ===== EDIT MENU FUNCTIONALITY =====

const editMenuBtns = document.querySelectorAll('.edit-menu-btn');
editMenuBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    const menuSection = btn.closest('.menu-section');
    const menuTitle = menuSection.querySelector('.menu-title').textContent;
    
    // Create edit menu modal content
    const editMenuModal = document.createElement('div');
    editMenuModal.className = 'modal';
    editMenuModal.style.display = 'flex';
    editMenuModal.innerHTML = `
      <div class="modal-content">
        <span class="modal-close" onclick="this.closest('.modal').remove();">&times;</span>
        <h2>Edit Menu</h2>
        <form class="edit-menu-form">
          <div class="form-group">
            <label for="edit-menu-name">Menu Name:</label>
            <input type="text" id="edit-menu-name" name="menuName" value="${menuTitle}" required>
          </div>
          <div style="display: flex; gap: 0.5rem;">
            <button type="submit" class="login-submit">Update Menu</button>
            <button type="button" class="delete-menu-btn login-submit" style="background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%);">Delete Menu</button>
          </div>
        </form>
      </div>
    `;
    
    document.body.appendChild(editMenuModal);
    
    // Handle form submission
    editMenuModal.querySelector('.edit-menu-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const newName = document.getElementById('edit-menu-name').value;
      menuSection.querySelector('.menu-title').textContent = newName;
      editMenuModal.remove();
    });
    
    // Handle delete menu
    editMenuModal.querySelector('.delete-menu-btn').addEventListener('click', () => {
      if (confirm('Are you sure you want to delete this menu?')) {
        menuSection.remove();
        editMenuModal.remove();
      }
    });
    
    // Close modal when clicking outside
    editMenuModal.addEventListener('click', (e) => {
      if (e.target === editMenuModal) {
        editMenuModal.remove();
      }
    });
  });
});

// ===== EDIT RECIPE FUNCTIONALITY =====

let currentRecipeCard = null;

function setupEditRecipeButtons() {
  const editBtns = document.querySelectorAll('.edit-recipe-btn');
  editBtns.forEach(btn => {
    btn.removeEventListener('click', handleEditRecipe);
    btn.addEventListener('click', handleEditRecipe);
  });
}

function handleEditRecipe(e) {
  e.preventDefault();
  const recipeCard = e.target.closest('.recipe-card');
  const recipeName = recipeCard.querySelector('.recipe-title').textContent;
  const ingredientsList = recipeCard.querySelectorAll('.recipe-ingredients li');
  const ingredients = Array.from(ingredientsList).map(li => li.textContent).join('\n');
  
  currentRecipeCard = recipeCard;
  
  // Populate the recipe form with current data
  document.getElementById('recipe-name').value = recipeName;
  document.getElementById('recipe-ingredients').value = ingredients;
  document.getElementById('recipe-instructions').value = '';
  
  // Change form title and submit button text
  document.getElementById('recipe-modal-title').textContent = 'Edit Recipe';
  const submitBtn = document.getElementById('recipe-submit-btn');
  submitBtn.textContent = 'Update Recipe';
  
  // Show delete button
  const deleteBtn = document.getElementById('delete-recipe-btn');
  deleteBtn.style.display = 'block';
  
  // Update form handler
  recipeForm.onsubmit = (e) => {
    e.preventDefault();
    
    const newRecipeName = document.getElementById('recipe-name').value;
    const ingredientsText = document.getElementById('recipe-ingredients').value;
    const ingredients = ingredientsText.split('\n').filter(ing => ing.trim());
    
    // Update the recipe card
    currentRecipeCard.querySelector('.recipe-title').textContent = newRecipeName;
    currentRecipeCard.querySelector('.recipe-ingredients ul').innerHTML = 
      ingredients.map(ing => `<li>${ing.trim()}</li>`).join('');
    
    recipeModal.style.display = 'none';
    recipeForm.reset();
    submitBtn.textContent = 'Add Recipe';
    document.getElementById('recipe-modal-title').textContent = 'Add Recipe';
    deleteBtn.style.display = 'none';
    setupEditRecipeButtons();
  };
  
  // Handle delete recipe
  deleteBtn.onclick = () => {
    if (confirm('Are you sure you want to delete this recipe?')) {
      currentRecipeCard.remove();
      recipeModal.style.display = 'none';
      recipeForm.reset();
      submitBtn.textContent = 'Add Recipe';
      document.getElementById('recipe-modal-title').textContent = 'Add Recipe';
      deleteBtn.style.display = 'none';
    }
  };
  
  recipeModal.style.display = 'flex';
}

function setupDefaultRecipeSubmit() {
  recipeForm.onsubmit = (e) => {
    e.preventDefault();
    
    const recipeName = document.getElementById('recipe-name').value;
    const ingredientsText = document.getElementById('recipe-ingredients').value;
    const ingredients = ingredientsText.split('\n').filter(ing => ing.trim());
    
    // Save recipe to localStorage
    const menus = JSON.parse(localStorage.getItem('userMenus') || '[]');
    const menu = menus.find(m => m.id === currentMenuId);
    
    if (menu) {
      const newRecipe = {
        id: Date.now(),
        name: recipeName,
        ingredients: ingredients
      };
      menu.recipes.push(newRecipe);
      localStorage.setItem('userMenus', JSON.stringify(menus));
      
      const recipeCard = document.createElement('div');
      recipeCard.className = 'recipe-card';
      recipeCard.dataset.recipeId = newRecipe.id;
      recipeCard.innerHTML = `
        <div class="recipe-title">${recipeName}</div>
        <div class="recipe-ingredients">
          <strong>Ingredients:</strong>
          <ul>
            ${ingredients.map(ing => `<li>${ing.trim()}</li>`).join('')}
          </ul>
        </div>
        <button class="edit-recipe-btn">Edit</button>
      `;
      
      if (currentRecipesContainer) {
        const addRecipeBtn = currentRecipesContainer.querySelector('.add-recipe-btn');
        if (addRecipeBtn) {
          addRecipeBtn.before(recipeCard);
        } else {
          currentRecipesContainer.appendChild(recipeCard);
        }
      }
    }
    
    recipeModal.style.display = 'none';
    recipeForm.reset();
    document.getElementById('recipe-modal-title').textContent = 'Add Recipe';
    document.getElementById('recipe-submit-btn').textContent = 'Add Recipe';
    document.getElementById('delete-recipe-btn').style.display = 'none';
    setupEditRecipeButtons();
    setupScrollButtons();
    
    // Check if scroll buttons should be visible
    const container = currentRecipesContainer;
    updateScrollButtonVisibility(container);
  };
}

setupDefaultRecipeSubmit();
setupEditRecipeButtons();

