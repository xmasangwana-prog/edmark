console.log("?? Hlasela Wellness Store Loaded!");

let products = [];
let cart = JSON.parse(localStorage.getItem('hlCart') || '[]');
let orders = JSON.parse(localStorage.getItem('hlOrders') || '[]');
const phone = "27834143083";

// Performance and UX enhancements
function initializeEnhancements() {
    // Add fade-in animations to elements
    observeElements();
    
    // Initialize scroll to top button
    initScrollToTop();
    
    // Initialize reading progress bar
    initReadingProgress();
    
    // Optimize images with lazy loading
    initLazyLoading();
    
    // Add smooth scroll behavior
    initSmoothScroll();
}

// Intersection Observer for fade-in animations
function observeElements() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('fade-in');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);
    
    // Observe cards and sections
    document.querySelectorAll('.card, .testimonial-card, .case-study-card').forEach(el => {
        observer.observe(el);
    });
}

// Scroll to top functionality
function initScrollToTop() {
    const scrollButton = document.getElementById('scrollToTop');
    if (!scrollButton) return;
    
    window.addEventListener('scroll', () => {
        if (window.pageYOffset > 300) {
            scrollButton.classList.add('visible');
        } else {
            scrollButton.classList.remove('visible');
        }
    });
}

function scrollToTop() {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}

// Reading progress bar
function initReadingProgress() {
    const progressBar = document.getElementById('readingProgress');
    if (!progressBar) return;
    
    window.addEventListener('scroll', () => {
        const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
        const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
        const scrolled = (winScroll / height) * 100;
        progressBar.style.width = scrolled + '%';
    });
}

// Lazy loading for images
function initLazyLoading() {
    const imageOptions = {
        threshold: 0.1,
        rootMargin: '50px'
    };
    
    const imageObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src || img.src;
                img.classList.add('loaded');
                imageObserver.unobserve(img);
            }
        });
    }, imageOptions);
    
    // Observe all images
    document.querySelectorAll('img').forEach(img => {
        if (!img.complete) {
            img.setAttribute('loading', 'lazy');
            imageObserver.observe(img);
        }
    });
}

// Smooth scroll for anchor links
function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

// Enhanced toast notifications
function toast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    
    if (type === 'error') {
        toast.style.background = '#ef4444';
    } else if (type === 'warning') {
        toast.style.background = '#f59e0b';
    }
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => {
            document.body.removeChild(toast);
        }, 300);
    }, 3000);
}

// Performance monitoring
function measurePerformance() {
    if ('performance' in window) {
        window.addEventListener('load', () => {
            setTimeout(() => {
                const perfData = performance.getEntriesByType('navigation')[0];
                console.log('Page load time:', perfData.loadEventEnd - perfData.fetchStart, 'ms');
            }, 0);
        });
    }
}

// Initialize everything when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    initializeEnhancements();
    measurePerformance();
});

// Enhanced carousel functionality with endless wheel effect
let currentSlide = 0;
let productsPerSlide = 3;
let isAnimating = false;
let autoplayInterval;
let touchStartX = 0;
let touchEndX = 0;
let clonedProducts = [];

function initCarousel() {
    createEndlessCarousel();
    updateCarousel();
    updateIndicators();
    startAutoplay();
    initTouchGestures();
}

function createEndlessCarousel() {
    const container = document.getElementById('productGrid');
    if (!container || products.length === 0) return;
    
    // Clone products for endless effect
    const productHTML = products.map(product => `
        <div class="card" onclick="openProductModal(${product.id})">
            <img src="${product.image}" alt="${product.name}" loading="lazy">
            <h3>${product.name}</h3>
            <p>${product.description}</p>
            <p class="price">R${product.price}</p>
            <button class="btn-primary" onclick="event.stopPropagation(); addToCart(${product.id})">Add to Cart</button>
        </div>
    `).join('');
    
    // Create enough clones for smooth endless scrolling
    const clonesNeeded = Math.ceil(window.innerWidth / 300) + 2;
    let endlessHTML = '';
    
    for (let i = 0; i < clonesNeeded; i++) {
        endlessHTML += productHTML;
    }
    
    container.innerHTML = endlessHTML;
    
    // Store cloned elements for reference
    clonedProducts = container.querySelectorAll('.card');
}

function moveCarousel(direction) {
    if (isAnimating) return;
    
    const container = document.getElementById('productGrid');
    const cardWidth = 312; // card width + gap (280 + 32)
    const totalWidth = clonedProducts.length * cardWidth;
    const viewportWidth = container.parentElement.offsetWidth;
    
    currentSlide += direction;
    
    // Calculate new position
    let newPosition = -currentSlide * cardWidth;
    
    // Handle endless wrapping
    if (newPosition < -totalWidth + viewportWidth) {
        // Wrap to beginning
        newPosition = -(currentSlide % products.length) * cardWidth;
        currentSlide = Math.floor(currentSlide / products.length);
    } else if (newPosition > 0) {
        // Wrap to end
        const maxSlide = Math.floor(totalWidth / cardWidth) - Math.ceil(viewportWidth / cardWidth);
        newPosition = -maxSlide * cardWidth;
        currentSlide = maxSlide;
    }
    
    updateCarouselPosition(newPosition);
    updateIndicators();
    resetAutoplay();
}

function updateCarouselPosition(position) {
    if (isAnimating) return;
    
    const container = document.getElementById('productGrid');
    
    isAnimating = true;
    container.style.transform = `translateX(${position}px)`;
    
    // Remove animation class after transition completes
    setTimeout(() => {
        isAnimating = false;
    }, 500);
}

function updateCarousel() {
    const container = document.getElementById('productGrid');
    const cardWidth = 312; // card width + gap
    const viewportWidth = container.parentElement.offsetWidth;
    
    // Center the carousel initially
    const centerOffset = (viewportWidth - (productsPerSlide * cardWidth)) / 2;
    const initialPosition = -centerOffset;
    
    updateCarouselPosition(initialPosition);
}

function updateIndicators() {
    const indicatorsContainer = document.getElementById('carouselIndicators');
    const totalSlides = products.length;
    
    // Clear existing indicators
    indicatorsContainer.innerHTML = '';
    
    // Create indicators for original products only
    for (let i = 0; i < totalSlides; i++) {
        const dot = document.createElement('button');
        dot.className = 'carousel-dot';
        
        // Calculate which product is currently in center
        const centerIndex = Math.abs(currentSlide) % products.length;
        if (i === centerIndex) {
            dot.classList.add('active');
        }
        
        dot.setAttribute('aria-label', `Go to product ${i + 1}`);
        dot.onclick = () => goToProduct(i);
        indicatorsContainer.appendChild(dot);
    }
}

function goToProduct(productIndex) {
    if (isAnimating) return;
    
    const container = document.getElementById('productGrid');
    const cardWidth = 312;
    const viewportWidth = container.parentElement.offsetWidth;
    const centerOffset = (viewportWidth - cardWidth) / 2;
    
    // Calculate position to center the selected product
    const targetPosition = -(productIndex * cardWidth) + centerOffset;
    
    currentSlide = productIndex;
    updateCarouselPosition(targetPosition);
    updateIndicators();
    resetAutoplay();
}

function startAutoplay() {
    // Only autoplay on desktop
    if (window.innerWidth > 768) {
        autoplayInterval = setInterval(() => {
            moveCarousel(1);
        }, 4000); // Change slide every 4 seconds
    }
}

function stopAutoplay() {
    if (autoplayInterval) {
        clearInterval(autoplayInterval);
        autoplayInterval = null;
    }
}

function resetAutoplay() {
    stopAutoplay();
    startAutoplay();
}

function initTouchGestures() {
    const container = document.getElementById('productGrid');
    
    // Touch events for mobile swipe
    container.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
        stopAutoplay();
    }, { passive: true });
    
    container.addEventListener('touchend', (e) => {
        touchEndX = e.changedTouches[0].screenX;
        handleSwipe();
        startAutoplay();
    }, { passive: true });
    
    // Mouse events for desktop drag
    let mouseDown = false;
    let startX = 0;
    
    container.addEventListener('mousedown', (e) => {
        mouseDown = true;
        startX = e.screenX;
        stopAutoplay();
        container.style.cursor = 'grabbing';
    });
    
    container.addEventListener('mouseup', (e) => {
        if (!mouseDown) return;
        mouseDown = false;
        const endX = e.screenX;
        handleDrag(startX, endX);
        startAutoplay();
        container.style.cursor = 'grab';
    });
    
    container.addEventListener('mouseleave', () => {
        if (mouseDown) {
            mouseDown = false;
            container.style.cursor = 'grab';
            startAutoplay();
        }
    });
}

function handleSwipe() {
    const swipeThreshold = 50;
    const diff = touchStartX - touchEndX;
    
    if (Math.abs(diff) > swipeThreshold) {
        if (diff > 0) {
            moveCarousel(1); // Swipe left, go to next
        } else {
            moveCarousel(-1); // Swipe right, go to previous
        }
    }
}

function handleDrag(startX, endX) {
    const dragThreshold = 30;
    const diff = startX - endX;
    
    if (Math.abs(diff) > dragThreshold) {
        if (diff > 0) {
            moveCarousel(1); // Drag left, go to next
        } else {
            moveCarousel(-1); // Drag right, go to previous
        }
    }
}

function updateProductsPerSlide() {
    const width = window.innerWidth;
    if (width <= 480) {
        productsPerSlide = 1;
    } else if (width <= 768) {
        productsPerSlide = 2;
    } else {
        productsPerSlide = 3;
    }
}

// Update carousel on window resize
window.addEventListener('resize', () => {
    updateProductsPerSlide();
    createEndlessCarousel();
    updateCarousel();
    updateIndicators();
    resetAutoplay();
});

function renderProducts() {
    // Initialize carousel after products are loaded
    if (products.length > 0) {
        updateProductsPerSlide();
        initCarousel();
    }
}

// Enhanced product rendering for carousel
async function fetchProducts() {
    try {
        const res = await fetch('products.json');
        products = await res.json();
    } catch (err) {
        console.error('Could not load products.json', err);
        products = [
            { id: 1, name: "Cafe'73 Ginseng Coffee", description: "Boost energy and wellness", price: 150, image: "cafe73.png", details: "Instant coffee with ginseng and ganoderma extract." },
            { id: 2, name: "Splina", description: "Daily nutrition supplement", price: 200, image: "splina.png", details: "Liquid chlorophyll formula for daily health." },
            { id: 3, name: "Shake Off", description: "Immune system boost", price: 250, image: "shake.png", details: "Phyto fiber drink for digestion and detox." },
            { id: 4, name: "Spiro", description: "Energy & metabolism", price: 180, image: "spiro.png", details: "Spirulina cereal mix for stamina." }
        ];
    }
    renderProducts();
}

function openProductModal(id) {
    const product = products.find(p => p.id === id);
    if (!product) return;
    const modal = document.getElementById('productModal');
    const content = modal.querySelector('.modal-content');
    content.innerHTML = `
        <button class="modal-close" onclick="closeProductModal()" aria-label="Close modal">&times;</button>
        <h3 id="modal-title">${product.name}</h3>
        <img src="${product.image}" alt="${product.name}" loading="lazy" style="width:100%;border-radius:8px;margin:12px 0;">
        <p>${product.details || product.description}</p>
        <p class="price">R${product.price}</p>
        <div style="display:flex; gap: 8px; margin-top: 12px;">
            <button class="btn-primary" onclick="addToCart(${product.id});closeProductModal();" aria-label="Add ${product.name} to cart">Add to Cart</button>
            <button class="btn-primary" onclick="singleWhatsAppOrder(${product.id});closeProductModal();" aria-label="Order ${product.name} via WhatsApp">Order via WhatsApp</button>
        </div>
    `;
    modal.style.display = 'flex';
    
    // Focus management for accessibility
    setTimeout(() => {
        const closeButton = modal.querySelector('.modal-close');
        if (closeButton) closeButton.focus();
    }, 100);
}

function closeProductModal() {
    document.getElementById('productModal').style.display = 'none';
}

function clearCart() {
    cart = [];
    saveState();
    toast('Cart cleared');
}

function payfastCheckout() {
    if (cart.length === 0) return;
    const total = cart.reduce((sum, item) => sum + item.price, 0);
    const itemNames = cart.map(i => i.name).join(', ');
    const merchantId = '10000100';
    const merchantKey = '46f0cd694581a';

    const pfData = {
        merchant_id: merchantId,
        merchant_key: merchantKey,
        amount: total,
        item_name: `Hlasela Order: ${itemNames}`,
        return_url: window.location.href,
        cancel_url: window.location.href,
        notify_url: `${window.location.origin}/payfast-notify`
    };

    const dataString = Object.keys(pfData).sort().map(k => `${k}=${encodeURIComponent(pfData[k])}`).join('&');
    const paymentUrl = `https://sandbox.payfast.co.za/eng/process?${dataString}`;

    window.open(paymentUrl, '_blank');

    orders.unshift({ id: Date.now(), items: itemNames, status: 'Pending', amount: total, gateway: 'PayFast' });
    cart = [];
    saveState();
}

function serverSubmitOrder() {
    if (cart.length === 0) return;
    toast('API order method is not configured in rollback state.');
}

function saveState() {
    localStorage.setItem('hlCart', JSON.stringify(cart));
    localStorage.setItem('hlOrders', JSON.stringify(orders));
    renderMiniCart();
    renderOrders();
    renderCartPanel();
}

function renderProducts() {
    const grid = document.getElementById('productGrid');
    if (!grid) return;
    grid.innerHTML = products.map(p => `
        <div class="card">
            <img src="${p.image}" alt="${p.name}">
            <h3>${p.name}</h3>
            <p>${p.description}</p>
            <p class="price">R${p.price}</p>
            <button class="btn-whatsapp" onclick="addToCart(${p.id})">Add to Cart</button>
            <button class="btn-whatsapp" onclick="singleWhatsAppOrder(${p.id})">Order via WhatsApp</button>
        </div>
    `).join('');
}

function renderMiniCart() {
    const mini = document.getElementById('miniCart');
    if (!mini) return;

    const total = cart.reduce((sum, item) => sum + item.price, 0);

    mini.innerHTML = `
        <div class="mini-cart-inner">
            <span>Cart (${cart.length}) - R${total}</span>
            <div class="mini-cart-actions">
                <button class="btn-secondary" ${cart.length === 0 ? 'disabled' : ''} onclick="clearCart()">Clear</button>
                <button class="btn-primary" ${cart.length === 0 ? 'disabled' : ''} onclick="checkout()">WhatsApp</button>
                <button class="btn-primary" ${cart.length === 0 ? 'disabled' : ''} onclick="payfastCheckout()">PayFast</button>
                <button class="btn-primary" ${cart.length === 0 ? 'disabled' : ''} onclick="serverSubmitOrder()">Backend API</button>
            </div>
        </div>
    `;
}

function renderCartPanel() {
    const cartItems = document.getElementById('cartItems');
    const totalEl = document.getElementById('cartTotal');
    const checkoutButton = document.getElementById('checkoutButton');
    const total = cart.reduce((sum, item) => sum + item.price, 0);

    if (!cartItems) return;

    if (cart.length === 0) {
        cartItems.innerHTML = '<p>Your cart is empty</p>';
        if (totalEl) totalEl.textContent = '0';
        if (checkoutButton) checkoutButton.disabled = true;
        return;
    }

    cartItems.innerHTML = cart.map((item, index) => `
        <div class="cart-item">
            <span>${item.name} - R${item.price}</span>
            <button class="btn-secondary" onclick="removeFromCart(${index})">Remove</button>
        </div>
    `).join('');

    if (totalEl) totalEl.textContent = total;
    if (checkoutButton) {
        checkoutButton.disabled = false;
        checkoutButton.onclick = checkout;
    }
}

function renderOrders() {
    const ordersList = document.getElementById('ordersList');
    if (!ordersList) return;
    if (orders.length === 0) {
        ordersList.innerHTML = '<p>No orders yet</p>';
        return;
    }
    ordersList.innerHTML = orders.map(order => `
        <div class="order-card">
            <p><strong>Order ID:</strong> ${order.id}</p>
            <p><strong>Items:</strong> ${order.items}</p>
            <p><strong>Status:</strong> ${order.status}</p>
        </div>
    `).join('');
}

function addToCart(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    cart.push(product);
    saveState();
    toast('Added to cart: ' + product.name);
}

function removeFromCart(index) {
    cart.splice(index, 1);
    saveState();
}

function singleWhatsAppOrder(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    const message = `Hello! I want to order: ${product.name} (R${product.price}).`;
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`);
    orders.unshift({ id: Date.now(), items: product.name, status: 'Pending' });
    saveState();
}

function checkout() {
    if (cart.length === 0) return;
    const itemNames = cart.map(i => i.name).join(', ');
    const total = cart.reduce((sum, item) => sum + item.price, 0);
    const message = `Hello! I want to place an order for: ${itemNames}. Total: R${total}. Please confirm.`;
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`);
    orders.unshift({ id: Date.now(), items: itemNames, status: 'Pending' });
    cart = [];
    saveState();
}

function autoUpdateOrderStatus() {
    let updated = false;
    orders = orders.map(order => {
        if (order.status === 'Pending') {
            updated = true;
            return { ...order, status: 'Confirmed' };
        }
        if (order.status === 'Confirmed') {
            updated = true;
            return { ...order, status: 'Shipped' };
        }
        if (order.status === 'Shipped') {
            updated = true;
            return { ...order, status: 'Delivered' };
        }
        return order;
    });
    if (updated) {
        saveState();
    }
}

function toast(text) {
    const toastEl = document.createElement('div');
    toastEl.className = 'toast';
    toastEl.textContent = text;
    document.body.appendChild(toastEl);
    setTimeout(() => toastEl.remove(), 2200);
}

window.addEventListener('scroll', () => {
    const header = document.querySelector('header');
    if (!header) return;
    header.classList.remove('header-scrolled');
    document.body.classList.remove('header-scrolled');
});

window.addEventListener('load', async () => {
    await fetchProducts();
    renderProducts();
    renderMiniCart();
    renderCartPanel();
    renderOrders();

    // Ensure header classes are correct for initial scroll position.
    if (window.scrollY > 40) {
        document.querySelector('header')?.classList.add('header-scrolled');
        document.body.classList.add('header-scrolled');
    } else {
        document.querySelector('header')?.classList.remove('header-scrolled');
        document.body.classList.remove('header-scrolled');
    }

    // Dev-mode debug:
    const DEV_DEBUG_SCROLL = true; // set false in production
    if (DEV_DEBUG_SCROLL) {
        console.debug('dev: window.scrollY', window.scrollY);
        console.debug('dev: header class list', document.querySelector('header')?.className);
        console.debug('dev: body class list', document.body.className);
        console.debug('dev: body padding-top', getComputedStyle(document.body).paddingTop);
    }

    setInterval(autoUpdateOrderStatus, 6000);
});
