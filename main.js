// ======================================================
// THEME MANAGEMENT (Run this first)
// ======================================================
(function applyInitialTheme() {
    const currentTheme = localStorage.getItem('theme');
    if (currentTheme === 'dark') {
        document.body.classList.add('dark-mode');
    }
})();

// ======================================================
// SCRIPT ENTRY POINT
// ======================================================
document.addEventListener('DOMContentLoaded', () => {
    console.log("Local Ledger App is running!");

    seedInitialData();

    // প্রতিটি পেজের body ট্যাগের id দিয়ে পেজ সনাক্ত করা হয়
    const pageId = document.body.id;

    switch (pageId) {
        case 'home-page':
            renderHomePage();
            setupHomePageEvents();
            break;
        case 'customers-page':
            renderCustomersPage();
            setupCustomerPageEvents();
            break;
        case 'stock-page':
            renderStockPage();
            setupStockPageEvents();
            break;
        case 'customer-profile-page':
            renderCustomerProfilePage();
            setupProfilePageEvents();
            break;
        case 'reports-page':
            renderReportsPage();
            break;
        case 'settings-page':
            setupSettingsPageEvents();
            setupThemeToggle();
            break;
    }
});
// ======================================================
// DATA MANAGEMENT & HELPERS
// ======================================================

/**
 * অ্যাপটি প্রথমবার চালু হলে LocalStorage-এ খালি অ্যারে সেট করে।
 * এতে করে নতুন ব্যবহারকারীদের জন্য কোনো কাল্পনিক ডেটা দেখানো হবে না।
 */
function seedInitialData() {
    if (localStorage.getItem('customers') === null) {
        localStorage.setItem('customers', JSON.stringify([]));
    }
    if (localStorage.getItem('products') === null) {
        localStorage.setItem('products', JSON.stringify([]));
    }
    if (localStorage.getItem('transactions') === null) {
        localStorage.setItem('transactions', JSON.stringify([]));
    }
}

/**
 * LocalStorage থেকে ডেটা পড়ার জন্য Helper ফাংশন।
 * @param {string} key - যে ডেটাটি পেতে চান তার কী (e.g., 'customers')
 * @returns {Array} - পার্স করা ডেটার অ্যারে
 */
function getData(key) {
    const data = localStorage.getItem(key);
    // যদি ডেটা থাকে, তাহলে তাকে parse করে রিটার্ন করো, না থাকলে একটি খালি অ্যারে রিটার্ন করো।
    return data ? JSON.parse(data) : [];
}

/**
 * URL থেকে Query Parameter (e.g., ?id=123) এর ভ্যালু পড়ার জন্য Helper ফাংশন।
 * @param {string} param - যে প্যারামিটারটি খুঁজছেন তার নাম (e.g., 'id')
 * @returns {string|null} - প্যারামিটারের ভ্যালু অথবা null
 */
function getQueryParam(param) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
}
// ======================================================
// PAGE RENDERING LOGIC
// ======================================================
/**
 * হোম পেজের ডাইনামিক ডেটা (Total Due, Total Payment, Recent Transactions) রেন্ডার করে।
 */
function renderHomePage() {
    const customers = getData('customers');
    const transactions = getData('transactions');

    // --- Total Due গণনা (এটি আগের মতোই থাকবে) ---
    let totalDue = 0;
    customers.forEach(customer => {
        if (customer.balance > 0) {
            totalDue += customer.balance;
        }
    });

    // --- Total Payment গণনা (নতুন লজিক) ---
    let totalPayment = 0;
    transactions.forEach(tx => {
        // যদি লেনদেনের ধরন 'Payment' হয়, তাহলে যোগ করো
        if (tx.type === 'Payment') {
            totalPayment += tx.amount;
        }
    });

    // --- HTML এলিমেন্টগুলোকে আপডেট করা ---
    const totalDueEl = document.querySelector('.stat-card .amount.due');
    // "Total Payment"-এর জন্য এলিমেন্টটি ধরা হয়েছে (CSS ক্লাস .advance-ই আছে)
    const totalPaymentEl = document.querySelector('.stat-card .amount.advance');

    // UI-তে ডেটা দেখানো
    totalDueEl.textContent = `$${totalDue.toLocaleString()}`;
    totalPaymentEl.textContent = `$${totalPayment.toLocaleString()}`;

    // --- সাম্প্রতিক লেনদেন রেন্ডার করা (এটি আগের মতোই থাকবে) ---
    const transactionTableBody = document.querySelector('.transaction-table tbody');
    transactionTableBody.innerHTML = '';

    const recentTransactions = transactions.slice(-4).reverse();

    recentTransactions.forEach(tx => {
        const row = `
            <tr>
                <td>${tx.date}</td>
                <td class="transaction-type ${tx.type.toLowerCase()}">${tx.type}</td>
                <td class="amount-col">$${tx.amount.toLocaleString()}</td>
            </tr>
        `;
        transactionTableBody.insertAdjacentHTML('beforeend', row);
    });
}

/**
 * কাস্টমার পেজের ডাইনামিক ডেটা (গ্রাহক তালিকা) রেন্ডার করে।
 */
/**
 * কাস্টমার পেজের ডাইনামিক ডেটা রেন্ডার করে (সার্চ এবং এডিট/ডিলিট আইকনসহ)।
 * @param {string} searchTerm - ঐচ্ছিক, যে শব্দটি দিয়ে তালিকা ফিল্টার করতে হবে।
 */
function renderCustomersPage(searchTerm = '') {
    let allCustomers = getData('customers');
    const customerListContainer = document.querySelector('.customer-list');
    
    // ১. ফিল্টার করার জন্য একটি ভেরিয়েবল তৈরি করা
    let filteredCustomers = allCustomers;

    // যদি সার্চ টার্ম থাকে, তাহলে গ্রাহক তালিকা ফিল্টার করো
    if (searchTerm) {
        const lowerCaseSearchTerm = searchTerm.toLowerCase().trim();
        filteredCustomers = allCustomers.filter(customer => 
            customer.name.toLowerCase().includes(lowerCaseSearchTerm)
        );
    }

    if (!customerListContainer) return;
    customerListContainer.innerHTML = '';

    // ২. ফিল্টার করা তালিকার উপর ভিত্তি করে বার্তা দেখানো
    if (filteredCustomers.length === 0) {
        // যদি সার্চ করার পর কোনো ফলাফল না পাওয়া যায়
        if (searchTerm) {
            customerListContainer.innerHTML = `<p class="empty-message">No customers found for "${searchTerm}"</p>`;
        } 
        // যদি কোনো গ্রাহকই না থাকে
        else {
            customerListContainer.innerHTML = `<p class="empty-message">No customers found. Click the + button to add one.</p>`;
        }
        return;
    }

    // ৩. ফিল্টার করা তালিকাটিই রেন্ডার করা
    filteredCustomers.forEach(customer => {
        let balanceClass = customer.balance > 0 ? 'balance-due' : (customer.balance < 0 ? 'balance-advance' : 'balance-zero');
        let statusText = customer.balance > 0 ? 'Due' : (customer.balance < 0 ? 'Advance' : 'Zero Balance');
        const balanceAmount = Math.abs(customer.balance).toLocaleString();

        // ৪. সঠিক HTML কাঠামো, যেখানে এডিট এবং ডিলিট আইকন আছে
        const customerCardHTML = `
        <a href="customer-profile.html?id=${customer.id}" class="customer-card-link">
            <div class="customer-card">
                <div class="customer-avatar"><i class="fa-solid fa-user"></i></div>
                <div class="customer-info">
                    <p class="name">${customer.name}</p>
                    <p class="status">${statusText}</p>
                </div>
                <div class="customer-balance ${balanceClass}">$${balanceAmount}</div>
            </div>
        </a>
    `;
        customerListContainer.insertAdjacentHTML('beforeend', customerCardHTML);
    });
}
// ======================================================
// ১. renderStockPage (চূড়ান্ত এবং নতুন ডিজাইনের জন্য)
// ======================================================
function renderStockPage(searchTerm = '') {
    let products = getData('products');
    const stockListContainer = document.querySelector('.stock-list');
    const totalCountEl = document.getElementById('stock-total-count');

    if (searchTerm) {
        const lowerCaseSearchTerm = searchTerm.toLowerCase().trim();
        products = products.filter(product => 
            product.name.toLowerCase().includes(lowerCaseSearchTerm) ||
            product.category.toLowerCase().includes(lowerCaseSearchTerm)
        );
    }
    
    if (totalCountEl) totalCountEl.textContent = `Total : ${products.length}`;

    if (!stockListContainer) return;
    stockListContainer.innerHTML = '';

    if (products.length === 0) {
        const message = searchTerm ? `No products found for "${searchTerm}"` : 'No products found. Click + to add one.';
        stockListContainer.innerHTML = `<p class="empty-message">${message}</p>`;
        return;
    }

    products.forEach(p => {
        let quantityClass = p.quantity <= 20 ? 'quantity-low' : 'quantity-ok';
        
        

const stockCardHTML = `
    <div class="product-card-new">
        <div class="product-image">
            <i class="fa-solid fa-box-archive"></i>
        </div>
        <div class="product-details-new">
            <p class="product-name">${p.name}</p>
            <p class="product-price">Sales Price: ${p.sellingPrice.toFixed(2)} Tk</p>
        </div>
        <div class="product-stock-info">
            <p class="stock-label">Stock</p>
            <p class="stock-quantity ${quantityClass}">${p.quantity}</p>
        </div>
        
          <div class="product-actions">
            <i class="fa-solid fa-ellipsis-vertical product-menu-icon" data-id="${p.id}"></i>
            <div class="dropdown-menu product-dropdown">
                <a href="#" class="edit-product-btn" data-id="${p.id}"><i class="fa-solid fa-pen-to-square"></i> Edit</a>
                <a href="#" class="delete-product-btn" data-id="${p.id}"><i class="fa-solid fa-trash"></i> Delete</a>
            </div>
        </div>
    </div>
`;
        stockListContainer.insertAdjacentHTML('beforeend', stockCardHTML);
    });
}

// ======================================================
// ২. setupStockPageEvents (চূড়ান্ত এবং নতুন ডিজাইনের জন্য)
// ======================================================
/**
 * স্টক পেজের জন্য ইভেন্ট লিসেনার সেটআপ করে (এডিট/ডিলিটসহ চূড়ান্ত সংস্করণ)।
 */
function setupStockPageEvents() {
    // ======================================================
    // ধাপ ১: সমস্ত প্রয়োজনীয় এলিমেন্ট ধরা
    // ======================================================
    const searchIcon = document.getElementById('stock-search-icon');
    const searchBar = document.getElementById('stock-search-bar');
    const searchInput = document.getElementById('stock-search-input');
    const closeSearchBtn = document.getElementById('close-stock-search-btn');
    const stockListContainer = document.querySelector('.stock-list');
    const fab = document.querySelector('.fab');
    const modal = document.getElementById('add-product-modal');

    if (!searchIcon || !searchBar || !searchInput || !closeSearchBtn || !stockListContainer || !fab || !modal) {
        return console.error("Required elements for stock page not found.");
    }
    
    const form = document.getElementById('add-product-form');
    const modalTitle = modal.querySelector('.modal-header h2');
    const closeButton = modal.querySelector('.close-button');

    // ======================================================
    // ধাপ ২: সার্চ বারের ইভেন্ট
    // ======================================================
    searchIcon.addEventListener('click', () => {
        searchBar.classList.add('active');
        searchInput.focus();
    });
    closeSearchBtn.addEventListener('click', () => {
        searchBar.classList.remove('active');
        searchInput.value = '';
        renderStockPage();
    });
    searchInput.addEventListener('input', () => {
        renderStockPage(searchInput.value);
    });
    
    // ======================================================
    // ধাপ ৩: Modal খোলা এবং বন্ধ করার ইভেন্ট
    // ======================================================
    fab.addEventListener('click', () => {
        form.reset();
        form.removeAttribute('data-editing-id');
        modalTitle.textContent = 'Add New Product';
        modal.classList.add('show');
    });
    closeButton.addEventListener('click', () => modal.classList.remove('show'));
    

    // ======================================================
    // ধাপ ৪: ৩-ডট মেনু, এডিট এবং ডিলিট ইভেন্ট
    // ======================================================
    stockListContainer.addEventListener('click', (event) => {
        const target = event.target;
        const productId = Number(target.getAttribute('data-id'));

        if (target.matches('.product-menu-icon')) {
            event.stopPropagation();
            const dropdown = target.nextElementSibling;
            document.querySelectorAll('.product-dropdown.show').forEach(d => {
                if(d !== dropdown) d.classList.remove('show');
            });
            dropdown.classList.toggle('show');
        }

        if (target.matches('.delete-product-btn')) {
            event.preventDefault();
            if (confirm('Are you sure you want to delete this product?')) {
                let products = getData('products');
                products = products.filter(p => p.id !== productId);
                localStorage.setItem('products', JSON.stringify(products));
                renderStockPage(searchInput.value);
            }
        }

        if (target.matches('.edit-product-btn')) {
            event.preventDefault();
            const products = getData('products');
            const productToEdit = products.find(p => p.id === productId);
            if (productToEdit) {
                modalTitle.textContent = 'Edit Product';
                form.querySelector('#product-name').value = productToEdit.name;
                form.querySelector('#product-category').value = productToEdit.category;
                form.querySelector('#product-quantity').value = productToEdit.quantity;
                form.querySelector('#product-price').value = productToEdit.sellingPrice;
                form.setAttribute('data-editing-id', productId);
                modal.classList.add('show');
            }
        }
    });

    // ======================================================
    // ধাপ ৫: ফর্ম সাবমিট হ্যান্ডেল করা (Add এবং Edit উভয়ের জন্য)
    // ======================================================
    form.addEventListener('submit', e => {
        e.preventDefault();
        const editingId = Number(form.getAttribute('data-editing-id'));
        let products = getData('products');
        
        const name = form.querySelector('#product-name').value.trim();
        const category = form.querySelector('#product-category').value.trim();
        const quantity = form.querySelector('#product-quantity').value;
        const price = form.querySelector('#product-price').value;

        if (!name || !quantity || !price) return alert('Name, Quantity, and Price are required.');

        if (editingId) { // --- এডিট মোড ---
            const productIndex = products.findIndex(p => p.id === editingId);
            if (productIndex > -1) {
                products[productIndex].name = name;
                products[productIndex].category = category || 'Uncategorized';
                products[productIndex].quantity = Number(quantity);
                products[productIndex].sellingPrice = Number(price);
            }
        } else { // --- অ্যাড মোড ---
            products.push({ id: Date.now(), name, category: category || 'Uncategorized', quantity: Number(quantity), sellingPrice: Number(price), imageUrl: '' });
        }
        
        localStorage.setItem('products', JSON.stringify(products));
        modal.classList.remove('show');
        renderStockPage(searchInput.value);
    });
    
    // ======================================================
    // ধাপ ৬: Body-তে ক্লিক করলে Modal এবং ড্রপডাউন বন্ধ করা
    // ======================================================
    document.body.addEventListener('click', (e) => {
        if (e.target === modal) modal.classList.remove('show');
        if (!e.target.matches('.product-menu-icon')) {
            document.querySelectorAll('.product-dropdown.show').forEach(d => d.classList.remove('show'));
        }
    });
}

/**
 * নির্দিষ্ট গ্রাহকের প্রোফাইল এবং লেনদেনের ইতিহাস রেন্ডার করে।
 */
function renderCustomerProfilePage() {
    const customerId = Number(getQueryParam('id')); // URL থেকে id নাও
    if (!customerId) {
        // যদি কোনো id না পাওয়া যায়, গ্রাহক পেজে ফেরত পাঠাও
        window.location.href = 'customers.html';
        return;
    }

    const customers = getData('customers');
    const transactions = getData('transactions');

    const customer = customers.find(c => c.id === customerId);

    // যদি ওই id-র কোনো গ্রাহক না পাওয়া যায়
    if (!customer) {
        alert('Customer not found!');
        window.location.href = 'customers.html';
        return;
    }

    // পেজের টাইটেল এবং হেডার আপডেট করো
    document.title = `${customer.name} - Profile`;
    document.getElementById('profile-customer-name').textContent = customer.name;

    // ব্যালেন্সের তথ্য দেখাও
    const balanceSummaryContainer = document.getElementById('profile-balance-summary');
    let balanceHTML = '';

    if (customer.balance > 0) {
        balanceHTML = `<div class="balance-item due"><h3>Total Due</h3><p>$${customer.balance.toLocaleString()}</p></div>`;
    } else if (customer.balance < 0) {
        balanceHTML = `<div class="balance-item advance"><h3>Advance</h3><p>$${Math.abs(customer.balance).toLocaleString()}</p></div>`;
    } else {
        balanceHTML = `<div class="balance-item"><h3>Balance</h3><p>$0</p></div>`;
    }
    balanceSummaryContainer.innerHTML = balanceHTML;

    // নির্দিষ্ট গ্রাহকের লেনদেনের ইতিহাস ফিল্টার করো
    // (এখনও customerName দিয়ে ফিল্টার করা হচ্ছে, পরে customerId দিয়ে করা হবে)
    const customerTransactions = transactions.filter(tx => tx.customerId === customerId).reverse();

    const transactionListContainer = document.getElementById('transaction-list-container');
    transactionListContainer.innerHTML = '';

    if (customerTransactions.length === 0) {
        transactionListContainer.innerHTML = '<p class="empty-message">No transactions found for this customer.</p>';
    } else {

        customerTransactions.forEach(tx => {
            const transactionHTML = `
        <div class="transaction-item" data-transaction-id="${tx.id}">
            <div class="transaction-details">
                <div class="transaction-info">
                    <div class="type">${tx.type}</div>
                    <div class="date">${tx.date}</div>
                  
                    ${tx.note ? `<div class="note">${tx.note}</div>` : ''}
                </div>
                <div class="transaction-amount ${tx.type.toLowerCase()}">
                    $${tx.amount.toLocaleString()}
                </div>
            </div>
            <div class="transaction-actions">
                <i class="fa-solid fa-pen-to-square edit-transaction-btn"></i>
                <i class="fa-solid fa-trash delete-transaction-btn"></i>
            </div>
        </div>
    `;
            transactionListContainer.insertAdjacentHTML('beforeend', transactionHTML);
        });
    }
}


/**
 * রিপোর্ট পেজের সমস্ত ডাইনামিক ডেটা রেন্ডার করে।
 */
function renderReportsPage() {
    const transactions = getData('transactions');
    const customers = getData('customers');

    // --- টপ কার্ডের ডেটা গণনা এবং রেন্ডার ---
    let totalSales = 0;
    transactions.forEach(tx => {
        if (tx.type === 'Payment') {
            totalSales += tx.amount;
        }
    });

    let totalDue = 0;
    customers.forEach(c => {
        if (c.balance > 0) {
            totalDue += c.balance;
        }
    });

    document.querySelector('.stat-card.report-sales .amount').textContent = `$${totalSales.toLocaleString()}`;
    document.querySelector('.stat-card.report-due .amount').textContent = `$${totalDue.toLocaleString()}`;

    // --- চার্টের জন্য ডেটা প্রস্তুত করা ---
    // মাসের ভিত্তিতে সেলস ডেটা গ্রুপ করা
    const salesByMonth = {
        Jan: 0,
        Feb: 0,
        Mar: 0,
        Apr: 0,
        May: 0,
        Jun: 0,
        Jul: 0,
        Aug: 0,
        Sep: 0,
        Oct: 0,
        Nov: 0,
        Dec: 0
    };
    transactions.forEach(tx => {
        if (tx.type === 'Payment') {
            const month = tx.date.split(' ')[0]; // যেমন "Apr 12" থেকে "Apr" নেওয়া
            if (salesByMonth.hasOwnProperty(month)) {
                salesByMonth[month] += tx.amount;
            }
        }
    });

    // চার্টের জন্য লেবেল এবং ডেটা তৈরি করা
    const salesLabels = Object.keys(salesByMonth);
    const salesData = Object.values(salesByMonth);
    createSalesChart(salesLabels, salesData);

    // টপ ৫ জন দেনাদার গ্রাহকের ডেটা নেওয়া
    const topDues = customers
        .filter(c => c.balance > 0) // শুধুমাত্র দেনাদার
        .sort((a, b) => b.balance - a.balance) // বেশি থেকে কম সাজানো
        .slice(0, 5); // প্রথম ৫ জন

    const dueLabels = topDues.map(c => c.name);
    const dueData = topDues.map(c => c.balance);
    createDuesChart(dueLabels, dueData);
}

/**
 * Chart.js ব্যবহার করে সেলস বার চার্ট তৈরি করে।
 * @param {string[]} labels - মাসের নাম (e.g., ['Jan', 'Feb', ...])
 * @param {number[]} data - প্রতি মাসের সেলস (e.g., [500, 1200, ...])
 */
function createSalesChart(labels, data) {
    const ctx = document.getElementById('salesChart');
    if (!ctx) return; // যদি এলিমেন্ট না পাওয়া যায়

    // যদি এই canvas-এ আগে থেকেই কোনো চার্ট থাকে, তবে সেটিকে ধ্বংস করো
    if (Chart.getChart(ctx)) {
        Chart.getChart(ctx).destroy();
    }

    new Chart(ctx.getContext('2d'), {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Sales',
                data: data,
                backgroundColor: 'rgba(92, 184, 92, 0.7)', // Green
                borderColor: 'rgba(92, 184, 92, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        color: 'grey'
                    }, // Y-অক্ষের লেখার রঙ
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    } // হালকা গ্রিড লাইন
                },
                x: {
                    ticks: {
                        color: 'grey'
                    }, // X-অক্ষের লেখার রঙ
                    grid: {
                        display: false
                    } // X-অক্ষের গ্রিড লাইন বন্ধ
                }
            },
            plugins: {
                legend: {
                    labels: {
                        color: 'grey' // লেজেন্ডের লেখার রঙ
                    }
                }
            }
        }
    }); // <<<<<<< একটি বন্ধনী কমানো হয়েছে
}

/**
 * Chart.js ব্যবহার করে টপ দেনাদারদের জন্য চার্ট তৈরি করে।
 * @param {string[]} labels - গ্রাহকদের নাম
 * @param {number[]} data - তাদের দেনার পরিমাণ
 */
function createDuesChart(labels, data) {
    const ctx = document.getElementById('duesChart');
    if (!ctx) return; // যদি এলিমেন্ট না পাওয়া যায়

    // যদি এই canvas-এ আগে থেকেই কোনো চার্ট থাকে, তবে সেটিকে ধ্বংস করো
    if (Chart.getChart(ctx)) {
        Chart.getChart(ctx).destroy();
    }

    new Chart(ctx.getContext('2d'), {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Due Amount',
                data: data,
                backgroundColor: 'rgba(217, 83, 79, 0.7)', // Red
                borderColor: 'rgba(217, 83, 79, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        color: 'grey'
                    }, // Y-অক্ষের লেখার রঙ
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    } // হালকা গ্রিড লাইন
                },
                x: {
                    ticks: {
                        color: 'grey'
                    }, // X-অক্ষের লেখার রঙ
                    grid: {
                        display: false
                    } // X-অক্ষের গ্রিড লাইন বন্ধ
                }
            },
            plugins: {
                legend: {
                    labels: {
                        color: 'grey' // লেজেন্ডের লেখার রঙ
                    }
                }
            }
        }
    }); // <<<<<<< একটি বন্ধনী কমানো হয়েছে
}
// ======================================================
// EVENT LISTENERS AND HANDLERS
// ======================================================
/**
 * কাস্টমার পেজের জন্য ইভেন্ট লিসেনার সেটআপ করে (নতুন হেডার সার্চ UI সহ)।
 */
function setupCustomerPageEvents() {
    // ==========================================================
    // ধাপ ক: নতুন সার্চ UI-এর জন্য এলিমেন্ট এবং ইভেন্ট
    // ==========================================================
    const searchIcon = document.getElementById('customer-search-icon');
    const searchBar = document.getElementById('customer-search-bar');
    const searchInput = document.getElementById('customer-search-input');
    const closeSearchBtn = document.getElementById('close-search-btn');

    if (searchIcon && searchBar && searchInput && closeSearchBtn) {
        searchIcon.addEventListener('click', () => {
            searchBar.classList.add('active'); // সার্চ বার দেখাও
            searchInput.focus(); // ইনপুট ফিল্ডে ফোকাস করো
        });

        closeSearchBtn.addEventListener('click', () => {
            searchBar.classList.remove('active'); // সার্চ বার গোপন করো
            searchInput.value = ''; // ইনপুট খালি করো
            renderCustomersPage(); // সম্পূর্ণ তালিকা আবার দেখাও
        });

        searchInput.addEventListener('input', () => {
            renderCustomersPage(searchInput.value);
        });
    }

    // ==========================================================
    // ধাপ খ: Modal এবং অন্যান্য পুরনো ইভেন্ট (অপরিবর্তিত)
    // ==========================================================
    const customerListContainer = document.querySelector('.customer-list');
    const fab = document.querySelector('.fab');
    const modal = document.getElementById('add-customer-modal');
    if (!customerListContainer || !fab || !modal) return;
 
    const form = document.getElementById('add-customer-form');
    const modalTitle = modal.querySelector('.modal-header h2');
    const closeButton = modal.querySelector('.close-button');

    const openModal = (isEditing = false, customer = {}) => {
        form.reset();
        const balanceGroup = form.querySelector('#balance-group');
        if (isEditing) {
            modalTitle.textContent = 'Edit Customer';
            form.querySelector('#customer-name').value = customer.name;
            if (balanceGroup) balanceGroup.classList.add('hidden');
            form.setAttribute('data-editing-id', customer.id);
        } else {
            modalTitle.textContent = 'Add New Customer';
            if (balanceGroup) balanceGroup.classList.remove('hidden');
            form.removeAttribute('data-editing-id');
        }
        modal.classList.add('show');
    };
    const closeModal = () => modal.classList.remove('show');
    
    fab.addEventListener('click', () => openModal(false));
    closeButton.addEventListener('click', closeModal);
    window.addEventListener('click', e => { if (e.target === modal) closeModal(); });

    form.addEventListener('submit', e => {
        e.preventDefault();
        const editingId = Number(form.getAttribute('data-editing-id'));
        let customers = getData('customers');
        let transactions = getData('transactions');
        const name = form.querySelector('#customer-name').value.trim();
        if (!name) return alert('Customer name is required.');
        if (editingId) {
            const customerIndex = customers.findIndex(c => c.id === editingId);
            if (customerIndex > -1) customers[customerIndex].name = name;
        } else {
            const balanceInput = form.querySelector('#customer-balance').value;
            const balance = Number(balanceInput) || 0;
            const newCustomer = { id: Date.now(), name, balance };
            customers.push(newCustomer);
            if (balance !== 0) {
                transactions.push({ id: Date.now() + 1, customerId: newCustomer.id, customerName: newCustomer.name, type: balance > 0 ? 'Due' : 'Payment', amount: Math.abs(balance), note: 'Opening Balance', date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) });
            }
        }
        localStorage.setItem('customers', JSON.stringify(customers));
        if (!editingId) localStorage.setItem('transactions', JSON.stringify(transactions));
        closeModal();
        renderCustomersPage(searchInput.value); // বর্তমান সার্চ টেক্সট সহ তালিকা রিফ্রেশ করো
    });

    const action = getQueryParam('action');
    const customerIdFromUrl = Number(getQueryParam('id'));
    if (action === 'edit' && customerIdFromUrl) {
        const customers = getData('customers');
        const customerToEdit = customers.find(c => c.id === customerIdFromUrl);
        if (customerToEdit) {
            openModal(true, customerToEdit);
            window.history.replaceState({}, document.title, "customers.html");
        }
    }
}
/**
 * প্রোফাইল পেজের জন্য সমস্ত ইভেন্ট লিসেনার সেটআপ করে।
 */
function setupProfilePageEvents() {
    // ======================================================
    // ধাপ ১: পেজের সমস্ত প্রয়োজনীয় এলিমেন্ট ধরা
    // ======================================================
    const sellProductBtn = document.getElementById('sell-product-btn');
    const sellModal = document.getElementById('sell-product-modal');
    const addTransactionBtn = document.querySelector('.add-transaction-btn');
    const transactionModal = document.getElementById('add-transaction-modal');
    const transactionListContainer = document.getElementById('transaction-list-container');
    const menuIcon = document.querySelector('.menu-icon');
    const dropdownMenu = document.querySelector('.dropdown-menu');
    const editCustomerBtn = document.getElementById('edit-customer-btn');
    const deleteCustomerBtn = document.getElementById('delete-customer-btn');

    if (!addTransactionBtn || !transactionModal || !transactionListContainer || !menuIcon || !dropdownMenu || !editCustomerBtn || !deleteCustomerBtn || !sellProductBtn || !sellModal) {
        console.error("Profile page elements not found. Events cannot be attached.");
        return;
    }

    const customerId = Number(getQueryParam('id'));
    const transactionForm = document.getElementById('add-transaction-form');
    const transactionModalCloseBtn = transactionModal.querySelector('.close-button');


    // ======================================================
    // ধাপ ২: মেনু এবং ড্রপডাউন-এর ইভেন্ট
    // ======================================================
    menuIcon.addEventListener('click', (event) => {
        event.stopPropagation();
        dropdownMenu.classList.toggle('show');
    });

    deleteCustomerBtn.addEventListener('click', (event) => {
        event.preventDefault();
        if (confirm('Are you sure you want to delete this customer and all their transactions?')) {
            let customers = getData('customers');
            let transactions = getData('transactions');
            customers = customers.filter(c => c.id !== customerId);
            transactions = transactions.filter(tx => tx.customerId !== customerId);
            localStorage.setItem('customers', JSON.stringify(customers));
            localStorage.setItem('transactions', JSON.stringify(transactions));
            alert('Customer deleted successfully.');
            window.location.href = 'customers.html';
        }
    });

    editCustomerBtn.addEventListener('click', (event) => {
        event.preventDefault();
        const customerId = Number(getQueryParam('id'));
        // URL-এর মাধ্যমে এডিট করার নির্দেশ দাও
        window.location.href = `customers.html?action=edit&id=${customerId}`;
    });

    // ======================================================
    // ধাপ ৩: লেনদেন যোগ করার Modal-এর ইভেন্ট
    // ======================================================
    addTransactionBtn.addEventListener('click', () => {
        transactionForm.reset();
        transactionForm.removeAttribute('data-editing-id');
        transactionModal.querySelector('.modal-header h2').textContent = 'Add Transaction';
        transactionModal.querySelector('#transaction-date').valueAsDate = new Date();
        transactionModal.classList.add('show');
    });

    transactionModalCloseBtn.addEventListener('click', () => transactionModal.classList.remove('show'));


    // ======================================================
    // ধাপ ৪: লেনদেন তালিকায় ক্লিক হ্যান্ডেল করা (ডিলিট এবং এডিট)
    // ======================================================
    transactionListContainer.addEventListener('click', (event) => {
        const target = event.target;
        const transactionItem = target.closest('.transaction-item');
        if (!transactionItem) return;
        const transactionId = Number(transactionItem.getAttribute('data-transaction-id'));

        // --- ডিলিট বাটন ক্লিক হলে ---
        if (target.matches('.delete-transaction-btn')) {
            if (confirm('Are you sure you want to delete this transaction?')) {
                let transactions = getData('transactions');
                let customers = getData('customers');
                const txToDelete = transactions.find(tx => tx.id === transactionId);
                if (!txToDelete) return;
                const customerIndex = customers.findIndex(c => c.id === txToDelete.customerId);
                if (customerIndex > -1) {
                    txToDelete.type === 'Due' ? customers[customerIndex].balance -= txToDelete.amount : customers[customerIndex].balance += txToDelete.amount;
                }
                transactions = transactions.filter(tx => tx.id !== transactionId);
                localStorage.setItem('customers', JSON.stringify(customers));
                localStorage.setItem('transactions', JSON.stringify(transactions));
                renderCustomerProfilePage();
            }
        }
        // --- এডিট বাটন ক্লিক হলে ---
        else if (target.matches('.edit-transaction-btn')) {
            const transactions = getData('transactions');
            const txToEdit = transactions.find(tx => tx.id === transactionId);
            if (txToEdit) {
                transactionModal.querySelector('.modal-header h2').textContent = 'Edit Transaction';
                transactionForm.querySelector(`input[name="transaction-type"][value="${txToEdit.type}"]`).checked = true;
                transactionForm.querySelector('#transaction-amount').value = txToEdit.amount;
                const dateObj = new Date(txToEdit.date + ' ' + new Date().getFullYear());
                transactionForm.querySelector('#transaction-date').value = dateObj.toISOString().split('T')[0];
                transactionForm.querySelector('#transaction-note').value = txToEdit.note || '';

                transactionForm.setAttribute('data-editing-id', transactionId);
                transactionModal.classList.add('show');
            }

        }
        // --- লেনদেনের অন্য কোনো জায়গায় ক্লিক হলে ---
        else {
            document.querySelectorAll('.transaction-item.show-actions').forEach(item => {
                if (item !== transactionItem) item.classList.remove('show-actions');
            });
            transactionItem.classList.toggle('show-actions');
        }
    });


    // ======================================================
    // ধাপ ৫: লেনদেন ফর্ম সাবমিট করা (রিয়েল-টাইম ভ্যালিডেশনসহ)
    // ======================================================
    const totalAmountInput = transactionForm.querySelector('#transaction-amount');
    const cashReceivedInput = transactionForm.querySelector('#transaction-cash-received');

    transactionForm.addEventListener('submit', (event) => {
        event.preventDefault();

        const totalAmount = Number(totalAmountInput.value) || 0;
        const cashReceived = Number(cashReceivedInput.value) || 0;

        // ভ্যালিডেশন চেক
        if (totalAmount === 0 && cashReceived === 0) {
            totalAmountInput.classList.add('invalid');
            return;
        }
        if (totalAmount > 0 && cashReceived > totalAmount) {
            cashReceivedInput.classList.add('invalid');
            return;
        }

        // যদি ভ্যালিডেশন পাস করে, তাহলে বাকি কাজ করো
        const dateInput = transactionForm.querySelector('#transaction-date').value;
        const note = transactionForm.querySelector('#transaction-note').value.trim();
        const date = new Date(dateInput).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric'
        });

        let transactions = getData('transactions');
        let customers = getData('customers');
        const customerIndex = customers.findIndex(c => c.id === customerId);
        if (customerIndex === -1) return;

        if (totalAmount > 0) {
            transactions.push({
                id: Date.now(),
                customerId,
                customerName: customers[customerIndex].name,
                type: 'Due',
                amount: totalAmount,
                note: note || `Transaction (Bill)`,
                date
            });
            customers[customerIndex].balance += totalAmount;
        }

        if (cashReceived > 0) {
            let paymentNote = note || `Payment Received`;
            if (totalAmount > 0) {
                paymentNote = `Payment against bill of $${totalAmount}`;
            }
            transactions.push({
                id: Date.now() + 1,
                customerId,
                customerName: customers[customerIndex].name,
                type: 'Payment',
                amount: cashReceived,
                note: paymentNote,
                date
            });
            customers[customerIndex].balance -= cashReceived;
        }

        localStorage.setItem('transactions', JSON.stringify(transactions));
        localStorage.setItem('customers', JSON.stringify(customers));

        transactionModal.classList.remove('show');
        transactionForm.reset();
        renderCustomerProfilePage();
    });

    // ======================================================
    // ধাপ ৫.১: রিয়েল-টাইম ভ্যালিডেশন ইভেন্ট লিসেনার
    // ======================================================
    function validateTransactionInputs() {
        const totalAmount = Number(totalAmountInput.value) || 0;
        const cashReceived = Number(cashReceivedInput.value) || 0;

        // যদি কোনো একটি ফিল্ডে মান থাকে, তাহলে Total Amount-এর লাল বর্ডার মুছে দাও
        if (totalAmount > 0 || cashReceived > 0) {
            totalAmountInput.classList.remove('invalid');
        }

        // যদি Cash Received ঠিক থাকে, তাহলে তার লাল বর্ডার মুছে দাও
        if (cashReceived <= totalAmount || totalAmount === 0) {
            cashReceivedInput.classList.remove('invalid');
        }
    }

    totalAmountInput.addEventListener('input', validateTransactionInputs);
    cashReceivedInput.addEventListener('input', validateTransactionInputs);

    // ======================================================
    // ধাপ ৬: একটি মাত্র window.click দিয়ে Modal এবং ড্রপডাউন বন্ধ করা
    // ======================================================
    window.addEventListener('click', (event) => {
        if (event.target === transactionModal) {
            transactionModal.classList.remove('show');
        }
        if (!event.target.closest('.header-menu')) {
            if (dropdownMenu.classList.contains('show')) {
                dropdownMenu.classList.remove('show');
            }
        }
    });
    // ===============================================
    // নতুন লজিক: পণ্য বিক্রির Modal হ্যান্ডেল করা
    // ===============================================

    const sellForm = document.getElementById('sell-product-form');
    const sellModalCloseBtn = sellModal.querySelector('.close-button');
    const productSelect = document.getElementById('product-select');
    const productInfoDisplay = document.getElementById('product-info-display');
    const sellQuantityInput = document.getElementById('sell-quantity');

    // "Sell Product" বাটনে ক্লিক করলে Modal খোলা
    sellProductBtn.addEventListener('click', () => {
        const products = getData('products');
        productSelect.innerHTML = '<option value="">-- Choose a product --</option>'; // ড্রপডাউন রিসেট করো

        // ড্রপডাউনে শুধুমাত্র স্টকে থাকা পণ্যগুলো দেখাও
        products.forEach(p => {
            if (p.quantity > 0) {
                productSelect.innerHTML += `<option value="${p.id}">${p.name} (${p.quantity} in stock)</option>`;
            }
        });

        // গ্রাহকের নামটি Modal-এর টাইটেলে বসাও
        const customer = getData('customers').find(c => c.id === customerId);
        if (customer) document.getElementById('sell-customer-name').textContent = customer.name;

        // ফর্ম রিসেট এবং তথ্য বক্স লুকিয়ে দাও
        sellForm.reset();
        productInfoDisplay.style.display = 'none';

        sellModal.classList.add('show');
    });

    // Modal বন্ধ করার ইভেন্ট
    sellModalCloseBtn.addEventListener('click', () => sellModal.classList.remove('show'));

    // যখন ড্রপডাউন থেকে কোনো পণ্য সিলেক্ট করা হবে
    productSelect.addEventListener('change', () => {
        const productId = Number(productSelect.value);
        if (!productId) {
            productInfoDisplay.style.display = 'none';
            return;
        }
        const product = getData('products').find(p => p.id === productId);
        productInfoDisplay.innerHTML = `Price: <strong>$${product.sellingPrice}</strong> | Available: <strong>${product.quantity}</strong>`;
        productInfoDisplay.style.display = 'block';
    });

    // যখন বিক্রির ফর্ম সাবমিট করা হবে
    sellForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const productId = Number(productSelect.value);
        const quantitySold = Number(sellQuantityInput.value);

        let products = getData('products');
        let customers = getData('customers');
        let transactions = getData('transactions');

        const productIndex = products.findIndex(p => p.id === productId);
        const customerIndex = customers.findIndex(c => c.id === customerId);

        // প্রাথমিক ভ্যালিডেশন
        if (productIndex === -1 || customerIndex === -1) return alert('Error: Product or Customer not found.');
        if (quantitySold <= 0 || quantitySold > products[productIndex].quantity) {
            return alert('Invalid quantity. Please check available stock.');
        }

        const totalSaleAmount = products[productIndex].sellingPrice * quantitySold;

        // ১. স্টকের পরিমাণ আপডেট করো
        products[productIndex].quantity -= quantitySold;

        // ২. গ্রাহকের ব্যালেন্স (Due) আপডেট করো
        customers[customerIndex].balance += totalSaleAmount;

        // ৩. একটি নতুন "Due" লেনদেন তৈরি করো বিক্রির তথ্যসহ
        const saleTransaction = {
            id: Date.now(),
            customerId: customerId,
            customerName: customers[customerIndex].name,
            type: 'Due',
            amount: totalSaleAmount,
            details: `${quantitySold} x ${products[productIndex].name}`, // অতিরিক্ত তথ্য
            date: new Date().toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric'
            })
        };
        transactions.push(saleTransaction);

        // ৪. সব আপডেট হওয়া ডেটা LocalStorage-এ সেভ করো
        localStorage.setItem('products', JSON.stringify(products));
        localStorage.setItem('customers', JSON.stringify(customers));
        localStorage.setItem('transactions', JSON.stringify(transactions));

        alert('Sale completed successfully!');
        sellModal.classList.remove('show');
        renderCustomerProfilePage(); // প্রোফাইল পেজটি আবার রেন্ডার করো
    });
}
/**
 * সেটিংস পেজের জন্য ইভেন্ট লিসেনার সেটআপ করে।
 */
function setupSettingsPageEvents() {
    const backupBtn = document.getElementById('backup-btn');
    const restoreBtn = document.getElementById('restore-btn');
    const restoreFileInput = document.getElementById('restore-file-input');

    if (!backupBtn || !restoreBtn || !restoreFileInput) return;

    // --- Backup Logic ---
    backupBtn.addEventListener('click', () => {
        // LocalStorage থেকে সমস্ত ডেটা সংগ্রহ করো
        const allData = {
            customers: getData('customers'),
            products: getData('products'),
            transactions: getData('transactions')
        };

        // ডেটাকে JSON স্ট্রিং-এ পরিণত করো
        const dataStr = JSON.stringify(allData, null, 2); // null, 2 দিয়ে সুন্দরভাবে ফরম্যাট করা হয়
        const blob = new Blob([dataStr], {
            type: 'application/json'
        });

        // একটি ডাউনলোড লিঙ্ক তৈরি করো
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;

        // ফাইলের নাম আজকের তারিখ দিয়ে তৈরি করো
        const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
        a.download = `local-ledger-backup-${today}.json`;

        // লিঙ্কটিতে ক্লিক করে ডাউনলোড শুরু করো
        a.click();

        // লিঙ্কটি রিমুভ করো
        URL.revokeObjectURL(url);
    });

    // --- Restore Logic ---
    restoreBtn.addEventListener('click', () => {
        // গোপন ফাইল ইনপুটটিতে ক্লিক করো
        restoreFileInput.click();
    });

    restoreFileInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();

        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);

                // ফাইলটি সঠিক কিনা তা পরীক্ষা করো
                if (data.customers && data.products && data.transactions) {
                    if (confirm('Are you sure you want to restore? This will overwrite all current data.')) {
                        // নতুন ডেটা LocalStorage-এ সেভ করো
                        localStorage.setItem('customers', JSON.stringify(data.customers));
                        localStorage.setItem('products', JSON.stringify(data.products));
                        localStorage.setItem('transactions', JSON.stringify(data.transactions));

                        alert('Data restored successfully! The app will now reload.');
                        location.reload(); // অ্যাপ রিলোড করো
                    }
                } else {
                    alert('Invalid backup file.');
                }
            } catch (error) {
                alert('Error reading backup file.');
                console.error("Restore error:", error);
            }
        };

        reader.readAsText(file);
    });
}

/**
 * হোম পেজের Quick Action বাটনগুলোর জন্য ইভেন্ট লিসেনার সেটআপ করে।
 */
function setupHomePageEvents() {
    // Customer Modal elements
    const addCustomerBtn = document.getElementById('home-add-customer-btn');
    const customerModal = document.getElementById('add-customer-modal');
    if (addCustomerBtn && customerModal) {
        const customerForm = customerModal.querySelector('#add-customer-form');
        const customerCloseBtn = customerModal.querySelector('.close-button');

        addCustomerBtn.addEventListener('click', () => customerModal.classList.add('show'));
        customerCloseBtn.addEventListener('click', () => customerModal.classList.remove('show'));

        customerForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const name = customerForm.querySelector('#home-customer-name').value.trim();
            if (!name) return alert('Customer name is required.');

            const balanceInput = customerForm.querySelector('#home-customer-balance').value;
            const balance = Number(balanceInput) || 0;

            let customers = getData('customers');
            let transactions = getData('transactions');

            // নতুন গ্রাহক তৈরি করো
            const newCustomer = {
                id: Date.now(),
                name,
                balance: balance
            };
            customers.push(newCustomer);

            // Opening Balance-এর জন্য লেনদেন তৈরি করো
            if (balance !== 0) {
                const transactionType = balance > 0 ? 'Due' : 'Payment';
                const transactionAmount = Math.abs(balance);

                const newTransaction = {
                    id: Date.now() + 1, // ইউনিক ID নিশ্চিত করার জন্য
                    customerId: newCustomer.id,
                    customerName: newCustomer.name,
                    type: transactionType,
                    amount: transactionAmount,
                    date: new Date().toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric'
                    }),
                    note: 'Opening Balance'
                };
                transactions.push(newTransaction);
            }

            // উভয় ডেটা LocalStorage-এ সেভ করো
            localStorage.setItem('customers', JSON.stringify(customers));
            localStorage.setItem('transactions', JSON.stringify(transactions));
            // <<<<<<<<<<<<<<< নতুন কোড শেষ >>>>>>>>>>>>>>>

            customerForm.reset();
            customerModal.classList.remove('show');
            alert(`${name} has been added successfully!`);
            renderHomePage(); // হোম পেজ রিফ্রেশ করো
        });
    }

    // Product Modal elements
    const addProductBtn = document.getElementById('home-add-product-btn');
    const productModal = document.getElementById('add-product-modal');
    if (addProductBtn && productModal) {
        const productForm = productModal.querySelector('#add-product-form');
        const productCloseBtn = productModal.querySelector('.close-button');

        addProductBtn.addEventListener('click', () => productModal.classList.add('show'));
        productCloseBtn.addEventListener('click', () => productModal.classList.remove('show'));

        productForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const name = productForm.querySelector('#home-product-name').value.trim();
            const quantity = productForm.querySelector('#home-product-quantity').value;
            if (!name || !quantity) return alert('Product Name and Quantity are required.');

            const category = productForm.querySelector('#home-product-category').value.trim();
            let products = getData('products');
            products.push({
                id: Date.now(),
                name,
                category: category || 'Uncategorized',
                quantity: Number(quantity)
            });
            localStorage.setItem('products', JSON.stringify(products));

            productForm.reset();
            productModal.classList.remove('show');
            alert(`${name} has been added to stock!`);
        });
    }
    // add transaction 
    const addTransactionBtn = document.getElementById('home-add-transaction-btn');
    if (addTransactionBtn) {
        addTransactionBtn.addEventListener('click', () => {
            window.location.href = 'customers.html';
        });
    }
    // Modal-এর বাইরে ক্লিক করলে বন্ধ করার জন্য
    window.addEventListener('click', (event) => {
        if (event.target === customerModal) customerModal.classList.remove('show');
        if (event.target === productModal) productModal.classList.remove('show');
    });
}
/**
 * সেটিংস পেজের থিম টগল সুইচের জন্য ইভেন্ট লিসেনার সেটআপ করে।
 */
function setupThemeToggle() {
    const themeToggle = document.getElementById('theme-toggle');
    if (!themeToggle) return;

    // পেজ লোড হওয়ার সময় সুইচের সঠিক অবস্থা সেট করো
    if (localStorage.getItem('theme') === 'dark') {
        themeToggle.checked = true;
    }

    // যখন সুইচ পরিবর্তন করা হবে
    themeToggle.addEventListener('change', () => {
        if (themeToggle.checked) {
            // ডার্ক মোড চালু করো
            document.body.classList.add('dark-mode');
            localStorage.setItem('theme', 'dark');
        } else {
            // ডার্ক মোড বন্ধ করো
            document.body.classList.remove('dark-mode');
            localStorage.setItem('theme', 'light');
        }
    });
}