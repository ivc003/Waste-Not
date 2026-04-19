global.window = {};
eval(require('fs').readFileSync('stores.js', 'utf8'));

const sorted = [...window.allStores].sort((a, b) => b.uniqueProducts - a.uniqueProducts);
console.log(`Total stores: ${window.allStores.length}`);
console.log(`\nTop 5: ${sorted.slice(0, 5).map(s => `${s.storeName}(${s.uniqueProducts})`).join(', ')}`);
console.log(`Bottom 5: ${sorted.slice(-5).map(s => `${s.storeName}(${s.uniqueProducts})`).join(', ')}`);
process.exit(0);
