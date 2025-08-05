const API_BASE_URL = 'http://localhost:5000/api';

document.addEventListener("DOMContentLoaded", function() {
  console.log('Inventory page loading...'); // Debug log

  // Allow page to load first, then check authentication
  setTimeout(() => {
    checkAuthentication();
  }, 100);

  loadInventory();
  setupFilters();
  setupLogout();
});

function checkAuthentication() {
  const token = localStorage.getItem('authToken');
  console.log('Inventory - Token found:', !!token); // Debug log

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
    console.log('Inventory - Profile response status:', response.status); // Debug log
    return response.json();
  })
  .then(data => {
    console.log('Inventory - Profile data:', data); // Debug log
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
  console.log('Inventory - Current user from storage:', currentUser); // Debug log

  if (currentUser.firstName) {
    updateUserInfo(currentUser);
  } else {
    // Show default user info instead of redirecting immediately
    const userNameElements = document.querySelectorAll('.user-name');
    userNameElements.forEach(el => {
      el.textContent = 'User';
    });
    console.log('Inventory - No user data found, showing default'); // Debug log
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

function loadInventory() {
  const medicines = JSON.parse(localStorage.getItem("medicines")) || [];
  const tbody = document.getElementById("inventoryBody");
  const categoryFilter = document.getElementById("categoryFilter");
  
  // Clear existing content
  tbody.innerHTML = "";
  
  // Populate category filter
  const categories = [...new Set(medicines.map(med => med.category).filter(Boolean))];
  categoryFilter.innerHTML = '<option value="">All Categories</option>';
  categories.forEach(category => {
    categoryFilter.innerHTML += `<option value="${category}">${category}</option>`;
  });

  if (medicines.length === 0) {
    tbody.innerHTML = '<tr><td colspan="9" style="text-align: center; padding: 20px; color: #666;">No medicines in inventory</td></tr>';
    return;
  }

  let totalStock = 0;
  let expiredCount = 0;
  let lowStockCount = 0;
  let totalValue = 0;
  const today = new Date();

  medicines.forEach((med, index) => {
    const expDate = new Date(med.expiryDate || med.expiry);
    const daysUntilExpiry = Math.ceil((expDate - today) / (1000 * 60 * 60 * 24));
    
    let status = "Valid";
    let statusClass = "status-valid";
    let rowClass = "valid-row";

    if (daysUntilExpiry < 0) {
      status = "Expired";
      statusClass = "status-expired";
      rowClass = "expired-row";
      expiredCount++;
    } else if (daysUntilExpiry <= 30) {
      status = "Expiring Soon";
      statusClass = "status-soon";
      rowClass = "expiring-row";
    }

    // Automatic low stock detection: 2 strips or less
    if (med.quantity <= 2) {
      lowStockCount++;
      if (status === "Valid") {
        status = "Low Stock";
        statusClass = "status-low-stock";
        rowClass = "low-stock-row";
      }
    }

    totalStock += parseInt(med.quantity);
    totalValue += (med.quantity * med.price);

    const row = document.createElement("tr");
    row.className = rowClass;
    row.innerHTML = `
      <td><strong>${med.name}</strong></td>
      <td>${med.manufacturer || 'N/A'}</td>
      <td><span class="category-badge">${med.category || 'General'}</span></td>
      <td>${med.batchNo || med.batch}</td>
      <td>${med.quantity} ${med.unit}</td>
      <td>₹${med.price.toFixed(2)}</td>
      <td>${new Date(med.expiryDate || med.expiry).toLocaleDateString()}</td>
      <td><span class="${statusClass}">${status}</span></td>
      <td>
        <button class="btn-small btn-edit" onclick="editMedicine(${index})">Edit</button>
        <button class="btn-small btn-delete" onclick="deleteMedicine(${index})">Delete</button>
      </td>
    `;
    tbody.appendChild(row);
  });

  // Update summary cards
  document.getElementById('totalStock').textContent = `Total Stock: ${totalStock}`;
  document.getElementById('expiredStock').textContent = `Expired: ${expiredCount}`;
  document.getElementById('lowStock').textContent = `Low Stock: ${lowStockCount}`;
  document.getElementById('totalValue').textContent = `Total Value: ₹${totalValue.toFixed(2)}`;
}

function setupFilters() {
  const searchInput = document.getElementById("searchInput");
  const categoryFilter = document.getElementById("categoryFilter");
  const statusFilter = document.getElementById("statusFilter");

  [searchInput, categoryFilter, statusFilter].forEach(element => {
    element.addEventListener("input", filterInventory);
  });
}

function filterInventory() {
  const searchTerm = document.getElementById("searchInput").value.toLowerCase();
  const categoryFilter = document.getElementById("categoryFilter").value;
  const statusFilter = document.getElementById("statusFilter").value;
  const rows = document.querySelectorAll("#inventoryBody tr");

  rows.forEach(row => {
    if (row.children.length === 1) return; // Skip "no medicines" row
    
    const name = row.children[0].textContent.toLowerCase();
    const manufacturer = row.children[1].textContent.toLowerCase();
    const category = row.children[2].textContent;
    const statusText = row.children[7].textContent.toLowerCase();
    
    const matchesSearch = name.includes(searchTerm) || manufacturer.includes(searchTerm);
    const matchesCategory = !categoryFilter || category.includes(categoryFilter);
    const matchesStatus = !statusFilter || 
      (statusFilter === 'valid' && statusText.includes('valid')) ||
      (statusFilter === 'expiring' && statusText.includes('expiring')) ||
      (statusFilter === 'expired' && statusText.includes('expired')) ||
      (statusFilter === 'low-stock' && statusText.includes('low stock'));

    row.style.display = matchesSearch && matchesCategory && matchesStatus ? '' : 'none';
  });
}

function editMedicine(index) {
  const medicines = JSON.parse(localStorage.getItem("medicines")) || [];
  const medicine = medicines[index];
  
  // Simple edit - you can enhance this with a modal
  const newQuantity = prompt(`Edit quantity for ${medicine.name}:`, medicine.quantity);
  if (newQuantity && !isNaN(newQuantity) && newQuantity > 0) {
    medicines[index].quantity = parseInt(newQuantity);
    localStorage.setItem("medicines", JSON.stringify(medicines));
    loadInventory();
  }
}

function deleteMedicine(index) {
  const medicines = JSON.parse(localStorage.getItem("medicines")) || [];
  const medicine = medicines[index];
  
  if (confirm(`Are you sure you want to delete ${medicine.name}?`)) {
    medicines.splice(index, 1);
    localStorage.setItem("medicines", JSON.stringify(medicines));
    loadInventory();
  }
}
