// API Configuration
const API_BASE_URL = 'http://localhost:5000/api';

// Authentication Functions
function getToken() {
    return localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
}

function removeToken() {
    localStorage.removeItem('authToken');
    sessionStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
    localStorage.removeItem('rememberMe');
}

function checkAuthentication() {
    const token = getToken();
    console.log('checkAuthentication - Token:', !!token); // Debug log

    if (!token) {
        console.log('No token found, but allowing page to load'); // Debug log
        // Don't redirect immediately, just show a warning
        return true;
    }
    return true;
}

function checkAuthenticationSoftly() {
    // This function checks authentication without blocking the page
    const token = localStorage.getItem('authToken');
    console.log('Soft auth check - Token found:', !!token);

    if (token) {
        // Try to get user info from API
        fetch(`${API_BASE_URL}/profile`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    updateUserInfo(data.user);
                } else {
                    loadUserFromStorage();
                }
            })
            .catch(error => {
                console.error('Error fetching user profile:', error);
                loadUserFromStorage();
            });
    } else {
        // Try localStorage first
        loadUserFromStorage();
    }
}

function logout() {
    const token = getToken();

    if (token) {
        fetch(`${API_BASE_URL}/logout`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        })
            .finally(() => {
                removeToken();
                window.location.href = 'index.html';
            });
    } else {
        window.location.href = 'index.html';
    }
}

// Initialize page
document.addEventListener('DOMContentLoaded', function () {
    console.log('Add Medicine page loading...'); // Debug log

    // Initialize page components first
    initializePage();

    // Check authentication without blocking
    checkAuthenticationSoftly();
});

function initializePage() {

    // Add logout functionality
    const logoutButtons = document.querySelectorAll('.logout-btn, [data-action="logout"]');
    logoutButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            if (confirm('Are you sure you want to logout?')) {
                logout();
            }
        });
    });

    // Update user info with authentication check
    const token = localStorage.getItem('authToken');
    console.log('Token found:', !!token); // Debug log

    if (token) {
        // Try to get user info from API first
        fetch(`${API_BASE_URL}/profile`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        })
            .then(response => {
                console.log('Profile response status:', response.status); // Debug log
                return response.json();
            })
            .then(data => {
                console.log('Profile data:', data); // Debug log
                if (data.success) {
                    updateUserInfo(data.user);
                } else {
                    // Fallback to localStorage
                    loadUserFromStorage();
                }
            })
            .catch(error => {
                console.error('Error fetching user profile:', error);
                loadUserFromStorage();
            });
    } else {
        // Try localStorage first before redirecting
        loadUserFromStorage();
    }

    function updateUserInfo(user) {
        const userNameElements = document.querySelectorAll('.user-name');
        userNameElements.forEach(el => {
            // Display just the first name if lastName is "User", otherwise show full name
            const displayName = user.lastName === 'User' ? user.firstName : `${user.firstName} ${user.lastName}`;
            el.textContent = displayName;
            el.style.opacity = '0';
            setTimeout(() => {
                el.style.opacity = '1';
            }, 100);
        });

        const roleElements = document.querySelectorAll('.user-role');
        roleElements.forEach(el => {
            el.textContent = user.role.charAt(0).toUpperCase() + user.role.slice(1);
        });

        // Store for future use
        localStorage.setItem('currentUser', JSON.stringify(user));
    }

    function loadUserFromStorage() {
        const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
        console.log('Current user from storage:', currentUser); // Debug log

        if (currentUser.firstName) {
            updateUserInfo(currentUser);
        } else {
            // Show default user info instead of redirecting immediately
            const userNameElements = document.querySelectorAll('.user-name');
            userNameElements.forEach(el => {
                el.textContent = 'User';
            });
            console.log('No user data found, showing default'); // Debug log
        }
    }

    // Set default purchase date to today
    const purchaseDateInput = document.getElementById("purchaseDate");
    if (purchaseDateInput) {
        purchaseDateInput.value = new Date().toISOString().split('T')[0];
    }

    // Setup category dropdown functionality
    setupCategoryDropdown();
}

function setupCategoryDropdown() {
    const categorySelect = document.getElementById("category");
    const customCategoryInput = document.getElementById("customCategory");

    if (categorySelect && customCategoryInput) {
        categorySelect.addEventListener('change', function () {
            if (this.value === 'Other') {
                customCategoryInput.style.display = 'block';
                customCategoryInput.required = true;
                customCategoryInput.focus();
            } else {
                customCategoryInput.style.display = 'none';
                customCategoryInput.required = false;
                customCategoryInput.value = '';
            }
        });
    }
}

document.getElementById("medicineForm").addEventListener("submit", function (e) {
    e.preventDefault();

    // Validate expiry date
    const expiryDate = new Date(document.getElementById("expiryDate").value);
    const purchaseDate = new Date(document.getElementById("purchaseDate").value);
    const today = new Date();

    if (expiryDate <= today) {
        alert("Expiry date must be in the future!");
        return;
    }

    if (purchaseDate > today) {
        alert("Purchase date cannot be in the future!");
        return;
    }
    if (expiryDate <= purchaseDate) {
        alert("Expiry date must be after purchase date!");
        return;
    }

    // 🔍 Validate batch number
    const batchNo = document.getElementById("batchNo").value.trim();
    const batchRegex = /^(?=.*[A-Za-z])(?=.*[0-9])[A-Za-z0-9]{4,10}$/;
    if (!batchRegex.test(batchNo)) {
        alert("❌ Invalid Batch Number.\n\nRules:\n- Must contain at least 1 letter and 1 number\n- Length 4–10 characters\n- Only letters (A–Z) and numbers (0–9), no spaces/symbols");
        return;
    }

    // Get category value (either from dropdown or custom input)
    const categorySelect = document.getElementById("category");
    const customCategoryInput = document.getElementById("customCategory");
    const categoryValue = categorySelect.value === 'Other' ? customCategoryInput.value : categorySelect.value;

    const medicine = {
        name: document.getElementById("medicineName").value,
        batchNo: document.getElementById("batchNo").value,
        category: categoryValue,
        quantity: parseInt(document.getElementById("quantity").value),
        unit: document.getElementById("unit").value,
        price: parseFloat(document.getElementById("price").value),
        expiryDate: document.getElementById("expiryDate").value,
        manufacturer: document.getElementById("manufacturer")?.value || 'N/A',
        purchaseDate: document.getElementById("purchaseDate").value,
        description: document.getElementById("description").value,
        id: Date.now().toString() // Add unique ID for better tracking
    };

    // Submit to API
    const token = getToken();
    if (!token) {
        alert('Authentication required. Please login again.');
        window.location.href = 'index.html';
        return;
    }

    // Show loading state
    const submitBtn = document.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Adding Medicine...';
    submitBtn.disabled = true;

    fetch(`${API_BASE_URL}/medicines`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(medicine)
    })
        .then(response => {
            if (!response.ok) {
                if (response.status === 401) {
                    removeToken();
                    window.location.href = 'index.html';
                    return;
                }
                throw new Error('Failed to add medicine');
            }
            return response.json();
        })
        .then(data => {
            // Also store in localStorage for offline access
            const medicines = JSON.parse(localStorage.getItem("medicines")) || [];
            medicines.push({
                ...medicine,
                id: data._id || Date.now().toString(),
                addedDate: new Date().toISOString().split('T')[0]
            });
            localStorage.setItem("medicines", JSON.stringify(medicines));

            // Show success message
            alert(`Medicine "${medicine.name}" added successfully!\nQuantity: ${medicine.quantity} ${medicine.unit}\nExpiry: ${new Date(medicine.expiryDate).toLocaleDateString()}`);

            // Reset form
            document.getElementById("medicineForm").reset();

            // Set default purchase date to today
            document.getElementById("purchaseDate").value = new Date().toISOString().split('T')[0];
        })
        .catch(error => {
            console.error('Error adding medicine:', error);
            alert('Failed to add medicine. Please try again.');
        })
        .finally(() => {
            // Reset button state
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        });
});

// Set default purchase date to today on page load (moved to main DOMContentLoaded handler above)
