// Create a mock window object
global.window = {};

// Load stores.js
eval(require('fs').readFileSync('stores.js', 'utf8'));

console.log('✓ Stores loaded successfully\n');
console.log(`Total unique stores: ${window.allStores.length}`);
console.log(`Expected: 93\n`);

// Sort by product count
const sorted = [...window.allStores].sort((a, b) => b.uniqueProducts - a.uniqueProducts);

console.log('Top 10 stores by product count:');
sorted.slice(0, 10).forEach((s, i) => {
  console.log(`  ${i+1}. ${s.storeName}: ${s.uniqueProducts} products`);
});

console.log('\nBottom 10 stores by product count:');
sorted.slice(-10).forEach((s, i) => {
  console.log(`  ${i+1}. ${s.storeName}: ${s.uniqueProducts} products`);
});

console.log('\n\nDetailed check for stores with variations:');
const storesByName = {};
window.allStores.forEach(s => {
  if (!storesByName[s.storeName]) storesByName[s.storeName] = [];
  storesByName[s.storeName].push(s);
});

// Check if Target, Safeway, etc are properly merged
['Target', 'Safeway', 'Harris Teeter', 'Whole Foods Market', 'Trader Joe\'s'].forEach(name => {
  const stores = storesByName[name];
  if (stores) {
    console.log(`\n${name}: ${stores.length} location(s)`);
    stores.forEach(s => {
      console.log(`  - ${s.storeAddress}: ${s.uniqueProducts} products`);
    });
  }
});
