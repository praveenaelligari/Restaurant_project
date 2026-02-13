// Enhanced Cart & Restaurant Management System
class RestaurantApp {
    constructor() {
        this.cart = JSON.parse(localStorage.getItem('gourmetCart')) || [];
        this.originalCards = Array.from(document.querySelectorAll('.res-card'));
        this.currentCoupon = null;
        this.theme = localStorage.getItem('gourmetTheme') || 'light';
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.updateCartUI();
        this.syncAllMenuButtons();
        this.applyTheme();
        this.handleLoader();
    }

    handleLoader() {
        const loader = document.getElementById('loading-screen');
        if (loader) {
            const hideLoader = () => {
                loader.classList.add('fade-out');
                setTimeout(() => {
                    loader.style.display = 'none';
                    if (loader.parentNode) loader.remove();
                    // Force stop browser loading spinner in the tab
                    window.stop();
                }, 400);
            };

            // Don't wait for images, just show the app when scripts are ready
            setTimeout(hideLoader, 200);

            if (document.readyState === 'interactive' || document.readyState === 'complete') {
                hideLoader();
            }
        }
    }

    setupEventListeners() {
        // Restaurant card clicks - close cart and open menu
        document.querySelectorAll('.res-card').forEach(card => {
            card.addEventListener('click', (e) => {
                e.preventDefault(); // Prevent label default behavior
                e.stopPropagation();

                // Close cart first
                const cartToggle = document.getElementById('cart-toggle');
                if (cartToggle) cartToggle.checked = false;

                // Get menu ID from data attribute or for attribute
                let menuId = card.getAttribute('data-menu');
                if (!menuId && card.tagName === 'LABEL') {
                    menuId = card.getAttribute('for');
                }

                // Open corresponding menu
                if (menuId) {
                    setTimeout(() => {
                        const menuToggle = document.getElementById(menuId);
                        if (menuToggle) menuToggle.checked = true;
                    }, 150);
                }
            });
        });

        // Add to cart buttons
        document.addEventListener('click', (e) => {
            if (e.target.closest('.add-btn')) {
                e.stopPropagation();
                this.handleAddToCart(e.target.closest('.add-btn'));
            }
            if (e.target.closest('.qty-increment')) {
                e.stopPropagation();
                this.handleIncrement(e.target.closest('.qty-increment'));
            }
            if (e.target.closest('.qty-decrement')) {
                e.stopPropagation();
                this.handleDecrement(e.target.closest('.qty-decrement'));
            }
        });

        // Checkout
        const checkoutBtn = document.querySelector('.checkout-btn');
        if (checkoutBtn) {
            checkoutBtn.addEventListener('click', () => this.proceedToCheckout());
        }

        // Filter buttons
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', () => this.handleFilter(btn));
        });

        // Theme Toggle
        const themeCheckbox = document.getElementById('theme-checkbox');
        if (themeCheckbox) {
            themeCheckbox.checked = this.theme === 'dark';
            themeCheckbox.addEventListener('change', () => this.toggleTheme());
        }

        // Dropdown Click Toggle
        const sortBtn = document.querySelector('.sort-btn');
        const sortDropdown = document.querySelector('.sort-dropdown');
        if (sortBtn && sortDropdown) {
            sortBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                sortDropdown.classList.toggle('active');
            });
        }

        // Close dropdown/cart on outside click
        document.addEventListener('click', (e) => {
            // Close dropdown if clicked outside
            if (sortDropdown && !sortDropdown.contains(e.target)) {
                sortDropdown.classList.remove('active');
            }

            // Close cart if clicked on main content or header (not on cart itself or its toggle)
            const cartPanel = document.querySelector('.cart-panel');
            const cartIcon = document.querySelector('.cart-icon');
            const cartToggle = document.getElementById('cart-toggle');

            if (cartPanel && !cartPanel.contains(e.target) &&
                cartIcon && !cartIcon.contains(e.target) &&
                e.target.id !== 'cart-toggle') {
                if (cartToggle) cartToggle.checked = false;
            }
        });
    }

    handleAddToCart(button) {
        const menuItem = button.closest('.menu-item');
        const itemName = menuItem.querySelector('.item-name').textContent.trim();
        const itemPrice = menuItem.querySelector('.item-price').textContent.trim();
        const itemImg = menuItem.querySelector('.item-img').src;

        const existingItem = this.cart.find(item => item.name === itemName);

        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            this.cart.push({
                name: itemName,
                price: itemPrice,
                image: itemImg,
                quantity: 1,
                id: Date.now()
            });
        }

        this.saveCart();
        this.updateCartUI();
        this.updateMenuButton(button.closest('.item-img-container'), itemName);
        this.showToast('Added to cart! 🎉');
    }

    handleIncrement(button) {
        const menuItem = button.closest('.menu-item');
        const itemName = menuItem.querySelector('.item-name').textContent.trim();
        const item = this.cart.find(item => item.name === itemName);

        if (item) {
            item.quantity += 1;
            this.saveCart();
            this.updateCartUI();
            this.updateMenuButton(button.closest('.item-img-container'), itemName);
        }
    }

    handleDecrement(button) {
        const menuItem = button.closest('.menu-item');
        const itemName = menuItem.querySelector('.item-name').textContent.trim();
        const itemIndex = this.cart.findIndex(item => item.name === itemName);

        if (itemIndex > -1) {
            if (this.cart[itemIndex].quantity > 1) {
                this.cart[itemIndex].quantity -= 1;
            } else {
                this.cart.splice(itemIndex, 1);
            }
            this.saveCart();
            this.updateCartUI();
            this.updateMenuButton(button.closest('.item-img-container'), itemName);
        }
    }

    updateMenuButton(container, itemName) {
        const item = this.cart.find(item => item.name === itemName);
        const img = container.querySelector('img');
        const imgSrc = img ? img.src : '';

        if (item && item.quantity > 0) {
            container.innerHTML = `
                <img src="${imgSrc}" class="item-img" alt="${itemName}" onerror="this.src='https://via.placeholder.com/140x120?text=Food'">
                <div class="qty-controls">
                    <button class="qty-decrement">−</button>
                    <span class="qty-display">${item.quantity}</span>
                    <button class="qty-increment">+</button>
                </div>
            `;
        } else {
            container.innerHTML = `
                <img src="${imgSrc}" class="item-img" alt="${itemName}" onerror="this.src='https://via.placeholder.com/140x120?text=Food'">
                <button class="add-btn">ADD</button>
            `;
        }
    }

    syncAllMenuButtons() {
        setTimeout(() => {
            document.querySelectorAll('.menu-item').forEach(menuItem => {
                const itemName = menuItem.querySelector('.item-name')?.textContent.trim();
                if (!itemName) return;

                const container = menuItem.querySelector('.item-img-container');
                if (container) {
                    this.updateMenuButton(container, itemName);
                }
            });
        }, 100);
    }

    removeFromCart(itemId) {
        this.cart = this.cart.filter(item => item.id !== itemId);
        this.saveCart();
        this.updateCartUI();
        this.syncAllMenuButtons();
        this.showToast('Item removed');
    }

    updateQuantityInCart(itemId, change) {
        const item = this.cart.find(item => item.id === itemId);
        if (item) {
            item.quantity += change;
            if (item.quantity <= 0) {
                this.removeFromCart(itemId);
            } else {
                this.saveCart();
                this.updateCartUI();
                this.syncAllMenuButtons();
            }
        }
    }

    saveCart() {
        localStorage.setItem('gourmetCart', JSON.stringify(this.cart));
    }

    getSubtotal() {
        return this.cart.reduce((sum, item) => {
            const price = parseInt(item.price.replace(/[^0-9]/g, ''));
            return sum + (price * item.quantity);
        }, 0);
    }

    getCouponDiscount() {
        if (!this.currentCoupon) return 0;
        const subtotal = this.getSubtotal();
        if (this.currentCoupon.type === 'percent') {
            return Math.floor(subtotal * this.currentCoupon.value);
        } else {
            return this.currentCoupon.value;
        }
    }

    getTotal() {
        const subtotal = this.getSubtotal();
        const discount = this.getCouponDiscount();
        const deliveryCharge = (this.currentCoupon && this.currentCoupon.target === 'delivery') ? 0 : 40;
        return subtotal - discount + deliveryCharge + 5;
    }

    updateCartUI() {
        const cartItemsContainer = document.querySelector('.cart-items');
        const cartCount = document.querySelector('.cart-count');
        const emptyMsg = document.querySelector('.empty-cart-msg');
        const checkoutBtn = document.querySelector('.checkout-btn');
        const couponSection = document.getElementById('coupon-section');

        const totalItems = this.cart.reduce((sum, item) => sum + item.quantity, 0);

        if (cartCount) {
            cartCount.textContent = totalItems;
            cartCount.style.display = totalItems > 0 ? 'flex' : 'none';
        }

        if (!cartItemsContainer) return;

        if (this.cart.length === 0) {
            if (emptyMsg) emptyMsg.style.display = 'block';
            if (checkoutBtn) checkoutBtn.style.display = 'none';
            if (couponSection) couponSection.style.display = 'none';
            this.currentCoupon = null;
            return;
        }

        if (emptyMsg) emptyMsg.style.display = 'none';
        if (checkoutBtn) checkoutBtn.style.display = 'block';
        if (couponSection) couponSection.style.display = 'block';

        const discount = this.getCouponDiscount();
        const deliveryCharge = (this.currentCoupon && this.currentCoupon.target === 'delivery') ? 0 : 40;

        const availableOffers = [
            { code: 'FIRST50', title: '50% OFF', desc: 'On first order' },
            { code: 'SAVE100', title: '₹100 OFF', desc: 'Above ₹499' },
            { code: 'FREEDEL', title: 'FREE DEL', desc: 'Above ₹199' }
        ];

        cartItemsContainer.innerHTML = `
            ${this.cart.map(item => `
                <div class="cart-item">
                    <img src="${item.image}" alt="${item.name}" class="cart-item-img" onerror="this.src='https://via.placeholder.com/70?text=Food'">
                    <div class="cart-item-details">
                        <div class="cart-item-name">${item.name}</div>
                        <div class="cart-item-price">${item.price}</div>
                        <div class="cart-item-controls">
                            <button class="qty-btn" onclick="app.updateQuantityInCart(${item.id}, -1)">
                                <i class="fas fa-minus"></i>
                            </button>
                            <span class="qty">${item.quantity}</span>
                            <button class="qty-btn" onclick="app.updateQuantityInCart(${item.id}, 1)">
                                <i class="fas fa-plus"></i>
                            </button>
                        </div>
                    </div>
                    <button class="remove-item" onclick="app.removeFromCart(${item.id})" title="Remove">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </div>
            `).join('')}

            <div class="available-offers-section" style="padding: 20px 0; border-top: 1px dashed #ddd; margin-top: 20px;">
                <h4 style="font-size: 14px; margin-bottom: 12px; color: var(--text-main);">Available Offers</h4>
                <div class="offers-scroll" style="display: flex; gap: 10px; overflow-x: auto; padding-bottom: 10px;">
                    ${availableOffers.map(offer => `
                        <div class="mini-offer-card" onclick="app.applyCoupon('${offer.code}')" style="min-width: 140px; background: ${this.currentCoupon?.code === offer.code ? 'var(--primary-light)' : 'var(--bg-body)'}; border: 1px solid ${this.currentCoupon?.code === offer.code ? 'var(--primary)' : 'var(--border-color)'}; padding: 10px; border-radius: 12px; cursor: pointer; transition: 0.2s;">
                            <div style="font-weight: 800; color: var(--primary); font-size: 12px;">${offer.title}</div>
                            <div style="font-size: 10px; color: var(--text-muted);">${offer.desc}</div>
                            <div style="font-weight: 700; color: ${this.currentCoupon?.code === offer.code ? '#60b246' : 'var(--text-main)'}; font-size: 11px; margin-top: 5px;">${this.currentCoupon?.code === offer.code ? 'APPLIED' : 'APPLY'}</div>
                        </div>
                    `).join('')}
                </div>
            </div>

            <div class="cart-summary" style="background: var(--bg-body); padding: 20px; border-radius: 15px; margin: 10px 0;">
                <div class="summary-row" style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                    <span style="color: var(--text-muted);">Item Total</span>
                    <span style="color: var(--text-main); font-weight: 600;">₹${this.getSubtotal()}</span>
                </div>
                ${discount > 0 ? `
                <div class="summary-row" style="display: flex; justify-content: space-between; margin-bottom: 8px; color: #60b246; font-weight: 600;">
                    <span>Coupon Discount (${this.currentCoupon.code})</span>
                    <span>- ₹${discount}</span>
                </div>
                ` : ''}
                <div class="summary-row" style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                    <span style="color: var(--text-muted);">Delivery Fee | 3.5 kms</span>
                    <span style="color: var(--text-main); font-weight: 600;">${deliveryCharge === 0 ? '<span style="text-decoration: line-through; color: #999; margin-right: 5px;">₹40</span> <span style="color: #60b246;">FREE</span>' : `₹${deliveryCharge}`}</span>
                </div>
                <div class="summary-row platform-fee" style="display: flex; justify-content: space-between; margin-bottom: 15px; padding-bottom: 15px; border-bottom: 1px dashed #ddd;">
                    <span style="color: var(--text-muted);">Platform Fee</span>
                    <span style="color: var(--text-main); font-weight: 600;">₹5</span>
                </div>
                <div class="summary-row total-row" style="display: flex; justify-content: space-between; font-size: 18px; color: var(--text-main);">
                    <span><strong>TO PAY</strong></span>
                    <span><strong>₹${this.getTotal()}</strong></span>
                </div>
            </div>
        `;
    }

    proceedToCheckout() {
        if (this.cart.length === 0) return;
        const cartToggle = document.getElementById('cart-toggle');
        if (cartToggle) cartToggle.checked = false;
        setTimeout(() => {
            document.getElementById('location-modal').style.display = 'flex';
        }, 300);
    }

    handleFilter(button) {
        const filterType = button.dataset.filter;
        const container = document.querySelector('.restaurant-grid');
        const cards = Array.from(this.originalCards);
        const sortLabel = document.querySelector('.sort-btn');

        // Update active state
        document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');

        // Update dropdown label text (if button is inside dropdown)
        if (sortLabel) {
            sortLabel.innerHTML = `${button.textContent} <i class="fas fa-chevron-down"></i>`;
        }

        let sortedCards = [...cards];

        switch (filterType) {
            case 'relevance':
                sortedCards = [...this.originalCards];
                break;
            case 'rating':
                sortedCards.sort((a, b) => {
                    const ratingA = parseFloat(a.querySelector('.rating').textContent);
                    const ratingB = parseFloat(b.querySelector('.rating').textContent);
                    return ratingB - ratingA;
                });
                break;
            case 'time':
                sortedCards.sort((a, b) => {
                    const timeA = parseInt(a.querySelector('.time').textContent);
                    const timeB = parseInt(b.querySelector('.time').textContent);
                    return timeA - timeB;
                });
                break;
            case 'cost-low':
                sortedCards.sort((a, b) => {
                    const costA = parseInt(a.querySelector('.cost').textContent.match(/\d+/)[0]);
                    const costB = parseInt(b.querySelector('.cost').textContent.match(/\d+/)[0]);
                    return costA - costB;
                });
                break;
            case 'cost-high':
                sortedCards.sort((a, b) => {
                    const costA = parseInt(a.querySelector('.cost').textContent.match(/\d+/)[0]);
                    const costB = parseInt(b.querySelector('.cost').textContent.match(/\d+/)[0]);
                    return costB - costA;
                });
                break;
        }

        container.innerHTML = '';
        sortedCards.forEach(card => container.appendChild(card));

        // Update restaurant count
        const countText = document.getElementById('res-count-text');
        if (countText) {
            const visibleCount = sortedCards.filter(c => c.style.display !== 'none').length;
            countText.textContent = `${visibleCount} Restaurants matched`;
        }
    }

    applyTheme() {
        if (this.theme === 'dark') {
            document.body.classList.add('dark-theme');
        } else {
            document.body.classList.remove('dark-theme');
        }
    }

    toggleTheme() {
        this.theme = this.theme === 'light' ? 'dark' : 'light';
        localStorage.setItem('gourmetTheme', this.theme);
        this.applyTheme();
    }

    applyCoupon(specificCode = null) {
        const input = document.getElementById('coupon-input');
        const msg = document.getElementById('applied-coupon-msg');
        if (!input || !msg) return;

        const code = specificCode ? specificCode.toUpperCase() : input.value.toUpperCase();

        const offers = {
            'FIRST50': { type: 'percent', value: 0.5, min: 0 },
            'SAVE100': { type: 'flat', value: 100, min: 499 },
            'WEEKEND25': { type: 'percent', value: 0.25, min: 0 },
            'FREEDEL': { type: 'flat', value: 40, min: 199, target: 'delivery' },
            'TRYNEW': { type: 'percent', value: 0.5, min: 0 }
        };

        const subtotal = this.getSubtotal();

        if (offers[code]) {
            const offer = offers[code];
            if (subtotal >= offer.min) {
                this.currentCoupon = { code, ...offer };
                msg.textContent = `Coupon ${code} applied successfully! 🎉`;
                msg.style.color = '#60b246';
                if (!specificCode) input.value = '';
                this.updateCartUI();
                this.showToast('Offer applied!');
            } else {
                msg.textContent = `Minimum order for this coupon is ₹${offer.min}`;
                msg.style.color = '#ff5200';
            }
        } else {
            msg.textContent = "Invalid coupon code!";
            msg.style.color = '#ff5200';
        }
    }

    showToast(message) {
        const existing = document.querySelector('.toast-notification');
        if (existing) existing.remove();

        const toast = document.createElement('div');
        toast.className = 'toast-notification';
        toast.innerHTML = `<i class="fas fa-check-circle"></i> ${message}`;
        document.body.appendChild(toast);

        setTimeout(() => toast.classList.add('show'), 100);
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 2000);
    }
}

// Location Manager
class LocationManager {
    constructor() {
        this.init();
    }

    init() {
        const useLocationBtn = document.getElementById('use-current-location');
        if (useLocationBtn) {
            useLocationBtn.addEventListener('click', () => this.detectLocation());
        }

        const confirmBtn = document.getElementById('confirm-address');
        if (confirmBtn) {
            confirmBtn.addEventListener('click', () => this.confirmAddress());
        }
    }

    detectLocation() {
        const btn = document.getElementById('use-current-location');
        if (!btn) return;
        const originalHTML = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Detecting...';
        btn.disabled = true;

        setTimeout(() => {
            const addresses = [
                '123 MG Road, Bangalore 560001',
                '456 Park Street, Kolkata 700016',
                '789 Brigade Road, Bangalore 560025'
            ];
            document.getElementById('delivery-address').value = addresses[Math.floor(Math.random() * addresses.length)];
            document.getElementById('phone').value = '9876543210';
            btn.innerHTML = originalHTML;
            btn.disabled = false;
            app.showToast('Location detected! 📍');
        }, 1000);
    }

    confirmAddress() {
        const address = document.getElementById('delivery-address').value.trim();
        const phone = document.getElementById('phone').value.trim();

        if (!address || !phone) {
            alert('Please fill all required fields');
            return;
        }

        localStorage.setItem('deliveryLocation', JSON.stringify({ address, phone }));
        document.getElementById('location-modal').style.display = 'none';
        setTimeout(() => {
            document.getElementById('payment-modal').style.display = 'flex';
        }, 300);
    }
}

// Payment Manager
class PaymentManager {
    constructor() {
        this.selectedMethod = null;
        this.init();
    }

    init() {
        document.querySelectorAll('.payment-method').forEach(method => {
            method.addEventListener('click', () => {
                document.querySelectorAll('.payment-method').forEach(m => m.classList.remove('selected'));
                method.classList.add('selected');
                this.selectedMethod = method.dataset.method;
            });
        });

        const placeOrderBtn = document.getElementById('place-order-btn');
        if (placeOrderBtn) {
            placeOrderBtn.addEventListener('click', () => this.placeOrder());
        }
    }

    placeOrder() {
        if (!this.selectedMethod) {
            alert('Please select a payment method');
            return;
        }

        const btn = document.getElementById('place-order-btn');
        if (!btn) return;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
        btn.disabled = true;

        setTimeout(() => {
            const order = {
                id: 'ORD-' + Math.floor(100000 + Math.random() * 900000),
                items: [...app.cart],
                total: app.getTotal(),
                payment: this.selectedMethod,
                date: new Date().toLocaleString()
            };

            const orders = JSON.parse(localStorage.getItem('orders')) || [];
            orders.push(order);
            localStorage.setItem('orders', JSON.stringify(orders));

            app.cart = [];
            app.saveCart();
            app.updateCartUI();
            app.syncAllMenuButtons();

            document.getElementById('payment-modal').style.display = 'none';
            this.showSuccess(order);
            btn.innerHTML = 'Place Order';
            btn.disabled = false;
        }, 2000);
    }

    showSuccess(order) {
        const modal = document.getElementById('success-modal');
        const details = document.getElementById('order-details');
        if (!modal || !details) return;

        details.innerHTML = `
            <div class="success-animation">
                <div class="success-checkmark">
                    <div class="check-icon">
                        <span class="icon-line line-tip"></span>
                        <span class="icon-line line-long"></span>
                        <div class="icon-circle"></div>
                        <div class="icon-fix"></div>
                    </div>
                </div>
            </div>
            <h2>Order Placed Successfully! 🎉</h2>
            <div class="order-info-card">
                <div class="order-id-section">
                    <span class="label">Order ID</span>
                    <span class="value">${order.id}</span>
                </div>
                <div class="order-details-grid">
                    <div class="detail-item">
                        <i class="fas fa-rupee-sign"></i>
                        <div>
                            <span class="label">Total</span>
                            <span class="value">₹${order.total}</span>
                        </div>
                    </div>
                    <div class="detail-item">
                        <i class="fas fa-clock"></i>
                        <div>
                            <span class="label">Arriving</span>
                            <span class="value">30-35 mins</span>
                        </div>
                    </div>
                </div>
                <div class="order-items-section">
                    <h4><i class="fas fa-shopping-bag"></i> Your Order</h4>
                    <div class="order-items-list">
                        ${order.items.map(item => `
                            <div class="success-order-item">
                                <img src="${item.image}" alt="${item.name}" onerror="this.src='https://via.placeholder.com/60?text=Food'">
                                <div class="item-info">
                                    <span class="item-name">${item.name}</span>
                                    <span class="item-qty">Qty: ${item.quantity}</span>
                                </div>
                                <span class="item-price">${item.price}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;

        modal.style.display = 'flex';
    }
}

// Helper Functions
function openHelp() {
    document.getElementById('help-modal').style.display = 'flex';
}

function closeHelp() {
    document.getElementById('help-modal').style.display = 'none';
}

function openOffers() {
    document.getElementById('offers-modal').style.display = 'flex';
}

function closeOffers() {
    document.getElementById('offers-modal').style.display = 'none';
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

function closeSuccessModal() {
    document.getElementById('success-modal').style.display = 'none';
}

function handleSearch() {
    const input = document.querySelector('.search-bar input').value.toLowerCase();
    document.querySelectorAll('.res-card').forEach(card => {
        const name = card.querySelector('.res-name').textContent.toLowerCase();
        const cuisine = card.querySelector('.res-cuisine').textContent.toLowerCase();
        card.style.display = (name.includes(input) || cuisine.includes(input)) ? 'block' : 'none';
    });
}

function toggleMobileMenu() {
    const nav = document.getElementById('nav-mobile');
    const backdrop = document.getElementById('nav-backdrop');
    if (nav) {
        nav.classList.toggle('mobile-active');
        if (backdrop) backdrop.classList.toggle('active');

        // Prevent body scroll when menu is open
        const isActive = nav.classList.contains('mobile-active');
        document.body.style.overflow = isActive ? 'hidden' : 'auto';
    }
}

// Initialize
let app, locationManager, paymentManager;

document.addEventListener('DOMContentLoaded', () => {
    app = new RestaurantApp();
    window.app = app; // Make it globally accessible
    locationManager = new LocationManager();
    paymentManager = new PaymentManager();
    window.paymentManager = paymentManager; // Make it globally accessible

    // Search
    const searchBtn = document.querySelector('.search-bar button');
    const searchInput = document.querySelector('.search-bar input');
    if (searchBtn) searchBtn.addEventListener('click', handleSearch);
    if (searchInput) {
        searchInput.addEventListener('input', handleSearch);
        searchInput.addEventListener('keyup', (e) => {
            if (e.key === 'Enter') handleSearch();
        });
    }

    // Menu toggles - sync with cart state when opening
    document.querySelectorAll('.menu-toggle').forEach(toggle => {
        toggle.addEventListener('change', () => {
            if (toggle.checked) {
                app.syncAllMenuButtons();
                // Close other toggles if necessary, but pure CSS handles it usually
            }
        });
    });
});

function openOrdersPage() {
    const orders = JSON.parse(localStorage.getItem('orders')) || [];
    const ordersList = document.getElementById('orders-list');
    const ordersModal = document.getElementById('orders-modal');

    if (!ordersList || !ordersModal) return;

    if (orders.length === 0) {
        ordersList.innerHTML = `
            <div style="text-align: center; padding: 50px;">
                <i class="fas fa-shopping-bag" style="font-size: 60px; color: #ccc; margin-bottom: 20px;"></i>
                <p style="color: #666; font-size: 18px;">You haven't placed any orders yet.</p>
                <button onclick="closeModal('orders-modal')" style="background: #ff5200; color: white; border: none; padding: 10px 20px; border-radius: 8px; margin-top: 20px; cursor: pointer;">Start Ordering</button>
            </div>
        `;
    } else {
        ordersList.innerHTML = orders.slice().reverse().map(order => `
            <div class="order-history-card" style="background: var(--bg-secondary, #f8f9fa); border-radius: 12px; padding: 20px; margin-bottom: 20px; border: 1px solid var(--border-color, #e0e0e0); animation: fadeIn 0.3s ease;">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 15px; border-bottom: 1px dashed #ccc; padding-bottom: 15px;">
                    <div>
                        <div style="font-weight: 800; font-size: 16px; color: var(--text-color, #1c1c1c); margin-bottom: 5px;">Order ID: ${order.id}</div>
                        <div style="color: #666; font-size: 13px;">${order.date}</div>
                    </div>
                    <div style="background: #e7f5e9; color: #2e7d32; padding: 5px 12px; border-radius: 50px; font-size: 12px; font-weight: 700;">
                        <i class="fas fa-check-circle"></i> Delivered
                    </div>
                </div>
                <div style="margin-bottom: 15px;">
                    ${order.items.map(item => `
                        <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                            <span style="font-size: 14px; color: var(--text-color, #333);">${item.name} <span style="color:#777; font-size:12px;">x${item.quantity}</span></span>
                            <span style="font-size: 14px; color: var(--text-color, #333);">${item.price}</span>
                        </div>
                    `).join('')}
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center; font-weight: 800; border-top: 1px solid #eee; padding-top: 10px; margin-top: 10px;">
                    <span style="color: #666; font-size: 14px;">Bill Total</span>
                    <span style="color: #ff5200; font-size: 18px;">₹${order.total}</span>
                </div>
            </div>
        `).join('');
    }

    ordersModal.style.display = 'flex';
}
