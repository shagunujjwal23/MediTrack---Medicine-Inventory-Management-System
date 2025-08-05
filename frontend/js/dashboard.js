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
    if (!token) {
        redirectToLogin();
        return false;
    }

    // Verify token with server
    fetch(`${API_BASE_URL}/profile`, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Token invalid');
        }
        return response.json();
    })
    .then(data => {
        if (data.success) {
            updateUserInfo(data.user);
        } else {
            throw new Error('Authentication failed');
        }
    })
    .catch(error => {
        console.error('Authentication error:', error);
        removeToken();
        redirectToLogin();
    });

    return true;
}

function redirectToLogin() {
    window.location.href = 'index.html';
}

function updateUserInfo(user) {
    // Update user display in the sidebar or header
    const userElements = document.querySelectorAll('.user-name');
    userElements.forEach(el => {
        // Display just the first name if lastName is "User", otherwise show full name
        const displayName = user.lastName === 'User' ? user.firstName : `${user.firstName} ${user.lastName}`;
        el.textContent = displayName;
        // Add a smooth transition effect
        el.style.opacity = '0';
        setTimeout(() => {
            el.style.opacity = '1';
        }, 100);
    });

    const roleElements = document.querySelectorAll('.user-role');
    roleElements.forEach(el => {
        el.textContent = user.role.charAt(0).toUpperCase() + user.role.slice(1);
    });

    // Store user info in localStorage for other pages
    localStorage.setItem('currentUser', JSON.stringify(user));
}

function logout() {
    const token = getToken();

    if (token) {
        // Call logout endpoint
        fetch(`${API_BASE_URL}/logout`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        })
        .finally(() => {
            removeToken();
            redirectToLogin();
        });
    } else {
        redirectToLogin();
    }
}

// API Functions
async function fetchMedicines() {
    const token = getToken();
    if (!token) {
        throw new Error('No authentication token');
    }

    const response = await fetch(`${API_BASE_URL}/medicines`, {
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    });

    if (!response.ok) {
        if (response.status === 401) {
            removeToken();
            redirectToLogin();
            return;
        }
        throw new Error('Failed to fetch medicines');
    }

    const data = await response.json();
    return data;
}

// Initialize Dashboard
document.addEventListener("DOMContentLoaded", () => {
    // Check authentication first
    if (!checkAuthentication()) {
        return;
    }

    const content = document.querySelector('.main-content');
    if (content) {
        content.classList.add('visible');
    }

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

    // Load dashboard data
    loadDashboardData();
    setInterval(loadDashboardData, 30000); // Refresh every 30 seconds
});

async function loadDashboardData() {
  try {
    // Test API connectivity first
    console.log('Testing API connectivity...');
    const testResponse = await fetch(`${API_BASE_URL}/medicines`);
    console.log('API test response status:', testResponse.status);

    if (!testResponse.ok) {
      throw new Error(`API returned status ${testResponse.status}`);
    }

    const medicines = await testResponse.json();
    console.log('Fetched medicines from API:', medicines);
    processMedicineData(medicines);
  } catch (error) {
    console.error('Error fetching medicines from API:', error);
    // Clear potentially corrupted localStorage data
    localStorage.removeItem('medicines');
    // Use empty array instead of corrupted data
    console.log('Using empty array due to API error');
    processMedicineData([]);
  }
}

function processMedicineData(medicines) {
  console.log('Processing medicines data:', medicines);
  const today = new Date();

  let totalCount = medicines.length;
  let expiredCount = 0;
  let lowStockCount = 0;
  let expiringCount = 0;
  let validCount = 0;
  let totalValue = 0;

  medicines.forEach((med) => {
    const expDate = new Date(med.expiryDate || med.expiry);
    const daysUntilExpiry = Math.ceil((expDate - today) / (1000 * 60 * 60 * 24));

    // Ensure quantity is a valid positive number
    const quantity = parseInt(med.quantity) || 0;
    if (quantity < 0) {
      console.warn('Invalid negative quantity found:', med);
      return; // Skip this medicine
    }

    totalValue += (quantity * med.price);

    if (daysUntilExpiry < 0) {
      expiredCount++;
    } else if (daysUntilExpiry <= 30) {
      expiringCount++;
    } else {
      validCount++;
    }

    // Automatic low stock detection: 2 strips or less
    if (quantity <= 2) {
      lowStockCount++;
    }
  });

  // Debug logging
  console.log('Dashboard counts:', {
    totalCount,
    expiredCount,
    lowStockCount,
    validCount
  });

  // Update summary cards with animation
  animateCounter('totalMedicines', totalCount);
  animateCounter('expiredMedicines', expiredCount);
  animateCounter('lowStock', lowStockCount);

  const totalValueElement = document.getElementById('totalValue');
  if (totalValueElement) {
    totalValueElement.textContent = `₹${totalValue.toFixed(2)}`;
  }

  // Update charts
  updateExpiryChart(validCount, expiringCount, expiredCount, totalCount);

  // Show recent additions
  showRecentAdditions(medicines);
}

function animateCounter(elementId, targetValue) {
  const element = document.getElementById(elementId);
  // Always start from 0 to avoid negative number issues
  const currentValue = 0;
  const increment = targetValue > currentValue ? 1 : -1;
  const duration = 1000;
  const steps = Math.abs(targetValue - currentValue);
  const stepDuration = steps > 0 ? duration / steps : 0;

  let current = currentValue;
  const timer = setInterval(() => {
    current += increment;
    element.textContent = current;

    if (current === targetValue) {
      clearInterval(timer);
    }
  }, stepDuration);
}

function updateExpiryChart(valid, expiring, expired, total) {
  if (total === 0) return;
  
  const validPercent = (valid / total) * 100;
  const expiringPercent = (expiring / total) * 100;
  const expiredPercent = (expired / total) * 100;
  
  document.getElementById('validBar').style.width = `${validPercent}%`;
  document.getElementById('expiringBar').style.width = `${expiringPercent}%`;
  document.getElementById('expiredBar').style.width = `${expiredPercent}%`;
  
  // Add tooltips
  document.getElementById('validBar').title = `${valid} medicines (${validPercent.toFixed(1)}%)`;
  document.getElementById('expiringBar').title = `${expiring} medicines (${expiringPercent.toFixed(1)}%)`;
  document.getElementById('expiredBar').title = `${expired} medicines (${expiredPercent.toFixed(1)}%)`;
}

function showRecentAdditions(medicines) {
  const recentList = document.getElementById('recentList');
  const recent = medicines
    .sort((a, b) => new Date(b.addedDate || 0) - new Date(a.addedDate || 0))
    .slice(0, 5);
  
  if (recent.length === 0) {
    recentList.innerHTML = '<p class="no-data">No recent additions</p>';
    return;
  }
  
  recentList.innerHTML = recent.map(med => `
    <div class="recent-item">
      <div class="recent-info">
        <strong>${med.name}</strong>
        <small>${med.manufacturer || 'Unknown'} • ${med.quantity} ${med.unit}</small>
      </div>
      <div class="recent-date">
        ${med.addedDate ? new Date(med.addedDate).toLocaleDateString() : 'Unknown'}
      </div>
    </div>
  `).join('');
}
