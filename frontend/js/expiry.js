const API_BASE_URL = 'http://localhost:5000/api';

document.addEventListener('DOMContentLoaded', () => {
  console.log('Expiry page loading...'); // Debug log

  // Allow page to load first, then check authentication
  setTimeout(() => {
    checkAuthentication();
  }, 100);

  loadExpiryData();
  setupLogout();
  setupEventListeners();
});

function checkAuthentication() {
  const token = localStorage.getItem('authToken');
  console.log('Expiry - Token found:', !!token); // Debug log

  if (!token) {
    // Try localStorage first before redirecting
    loadUserFromStorage();
    return true; // Don't block page loading
  }

  // Verify token and load user info
  fetch(`${API_BASE_URL}/profile`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  })
  .then(response => {
    console.log('Expiry - Profile response status:', response.status); // Debug log
    return response.json();
  })
  .then(data => {
    console.log('Expiry - Profile data:', data); // Debug log
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

  return true;
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

  localStorage.setItem('currentUser', JSON.stringify(user));
}

function loadUserFromStorage() {
  const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
  console.log('Expiry - Current user from storage:', currentUser); // Debug log

  if (currentUser.firstName) {
    updateUserInfo(currentUser);
  } else {
    // Show default user info instead of redirecting immediately
    const userNameElements = document.querySelectorAll('.user-name');
    userNameElements.forEach(el => {
      el.textContent = 'User';
    });
    console.log('Expiry - No user data found, showing default'); // Debug log
  }
}

function setupLogout() {
  const logoutButtons = document.querySelectorAll('.logout-btn, [data-action="logout"]');
  logoutButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      if (confirm('Are you sure you want to logout?')) {
        logout();
      }
    });
  });
}

function logout() {
  const token = localStorage.getItem('authToken');

  if (token) {
    fetch(`${API_BASE_URL}/logout`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })
    .finally(() => {
      localStorage.removeItem('authToken');
      localStorage.removeItem('currentUser');
      window.location.href = 'index.html';
    });
  } else {
    window.location.href = 'index.html';
  }
}

function loadExpiryData() {
  const today = new Date();
  const data = JSON.parse(localStorage.getItem('medicines')) || [];
  const filterDays = parseInt(document.getElementById('filterDays')?.value || 30);

  let expired = [];
  let expiringSoon = [];
  let valid = [];

  data.forEach((medicine) => {
    const expDate = new Date(medicine.expiry || medicine.expiryDate);
    const diffDays = Math.ceil((expDate - today) / (1000 * 60 * 60 * 24));

    // Add expiry categorization
    if (diffDays < 0) expired.push({...medicine, daysUntilExpiry: diffDays});
    else if (diffDays <= filterDays) expiringSoon.push({...medicine, daysUntilExpiry: diffDays});
    else valid.push({...medicine, daysUntilExpiry: diffDays});


  });

  // Sort by expiry date
  const sortBy = document.getElementById('sortFilter')?.value || 'expiry';
  [expired, expiringSoon, valid].forEach(list => {
    sortMedicineList(list, sortBy);
  });

  // Update counts
  document.getElementById('expiredCount').textContent = expired.length;
  document.getElementById('expiringSoonCount').textContent = expiringSoon.length;
  document.getElementById('validCount').textContent = valid.length;

  // Render lists with new modern cards
  renderModernList('expiredList', expired, 'expired');
  renderModernList('expiringSoonList', expiringSoon, 'expiring');
  renderModernList('validList', valid, 'valid');

  // Initialize tab functionality
  initializeTabs();
}

function renderModernList(containerId, list, category) {
  const container = document.getElementById(containerId);
  container.innerHTML = '';

  if (list.length === 0) {
    const emptyMessages = {
      'expired': 'No expired medicines found.',
      'expiring': 'No medicines expiring soon.',
      'valid': 'No valid medicines found.'
    };

    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">
          <i class="fas fa-box-open"></i>
        </div>
        <h3>No medicines in this category</h3>
        <p>${emptyMessages[category] || 'No medicines found.'}</p>
      </div>
    `;
    return;
  }

  list.forEach((med) => {
    const card = document.createElement('div');
    card.className = `medicine-card-modern ${category}`;

    const expiryDate = new Date(med.expiry || med.expiryDate);
    const formattedDate = expiryDate.toLocaleDateString();
    const daysText = med.daysUntilExpiry < 0 ?
      `${Math.abs(med.daysUntilExpiry)} days ago` :
      `${med.daysUntilExpiry} days left`;

    let badgeText = '';
    let statusInfo = '';
    if (category === 'expired') {
      badgeText = 'Expired';
      statusInfo = daysText;
    } else if (category === 'expiring') {
      badgeText = 'Expiring Soon';
      statusInfo = daysText;
    } else {
      badgeText = 'Valid';
      statusInfo = daysText;
    }

    // Remove old actionButtons variable as we're using enhancedActionButtons

    // Enhanced action buttons for all categories
    let enhancedActionButtons = '';
    if (category === 'expired') {
      enhancedActionButtons = `
        <div class="card-actions">
          <button class="action-btn-small dispose-btn" onclick="disposeMedicine('${med.id || med.name}')">
            <i class="fas fa-trash"></i> Dispose
          </button>
          <button class="action-btn-small edit-btn" onclick="editMedicine('${med.id || med.name}')">
            <i class="fas fa-edit"></i> Edit
          </button>
        </div>
      `;

    } else {
      enhancedActionButtons = `
        <div class="card-actions">
          <button class="action-btn-small edit-btn" onclick="editMedicine('${med.id || med.name}')">
            <i class="fas fa-edit"></i> Edit
          </button>
          <button class="action-btn-small delete-btn" onclick="deleteMedicine('${med.id || med.name}')">
            <i class="fas fa-trash"></i> Delete
          </button>
        </div>
      `;
    }

    // Calculate urgency level for visual indicators
    let urgencyClass = '';
    if (category === 'expired') {
      urgencyClass = 'critical-urgency';
    } else if (category === 'expiring' && med.daysUntilExpiry <= 7) {
      urgencyClass = 'high-urgency';
    } else if (category === 'expiring' && med.daysUntilExpiry <= 30) {
      urgencyClass = 'medium-urgency';
    }

    card.innerHTML = `
      <div class="medicine-header">
        <h3 class="medicine-name">${med.name || med.medicineName}</h3>
        <span class="expiry-badge ${category} ${urgencyClass}">${badgeText}</span>
      </div>
      <div class="medicine-details">
        <div class="detail-item">
          <span class="detail-label">💊 Manufacturer</span>
          <span class="detail-value">${med.manufacturer || 'N/A'}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">🏷️ Batch Number</span>
          <span class="detail-value">${med.batch || med.batchNo || med.batchNumber || 'N/A'}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">📦 Quantity</span>
          <span class="detail-value quantity">${med.quantity} ${med.unit || 'units'}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">📅 Expiry Date</span>
          <span class="detail-value expiry-date">${formattedDate}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">⏰ Status</span>
          <span class="detail-value ${category === 'expired' ? 'text-danger' : category === 'expiring' ? 'text-warning' : 'text-success'}">${statusInfo}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">💰 Price</span>
          <span class="detail-value price">₹${parseFloat(med.price || 0).toFixed(2)}</span>
        </div>

        ${med.description ? `
        <div class="detail-item full-width">
          <span class="detail-label">📝 Description</span>
          <span class="detail-value">${med.description}</span>
        </div>
        ` : ''}
      </div>
      ${enhancedActionButtons}
    `;
    container.appendChild(card);
  });
}

function initializeTabs() {
  const tabButtons = document.querySelectorAll('.tab-btn');
  const tabContents = document.querySelectorAll('.medicine-grid');

  tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      // Remove active class from all buttons
      tabButtons.forEach(btn => btn.classList.remove('active'));
      // Add active class to clicked button
      button.classList.add('active');

      // Hide all tab contents
      tabContents.forEach(content => content.style.display = 'none');

      // Show selected tab content
      const targetTab = button.getAttribute('data-tab');
      const targetContent = document.querySelector(`[data-category="${targetTab}"]`);
      if (targetContent) {
        targetContent.style.display = 'grid';
      }
    });
  });
}

function showCategory(category) {
  // Find and click the corresponding tab
  const tabButton = document.querySelector(`[data-tab="${category}"]`);
  if (tabButton) {
    tabButton.click();
  }
}

// Legacy function for compatibility
function toggleList(id) {
  const category = id.replace('List', '').replace('expiringSoon', 'expiring');
  showCategory(category);
}

// New utility functions
function setupEventListeners() {
  // Sort filter
  const sortFilter = document.getElementById('sortFilter');
  if (sortFilter) {
    sortFilter.addEventListener('change', loadExpiryData);
  }

  // Days filter
  const filterDays = document.getElementById('filterDays');
  if (filterDays) {
    filterDays.addEventListener('change', loadExpiryData);
  }

  // Export button
  const exportBtn = document.getElementById('exportBtn');
  if (exportBtn) {
    exportBtn.addEventListener('click', exportReport);
  }

  // Refresh button
  const refreshBtn = document.getElementById('refreshBtn');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', () => {
      loadExpiryData();
      showNotification('Data refreshed successfully!', 'success');
    });
  }
}

function sortMedicineList(list, sortBy) {
  list.sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return (a.name || a.medicineName || '').localeCompare(b.name || b.medicineName || '');
      case 'quantity':
        return (b.quantity || 0) - (a.quantity || 0);
      case 'price':
        return (b.price || 0) - (a.price || 0);
      case 'expiry':
      default:
        const dateA = new Date(a.expiry || a.expiryDate);
        const dateB = new Date(b.expiry || b.expiryDate);
        return dateA - dateB;
    }
  });
}

function exportReport() {
  const data = JSON.parse(localStorage.getItem('medicines')) || [];
  const today = new Date();

  let csvContent = 'Medicine Name,Batch No,Quantity,Unit,Price,Expiry Date,Days Until Expiry,Status\n';

  data.forEach(med => {
    const expDate = new Date(med.expiry || med.expiryDate);
    const diffDays = Math.ceil((expDate - today) / (1000 * 60 * 60 * 24));
    let status = 'Valid';
    if (diffDays < 0) status = 'Expired';
    else if (diffDays <= 30) status = 'Expiring Soon';

    csvContent += `"${med.name || med.medicineName}","${med.batch || med.batchNo || ''}",${med.quantity},"${med.unit || 'units'}",${med.price || 0},"${expDate.toLocaleDateString()}",${diffDays},"${status}"\n`;
  });

  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `medicine-expiry-report-${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  window.URL.revokeObjectURL(url);

  showNotification('Report exported successfully!', 'success');
}

function disposeMedicine(medicineId) {
  if (confirm('Are you sure you want to mark this medicine as disposed? This action cannot be undone.')) {
    const medicines = JSON.parse(localStorage.getItem('medicines')) || [];
    const updatedMedicines = medicines.filter(med => (med.id || med.name) !== medicineId);
    localStorage.setItem('medicines', JSON.stringify(updatedMedicines));
    loadExpiryData();
    showNotification('Medicine marked as disposed', 'success');
  }
}



function showNotification(message, type = 'info') {
  // Create notification element
  const notification = document.createElement('div');
  notification.className = `notification ${type}`;
  notification.innerHTML = `
    <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
    <span>${message}</span>
  `;

  // Add to page
  document.body.appendChild(notification);

  // Show notification
  setTimeout(() => notification.classList.add('show'), 100);

  // Remove notification after 3 seconds
  setTimeout(() => {
    notification.classList.remove('show');
    setTimeout(() => document.body.removeChild(notification), 300);
  }, 3000);
}

// Enhanced functionality for new features
let currentSearchTerm = '';
let currentFilters = {};
let currentView = 'grid';
let currentPage = 1;
let itemsPerPage = 12;

// Search functionality
function setupSearchAndFilters() {
  const searchInput = document.getElementById('medicineSearch');
  const clearSearchBtn = document.getElementById('clearSearch');
  const advancedFiltersBtn = document.getElementById('advancedFilters');
  const advancedFiltersPanel = document.getElementById('advancedFiltersPanel');
  const viewBtns = document.querySelectorAll('.view-btn');

  // Search input
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      currentSearchTerm = e.target.value.toLowerCase();
      clearSearchBtn.style.display = currentSearchTerm ? 'flex' : 'none';
      filterAndDisplayMedicines();
    });
  }

  // Clear search
  if (clearSearchBtn) {
    clearSearchBtn.addEventListener('click', () => {
      searchInput.value = '';
      currentSearchTerm = '';
      clearSearchBtn.style.display = 'none';
      filterAndDisplayMedicines();
    });
  }

  // Advanced filters toggle
  if (advancedFiltersBtn) {
    advancedFiltersBtn.addEventListener('click', () => {
      const isVisible = advancedFiltersPanel.style.display !== 'none';
      advancedFiltersPanel.style.display = isVisible ? 'none' : 'block';
      advancedFiltersBtn.innerHTML = `
        <i class="fas fa-filter"></i>
        ${isVisible ? 'Advanced Filters' : 'Hide Filters'}
      `;
    });
  }

  // View toggle
  viewBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      viewBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentView = btn.dataset.view;
      updateViewMode();
    });
  });

  // Filter controls
  setupFilterControls();
}

function setupFilterControls() {
  const applyFiltersBtn = document.querySelector('.apply-filters-btn');
  const resetFiltersBtn = document.querySelector('.reset-filters-btn');

  if (applyFiltersBtn) {
    applyFiltersBtn.addEventListener('click', applyAdvancedFilters);
  }

  if (resetFiltersBtn) {
    resetFiltersBtn.addEventListener('click', resetAdvancedFilters);
  }
}

function applyAdvancedFilters() {
  const minPrice = document.getElementById('minPrice').value;
  const maxPrice = document.getElementById('maxPrice').value;
  const minQuantity = document.getElementById('minQuantity').value;
  const maxQuantity = document.getElementById('maxQuantity').value;
  const manufacturer = document.getElementById('manufacturerFilter').value;

  currentFilters = {
    minPrice: minPrice ? parseFloat(minPrice) : null,
    maxPrice: maxPrice ? parseFloat(maxPrice) : null,
    minQuantity: minQuantity ? parseInt(minQuantity) : null,
    maxQuantity: maxQuantity ? parseInt(maxQuantity) : null,
    manufacturer: manufacturer || null
  };

  filterAndDisplayMedicines();
  showNotification('Filters applied successfully', 'success');
}

function resetAdvancedFilters() {
  document.getElementById('minPrice').value = '';
  document.getElementById('maxPrice').value = '';
  document.getElementById('minQuantity').value = '';
  document.getElementById('maxQuantity').value = '';
  document.getElementById('manufacturerFilter').value = '';

  currentFilters = {};
  filterAndDisplayMedicines();
  showNotification('Filters reset', 'info');
}

function filterAndDisplayMedicines() {
  const medicines = JSON.parse(localStorage.getItem('medicines')) || [];
  let filteredMedicines = medicines;

  // Apply search filter
  if (currentSearchTerm) {
    filteredMedicines = filteredMedicines.filter(medicine =>
      medicine.name.toLowerCase().includes(currentSearchTerm) ||
      (medicine.manufacturer && medicine.manufacturer.toLowerCase().includes(currentSearchTerm)) ||
      (medicine.batchNumber && medicine.batchNumber.toLowerCase().includes(currentSearchTerm))
    );
  }

  // Apply advanced filters
  if (currentFilters.minPrice !== null) {
    filteredMedicines = filteredMedicines.filter(med => parseFloat(med.price) >= currentFilters.minPrice);
  }
  if (currentFilters.maxPrice !== null) {
    filteredMedicines = filteredMedicines.filter(med => parseFloat(med.price) <= currentFilters.maxPrice);
  }
  if (currentFilters.minQuantity !== null) {
    filteredMedicines = filteredMedicines.filter(med => parseInt(med.quantity) >= currentFilters.minQuantity);
  }
  if (currentFilters.maxQuantity !== null) {
    filteredMedicines = filteredMedicines.filter(med => parseInt(med.quantity) <= currentFilters.maxQuantity);
  }
  if (currentFilters.manufacturer) {
    filteredMedicines = filteredMedicines.filter(med =>
      med.manufacturer && med.manufacturer.toLowerCase().includes(currentFilters.manufacturer.toLowerCase())
    );
  }

  // Update displays with filtered data
  updateMedicineDisplays(filteredMedicines);
}

function updateViewMode() {
  const medicineGrids = document.querySelectorAll('.medicine-grid');
  medicineGrids.forEach(grid => {
    if (currentView === 'list') {
      grid.classList.add('list-view');
      grid.querySelectorAll('.medicine-card-modern').forEach(card => {
        card.classList.add('list-view');
      });
    } else {
      grid.classList.remove('list-view');
      grid.querySelectorAll('.medicine-card-modern').forEach(card => {
        card.classList.remove('list-view');
      });
    }
  });
}

// Quick action functions
function exportExpiredReport() {
  const medicines = JSON.parse(localStorage.getItem('medicines')) || [];
  const expiredMedicines = medicines.filter(medicine => {
    const expiryDate = new Date(medicine.expiryDate);
    return expiryDate < new Date();
  });

  if (expiredMedicines.length === 0) {
    showNotification('No expired medicines to export', 'info');
    return;
  }

  const csvContent = generateCSVReport(expiredMedicines, 'Expired Medicines Report');
  downloadCSV(csvContent, 'expired_medicines_report.csv');
  showNotification('Expired medicines report exported successfully', 'success');
}

function scheduleReminders() {
  showNotification('Reminder scheduling feature coming soon!', 'info');
}



function viewAnalytics() {
  showNotification('Analytics dashboard coming soon!', 'info');
}

function generateCSVReport(medicines, title) {
  const headers = ['Name', 'Quantity', 'Price', 'Expiry Date', 'Manufacturer', 'Batch Number'];
  const csvRows = [
    title,
    '',
    headers.join(','),
    ...medicines.map(med => [
      med.name,
      med.quantity,
      med.price,
      med.expiryDate,
      med.manufacturer || 'N/A',
      med.batchNumber || 'N/A'
    ].join(','))
  ];

  return csvRows.join('\n');
}

function downloadCSV(content, filename) {
  const blob = new Blob([content], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
}

// Update the setupEventListeners function to include new features
function setupEventListeners() {
  // Existing event listeners...

  // Tab switching
  const tabBtns = document.querySelectorAll('.tab-btn');
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetTab = btn.dataset.tab;
      switchTab(targetTab);
    });
  });

  // Sort and filter dropdowns
  const sortFilter = document.getElementById('sortFilter');
  const filterDays = document.getElementById('filterDays');
  const categoryFilter = document.getElementById('categoryFilter');

  if (sortFilter) {
    sortFilter.addEventListener('change', () => {
      loadExpiryData();
    });
  }

  if (filterDays) {
    filterDays.addEventListener('change', () => {
      loadExpiryData();
    });
  }

  if (categoryFilter) {
    categoryFilter.addEventListener('change', (e) => {
      const category = e.target.value;
      if (category === 'all') {
        // Show all tabs or default view
        switchTab('expired');
      } else {
        switchTab(category);
      }
    });
  }

  // Refresh button with loading state
  const refreshBtn = document.getElementById('refreshBtn');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', () => {
      const spinner = refreshBtn.querySelector('.loading-spinner');
      const icon = refreshBtn.querySelector('.fas');

      spinner.style.display = 'inline-block';
      icon.style.display = 'none';
      refreshBtn.disabled = true;

      setTimeout(() => {
        loadExpiryData();
        spinner.style.display = 'none';
        icon.style.display = 'inline-block';
        refreshBtn.disabled = false;
        showNotification('Data refreshed successfully', 'success');
      }, 1000);
    });
  }

  // Setup search and filters
  setupSearchAndFilters();
}

function switchTab(tabName) {
  // Update tab buttons
  const tabBtns = document.querySelectorAll('.tab-btn');
  tabBtns.forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === tabName);
  });

  // Update tab content
  const containers = document.querySelectorAll('.medicine-container');
  containers.forEach(container => {
    container.style.display = container.dataset.category === tabName ? 'block' : 'none';
  });
}

// Additional medicine management functions
function editMedicine(medicineId) {
  const medicines = JSON.parse(localStorage.getItem('medicines')) || [];
  const medicine = medicines.find(med => (med.id || med.name) === medicineId);

  if (!medicine) {
    showNotification('Medicine not found', 'error');
    return;
  }

  // For now, redirect to add medicine page with edit mode
  // In a real application, you might open a modal or navigate to an edit page
  localStorage.setItem('editMedicine', JSON.stringify(medicine));
  window.location.href = 'add-medicine.html?edit=true';
}

function deleteMedicine(medicineId) {
  if (confirm('Are you sure you want to delete this medicine? This action cannot be undone.')) {
    const medicines = JSON.parse(localStorage.getItem('medicines')) || [];
    const updatedMedicines = medicines.filter(med => (med.id || med.name) !== medicineId);
    localStorage.setItem('medicines', JSON.stringify(updatedMedicines));
    loadExpiryData();
    showNotification('Medicine deleted successfully', 'success');
  }
}

// Enhanced data update function
function updateMedicineDisplays(filteredMedicines = null) {
  const medicines = filteredMedicines || JSON.parse(localStorage.getItem('medicines')) || [];

  // Categorize medicines
  const categorizedMedicines = categorizeMedicines(medicines);

  // Update counts in overview cards and tabs
  updateCounts(categorizedMedicines);

  // Update each category display
  Object.keys(categorizedMedicines).forEach(category => {
    displayMedicines(categorizedMedicines[category], category);
  });

  // Update manufacturer filter options
  updateManufacturerFilter(medicines);

  // Update view mode
  updateViewMode();
}

function updateCounts(categorizedMedicines) {
  // Update overview cards
  document.getElementById('expiredCount').textContent = categorizedMedicines.expired.length;
  document.getElementById('expiringSoonCount').textContent = categorizedMedicines.expiring.length;
  document.getElementById('validCount').textContent = categorizedMedicines.valid.length;

  // Update tab counts
  document.getElementById('expiredTabCount').textContent = categorizedMedicines.expired.length;
  document.getElementById('expiringSoonTabCount').textContent = categorizedMedicines.expiring.length;
  document.getElementById('validTabCount').textContent = categorizedMedicines.valid.length;

  // Update trends (mock data for now)
  updateTrends();
}

function updateTrends() {
  // Mock trend data - in a real app, this would come from historical data
  const trends = {
    expired: Math.floor(Math.random() * 5),
    expiring: Math.floor(Math.random() * 8),
    valid: Math.floor(Math.random() * 15)
  };

  Object.keys(trends).forEach(category => {
    const trendElement = document.getElementById(`${category}Trend`);
    if (trendElement) {
      const change = trends[category];
      const isIncrease = change > 0;
      trendElement.innerHTML = `
        <i class="fas fa-arrow-${isIncrease ? 'up' : 'down'}"></i>
        <span>${isIncrease ? '+' : ''}${change} this week</span>
      `;
    }
  });
}

function updateManufacturerFilter(medicines) {
  const manufacturerFilter = document.getElementById('manufacturerFilter');
  if (!manufacturerFilter) return;

  const manufacturers = [...new Set(medicines
    .map(med => med.manufacturer)
    .filter(manufacturer => manufacturer && manufacturer.trim() !== '')
  )].sort();

  // Clear existing options except the first one
  manufacturerFilter.innerHTML = '<option value="">All Manufacturers</option>';

  manufacturers.forEach(manufacturer => {
    const option = document.createElement('option');
    option.value = manufacturer;
    option.textContent = manufacturer;
    manufacturerFilter.appendChild(option);
  });
}

// Enhanced categorization function
function categorizeMedicines(medicines) {
  const today = new Date();
  const categorized = {
    expired: [],
    expiring: [],
    valid: []
  };

  medicines.forEach(medicine => {
    const expiryDate = new Date(medicine.expiryDate || medicine.expiry);
    const timeDiff = expiryDate.getTime() - today.getTime();
    const daysUntilExpiry = Math.ceil(timeDiff / (1000 * 3600 * 24));

    // Add calculated field
    medicine.daysUntilExpiry = daysUntilExpiry;

    // Categorize by expiry
    if (daysUntilExpiry < 0) {
      categorized.expired.push(medicine);
    } else if (daysUntilExpiry <= 30) {
      categorized.expiring.push(medicine);
    } else {
      categorized.valid.push(medicine);
    }
  });

  return categorized;
}

// Initialize enhanced features when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  console.log('Enhanced Expiry page loading...'); // Debug log

  // Allow page to load first, then check authentication
  setTimeout(() => {
    checkAuthentication();
  }, 100);

  loadExpiryData();
  setupLogout();
  setupEventListeners();

  // Initialize enhanced features
  setupSearchAndFilters();
});
