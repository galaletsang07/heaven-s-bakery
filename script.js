(function() {
  
  function showToast(message, duration = 2000) {
    let toast = document.getElementById('cart-toast');
    if (!toast) {
      // create if missing
      toast = document.createElement('div');
      toast.id = 'cart-toast';
      toast.className = 'toast-message';
      document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => {
      toast.classList.remove('show');
    }, duration);
  }

  // ----- Generic add to cart handler -----
  function handleAddToCart(event) {
    const button = event.currentTarget;
    // try to get product info from data attributes
    let name = button.getAttribute('data-name');
    let price = parseFloat(button.getAttribute('data-price'));
    
    // fallback: try to parse from parent product card if needed
    if (!name || isNaN(price)) {
      const card = button.closest('.product-card');
      if (card) {
        const titleEl = card.querySelector('h3');
        const priceEl = card.querySelector('.price');
        if (titleEl) name = titleEl.innerText.trim();
        if (priceEl) {
          const priceMatch = priceEl.innerText.match(/(\d+(?:\.\d+)?)/);
          if (priceMatch) price = parseFloat(priceMatch[1]);
        }
      }
    }
    
    // Check quantity input if it exists inside same card
    let quantity = 1;
    const cardContainer = button.closest('.product-card');
    if (cardContainer) {
      const qtyInput = cardContainer.querySelector('.qty-input');
      if (qtyInput && qtyInput.value) {
        quantity = parseInt(qtyInput.value, 10);
        if (isNaN(quantity) || quantity < 1) quantity = 1;
      }
    }
    
    // size selection if any select exists
    let sizeOption = '';
    const sizeSelect = button.closest('.product-card')?.querySelector('.size-select');
    if (sizeSelect && sizeSelect.value) {
      sizeOption = ` (${sizeSelect.value})`;
    }
    
    if (name && !isNaN(price)) {
      const totalPrice = (price * quantity).toFixed(2);
      showToast(` Added ${quantity} x ${name}${sizeOption} - ₱${totalPrice}`);
    } else {
      showToast(' Could not add item to cart', 1500);
    }
  }

  // ----- Attach listeners to all "Add to Cart" style buttons -----
  function bindCartButtons() {
    // Select all possible buy buttons: .add-to-cart, .add-to-cart-qty, and buttons containing 'BUY NOW' text or similar
    const selectors = ['.add-to-cart', '.add-to-cart-qty', 'button[class*="add-to-cart"]'];
    const buttons = document.querySelectorAll(selectors.join(','));
    buttons.forEach(btn => {
      // avoid duplicate listeners
      if (btn.getAttribute('data-listener') === 'true') return;
      btn.setAttribute('data-listener', 'true');
      btn.addEventListener('click', handleAddToCart);
    });
  }

  // ----- Delivery & Pickup page: show alerts and basic validation -----
  function initDeliveryPickup() {
    const deliveryBtn = document.querySelector('.delivery-order-btn');
    const pickupBtn = document.querySelector('.pickup-order-btn');
    
    if (deliveryBtn) {
      deliveryBtn.addEventListener('click', () => {
        const nameInput = document.querySelector('#deliveryForm input[placeholder*="Jane Doe"]') || 
                          document.querySelector('#deliveryForm input[type="text"]');
        const name = nameInput ? nameInput.value.trim() : '';
        if (!name) {
          showToast('❌ Please enter your full name for delivery', 2000);
          return;
        }
        showToast(' Delivery order placed! We will contact you soon.', 2500);
        // optional: clear form or not
      });
    }
    
    if (pickupBtn) {
      pickupBtn.addEventListener('click', () => {
        const nameField = document.querySelector('#pickupForm input[placeholder*="Full name"]');
        const name = nameField ? nameField.value.trim() : '';
        if (!name) {
          showToast(' Please enter your name for pickup', 2000);
          return;
        }
        showToast(' Pickup order confirmed! Please come during working hours.', 2500);
      });
    }
  }

  // Cart array
let cart = JSON.parse(localStorage.getItem('cart')) || [];

function updateCartCount() {
    const count = cart.reduce((total, item) => total + item.quantity, 0);
    const badge = document.getElementById('cart-count');
    if (badge) badge.textContent = count;
}

function addToCart(name, price) {
    const existing = cart.find(item => item.name === name);
    if (existing) {
        existing.quantity++;
    } else {
        cart.push({ name, price, quantity: 1 });
    }
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();
    showToast(`✓ ${name} added to cart!`, 2000);
}

window.openCart = function() {
    const old = document.getElementById('cart-modal');
    if (old) old.remove();

    const modal = document.createElement('div');
    modal.id = 'cart-modal';

    if (cart.length === 0) {
        modal.innerHTML = `
            <div class="cart-modal-content">
                <div class="cart-modal-header">
                    <h3>🛒 My Cart</h3>
                    <button onclick="closeCart()">✕</button>
                </div>
                <p class="cart-empty">Your cart is empty!</p>
            </div>`;
    } else {
        const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        modal.innerHTML = `
            <div class="cart-modal-content">
                <div class="cart-modal-header">
                    <h3>🛒 My Cart</h3>
                    <button onclick="closeCart()">✕</button>
                </div>
                <div class="cart-items">
                    ${cart.map((item, i) => `
                        <div class="cart-item">
                            <span class="cart-item-name">${item.name}</span>
                            <div class="cart-item-controls">
                                <button onclick="changeQty(${i}, -1)">−</button>
                                <span>${item.quantity}</span>
                                <button onclick="changeQty(${i}, 1)">+</button>
                            </div>
                            <span class="cart-item-price">P ${(item.price * item.quantity).toFixed(2)}</span>
                            <button class="cart-remove" onclick="removeItem(${i})">🗑</button>
                        </div>
                    `).join('')}
                </div>
                <div class="cart-total">
                    <strong>Total: P ${total.toFixed(2)}</strong>
                </div>
                <button class="btn-checkout">Proceed to Checkout</button>
            </div>`;
    }

    document.body.appendChild(modal);
}

window.closeCart = function() {
    const modal = document.getElementById('cart-modal');
    if (modal) modal.remove();
}

window.changeQty = function(index, change) {
    cart[index].quantity += change;
    if (cart[index].quantity <= 0) cart.splice(index, 1);
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();
    openCart();
}

window.removeItem = function(index) {
    cart.splice(index, 1);
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();
    openCart();
}

function bindCartButton() {
    const buttons = document.querySelectorAll('.add-to-cart');
    buttons.forEach(btn => {
        btn.addEventListener('click', () => {
          const name = btn.getAttribute('data-name') || 'Item';
          const price = parseFloat(btn.getAttribute('data-price')) || 0;
          addToCart(name, price);
            openCart();
        });
    });
}

  

  // ----- initial load: bind everything once DOM ready -----
  document.addEventListener('DOMContentLoaded', () => {
    bindCartButtons();
    bindCartButton();
    initDeliveryPickup();
    // initSearchFilter();
    initSizePricing();
    
    // Re-bind for dynamically added content? (optional but safe, no dynamic content needed for these static pages)
    // minor: watch for any future changes but static pages fine.
    // Also handle custom order buttons (if any generic)
    const observer = new MutationObserver(() => {
      bindCartButtons();
    });
    observer.observe(document.body, { childList: true, subtree: true });
  });
// ----- Size dropdown price updater -----
function initSizePricing() {
  document.querySelectorAll('.size-select').forEach(select => {
    select.addEventListener('change', function() {
      const card = this.closest('.product-card') || this.closest('.horizontal-card');
      const priceEl = card.querySelector('.price');
      const button = card.querySelector('.add-to-cart');
      const newPrice = this.value;

      priceEl.textContent = 'P' + parseFloat(newPrice).toFixed(2);
      button.setAttribute('data-price', newPrice);
    });
  });
}

})();