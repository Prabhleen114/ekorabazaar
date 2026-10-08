const fs = require('fs');

// Fix checkout inputs
let checkoutFile = 'src/app/checkout/page.tsx';
let c = fs.readFileSync(checkoutFile, 'utf8');
c = c.split('<label className="text-sm font-medium mb-1 block">Phone Number</label><input required').join('<label className="text-sm font-medium mb-1 block">Phone Number</label><input type="tel" inputMode="numeric" pattern="[0-9]*" required');
c = c.split('<label className="text-sm font-medium mb-1 block">Pincode</label><input required').join('<label className="text-sm font-medium mb-1 block">Pincode</label><input type="tel" inputMode="numeric" pattern="[0-9]*" required');
fs.writeFileSync(checkoutFile, c, 'utf8');

// Fix QuickAddButton nesting
['src/app/page.tsx', 'src/app/shop/ShopClient.tsx'].forEach(f => {
    let content = fs.readFileSync(f, 'utf8');
    // We already wrapped it maybe, let's just make sure
    if (!content.includes('<object><QuickAddButton')) {
        content = content.split('<QuickAddButton').join('<object><QuickAddButton');
        content = content.split('category={p.category} />').join('category={p.category} /></object>');
        content = content.split('category={product.category} />').join('category={product.category} /></object>');
        fs.writeFileSync(f, content, 'utf8');
    }
});
console.log('Done!');
