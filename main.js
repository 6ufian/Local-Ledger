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
function renderHomePage() {
    // ... (অপরিবর্তিত)
    const customers = getData('customers');
    const transactions = getData('transactions');
    let totalDue = 0, totalAdvance = 0;
    customers.forEach(c => c.balance > 0 ? totalDue += c.balance : totalAdvance += Math.abs(c.balance));
    document.querySelector('.stat-card .amount.due').textContent = `$${totalDue.toLocaleString()}`;
    document.querySelector('.stat-card .amount.advance').textContent = `$${totalAdvance.toLocaleString()}`;
    const tbody = document.querySelector('.transaction-table tbody');
    tbody.innerHTML = '';
    transactions.slice(-4).reverse().forEach(tx => {
        tbody.innerHTML += `<tr><td>${tx.date}</td><td class="transaction-type ${tx.type.toLowerCase()}">${tx.type}</td><td class="amount-col">$${tx.amount.toLocaleString()}</td></tr>`;
    });
}

/**
 * কাস্টমার পেজের ডাইনামিক ডেটা (গ্রাহক তালিকা) রেন্ডার করে।
 */
function renderCustomersPage() {
    const customers = getData('customers');
    const customerListContainer = document.querySelector('.customer-list');

    if (!customerListContainer) return;

    customerListContainer.innerHTML = '';

    if (customers.length === 0) {
        customerListContainer.innerHTML = '<p class="empty-message">No customers found. Click the + button to add one.</p>';
        return;
    }

    // প্রতিটি গ্রাহকের জন্য একটি করে কার্ড তৈরি করো
    customers.forEach(customer => {
        let balanceClass = '';
        let statusText = '';
        const balanceAmount = Math.abs(customer.balance).toLocaleString();

        if (customer.balance > 0) {
            balanceClass = 'balance-due';
            statusText = 'Due';
        } else if (customer.balance < 0) {
            balanceClass = 'balance-advance';
            statusText = 'Advance';
        } else {
            balanceClass = 'balance-zero';
            statusText = 'Zero Balance';
        }

        // <<<<<<<<<<<<<<< এই অংশটি পরিবর্তন করা হয়েছিল >>>>>>>>>>>>>>>
        // প্রতিটি কার্ডকে একটি লিঙ্কে পরিণত করা হয়েছে যা customer-profile.html-এ নিয়ে যায়
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

function renderStockPage() {
    // ... (অপরিবর্তিত)
    const products = getData('products');
    const container = document.querySelector('.stock-list');
    if (!container) return;
    container.innerHTML = '';
    if (products.length === 0) {
        container.innerHTML = '<p class="empty-message">No products found.</p>';
        return;
    }
    products.forEach(p => {
        let qClass = p.quantity <= 20 ? 'quantity-low' : 'quantity-ok';
        let qText = p.quantity <= 20 ? `<span class="low-label">Low:</span> ${p.quantity}` : `${p.quantity} in stock`;
        container.innerHTML += `<div class="stock-card"><div class="product-info"><p class="name">${p.name}</p><p class="category">${p.category}</p></div><div class="product-quantity ${qClass}">${qText}</div></div>`;
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
    const customerTransactions = transactions.filter(tx => tx.customerName === customer.name).reverse();
    
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
    const salesByMonth = { Jan: 0, Feb: 0, Mar: 0, Apr: 0, May: 0, Jun: 0, Jul: 0, Aug: 0, Sep: 0, Oct: 0, Nov: 0, Dec: 0 };
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
    const ctx = document.getElementById('salesChart').getContext('2d');
    new Chart(ctx, {
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
                    beginAtZero: true
                }
            }
        }
    });
}

/**
 * Chart.js ব্যবহার করে টপ দেনাদারদের জন্য চার্ট তৈরি করে।
 * @param {string[]} labels - গ্রাহকদের নাম
 * @param {number[]} data - তাদের দেনার পরিমাণ
 */
function createDuesChart(labels, data) {
    const ctx = document.getElementById('duesChart').getContext('2d');
    new Chart(ctx, {
        type: 'bar', // লাইন চার্টের পরিবর্তে বার চার্ট ব্যবহার করা সহজ এবং কার্যকরী
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
                    beginAtZero: true
                }
            }
        }
    });
}
// ======================================================
// EVENT LISTENERS AND HANDLERS
// ======================================================
function setupCustomerPageEvents() {
    const fab = document.querySelector('.fab');
    const modal = document.getElementById('add-customer-modal');
    if (!fab || !modal) return;
    
    const closeButton = modal.querySelector('.close-button');
    const form = document.getElementById('add-customer-form');

    fab.addEventListener('click', () => modal.classList.add('show'));
    closeButton.addEventListener('click', () => modal.classList.remove('show'));
    window.addEventListener('click', e => { if (e.target === modal) modal.classList.remove('show'); });

    form.addEventListener('submit', e => {
        e.preventDefault();
        const name = form.querySelector('#customer-name').value.trim();
        if (!name) return alert('Customer name is required.');
        const balance = form.querySelector('#customer-balance').value;
        const customers = getData('customers');
        customers.push({ id: Date.now(), name, balance: Number(balance) || 0 });
        localStorage.setItem('customers', JSON.stringify(customers));
        form.reset();
        modal.classList.remove('show');
        renderCustomersPage();
    });
}

/**
 * স্টক পেজের জন্য ইভেন্ট লিসেনার সেটআপ করে।
 */
function setupStockPageEvents() {
    const fab = document.querySelector('.fab.fab-text');
    const modal = document.getElementById('add-product-modal');
    if (!fab || !modal) return;

    const closeButton = modal.querySelector('.close-button');
    const form = document.getElementById('add-product-form');

    fab.addEventListener('click', () => modal.classList.add('show'));
    closeButton.addEventListener('click', () => modal.classList.remove('show'));
    window.addEventListener('click', e => { if (e.target === modal) modal.classList.remove('show'); });

    form.addEventListener('submit', e => {
        e.preventDefault();
        const name = form.querySelector('#product-name').value.trim();
        const quantity = form.querySelector('#product-quantity').value;
        if (!name || !quantity) return alert('Product Name and Quantity are required.');
        
        const category = form.querySelector('#product-category').value.trim();
        const products = getData('products');
        products.push({
            id: Date.now(),
            name,
            category: category || 'Uncategorized',
            quantity: Number(quantity)
        });
        localStorage.setItem('products', JSON.stringify(products));
        form.reset();
        modal.classList.remove('show');
        renderStockPage();
    });
}

/**
 * প্রোফাইল পেজের জন্য ইভেন্ট লিসেনার সেটআপ করে।
 */
function setupProfilePageEvents() {
    const addTransactionBtn = document.querySelector('.add-transaction-btn');
    const modal = document.getElementById('add-transaction-modal');
    const transactionListContainer = document.getElementById('transaction-list-container');
    const customerId = Number(getQueryParam('id'));

    if (!addTransactionBtn || !modal || !transactionListContainer) return;

    // ... (Modal খোলার এবং ফর্ম সাবমিটের পুরনো কোড এখানে অপরিবর্তিত থাকবে) ...
    // ... (শুধু নিশ্চিত করুন যে এটি নিচের 새로운 event listener-এর আগে আছে) ...
    const closeButton = modal.querySelector('.close-button');
    const transactionForm = document.getElementById('add-transaction-form');

    addTransactionBtn.addEventListener('click', () => {
        document.getElementById('transaction-date').valueAsDate = new Date();
        modal.classList.add('show');
    });
    closeButton.addEventListener('click', () => modal.classList.remove('show'));
    window.addEventListener('click', e => { if (e.target === modal) modal.classList.remove('show'); });
    // setupProfilePageEvents ফাংশনের ভেতরে
transactionForm.addEventListener('submit', (event) => {
    event.preventDefault();
    
    const type = transactionForm.querySelector('input[name="transaction-type"]:checked').value;
    const amount = Number(document.getElementById('transaction-amount').value);
    const dateInput = document.getElementById('transaction-date').value;
    const date = new Date(dateInput).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    
    if (!amount || amount <= 0) {
        alert('Please enter a valid amount.');
        return;
    }
    
    // এডিটিং ID চেক করো
    const editingId = Number(transactionForm.getAttribute('data-editing-id'));
    let transactions = getData('transactions');
    let customers = getData('customers');
    const customerId = Number(getQueryParam('id'));
    
    if (editingId) {
        // ============= এডিট মোড =============
        const txIndex = transactions.findIndex(tx => tx.id === editingId);
        if (txIndex === -1) return;
        
        const oldTx = transactions[txIndex];
        const customerIndex = customers.findIndex(c => c.id === oldTx.customerId);
        if (customerIndex === -1) return;
        
        // ১. পুরনো লেনদেনের প্রভাব ব্যালেন্স থেকে বাতিল করো
        if (oldTx.type === 'Due') {
            customers[customerIndex].balance -= oldTx.amount;
        } else {
            customers[customerIndex].balance += oldTx.amount;
        }
        
        // ২. নতুন লেনদেনের প্রভাব ব্যালেন্সে যোগ করো
        if (type === 'Due') {
            customers[customerIndex].balance += amount;
        } else {
            customers[customerIndex].balance -= amount;
        }
        
        // ৩. লেনদেনটি আপডেট করো
        transactions[txIndex].type = type;
        transactions[txIndex].amount = amount;
        transactions[txIndex].date = date;
        
    } else {
        // ============= অ্যাড মোড (আগের মতোই) =============
        const customerIndex = customers.findIndex(c => c.id === customerId);
        if (customerIndex === -1) return;
        
        const newTransaction = {
            id: Date.now(),
            customerId,
            customerName: customers[customerIndex].name,
            type,
            amount,
            date
        };
        transactions.push(newTransaction);
        
        if (type === 'Due') customers[customerIndex].balance += amount;
        else customers[customerIndex].balance -= amount;
    }
    
    // ডেটা সেভ করো
    localStorage.setItem('transactions', JSON.stringify(transactions));
    localStorage.setItem('customers', JSON.stringify(customers));
    
    // Modal বন্ধ করো এবং পেজ রিফ্রেশ করো
    document.getElementById('add-transaction-modal').classList.remove('show');
    transactionForm.reset();
    transactionForm.removeAttribute('data-editing-id');
    document.querySelector('#add-transaction-modal .modal-header h2').textContent = 'Add Transaction'; // টাইটেল রিসেট
    renderCustomerProfilePage();
});


    // ===============================================
    // নতুন লজিক: লেনদেন আইটেমে ক্লিক হ্যান্ডেল করা
    // ===============================================
    transactionListContainer.addEventListener('click', (event) => {
        const target = event.target;
        const transactionItem = target.closest('.transaction-item');
        if (!transactionItem) return;

        const transactionId = Number(transactionItem.getAttribute('data-transaction-id'));

        // --- ডিলিট বাটন ক্লিক হলে ---
        if (target.matches('.delete-transaction-btn')) {
            if (confirm('Are you sure you want to delete this transaction? This action cannot be undone.')) {
                let transactions = getData('transactions');
                let customers = getData('customers');

                const txToDelete = transactions.find(tx => tx.id === transactionId);
                if (!txToDelete) return;
                
                // গ্রাহকের ব্যালেন্স ঠিক করো
                const customerIndex = customers.findIndex(c => c.id === txToDelete.customerId);
                if (customerIndex > -1) {
                    if (txToDelete.type === 'Due') {
                        customers[customerIndex].balance -= txToDelete.amount; // बाकी কমে গেলো
                    } else if (txToDelete.type === 'Payment') {
                        customers[customerIndex].balance += txToDelete.amount; // পেমেন্ট ফেরত গেলো, তাই बाकी বাড়লো
                    }
                }
                
                // লেনদেনটি তালিকা থেকে বাদ দাও
                transactions = transactions.filter(tx => tx.id !== transactionId);

                localStorage.setItem('customers', JSON.stringify(customers));
                localStorage.setItem('transactions', JSON.stringify(transactions));
                
                renderCustomerProfilePage(); // পেজ রিফ্রেশ করো
            }
        }

else if (target.matches('.edit-transaction-btn')) {
    const transactions = getData('transactions');
    const txToEdit = transactions.find(tx => tx.id === transactionId);
    
    if (txToEdit) {
        const modal = document.getElementById('add-transaction-modal');
        const form = document.getElementById('add-transaction-form');
        const modalTitle = modal.querySelector('.modal-header h2');
        
        // Modal-এর টাইটেল পরিবর্তন করো
        modalTitle.textContent = 'Edit Transaction';
        
        // ফর্মের ইনপুট ফিল্ডগুলো পুরনো তথ্য দিয়ে পূরণ করো
        form.querySelector(`input[name="transaction-type"][value="${txToEdit.type}"]`).checked = true;
        form.querySelector('#transaction-amount').value = txToEdit.amount;
        
        // তারিখটিকে YYYY-MM-DD ফরম্যাটে রূপান্তর করো
        const dateObj = new Date(txToEdit.date + ' ' + new Date().getFullYear()); // বছর যোগ করা হলো
        const formattedDate = dateObj.toISOString().split('T')[0];
        form.querySelector('#transaction-date').value = formattedDate;

        // ফর্মে এডিটিং ID সেট করো
        form.setAttribute('data-editing-id', transactionId);
        
        // Modal দেখাও
        modal.classList.add('show');
    }
}
        // --- লেনদেনের অন্য কোনো জায়গায় ক্লিক হলে ---
        else {
            // অন্য সব আইটেম থেকে 'show-actions' ক্লাসটি সরিয়ে দাও
            document.querySelectorAll('.transaction-item.show-actions').forEach(item => {
                if (item !== transactionItem) {
                    item.classList.remove('show-actions');
                }
            });
            // বর্তমান আইটেমে ক্লাসটি টগল করো
            transactionItem.classList.toggle('show-actions');
        }
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
        const blob = new Blob([dataStr], { type: 'application/json' });
        
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