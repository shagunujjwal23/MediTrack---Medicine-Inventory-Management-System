const API_BASE_URL = 'http://localhost:5000/api';

// =========================
// Stock thresholds per unit
// =========================
const unitThresholds = {
  pack: 2,
  bottle: 7,
  vial: 5
};

document.addEventListener("DOMContentLoaded", function () {
  console.log('Inventory page loading...');

  setTimeout(() => {
    checkAuthentication();
  }, 100);

  loadInventory();
  setupFilters();
  setupLogout();
});

// =========================
// Authentication
// =========================
function checkAuthentication() {
  const token = localStorage.getItem('authToken');
  console.log('Inventory - Token found:', !!token);

  if (!token) {
    loadUserFromStorage();
    return true;
  }

  fetch(`${API_BASE_URL}/profile`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  })
    .then(response => {
      console.log('Inventory - Profile response status:', response.status);
      return response.json();
    })
    .then(data => {
      console.log('Inventory - Profile data:', data);
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
    const displayName = user.lastName === 'User' ? user.firstName : `${user.firstName} ${user.lastName}`;
    el.textContent = displayName;
    el.style.opacity = '0';
    setTimeout(() => { el.style.opacity = '1'; }, 100);
  });

  const roleElements = document.querySelectorAll('.user-role');
  roleElements.forEach(el => {
    el.textContent = user.role.charAt(0).toUpperCase() + user.role.slice(1);
  });

  localStorage.setItem('currentUser', JSON.stringify(user));
}

function loadUserFromStorage() {
  const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
  console.log('Inventory - Current user from storage:', currentUser);

  if (currentUser.firstName) {
    updateUserInfo(currentUser);
  } else {
    const userNameElements = document.querySelectorAll('.user-name');
    userNameElements.forEach(el => { el.textContent = 'User'; });
    console.log('Inventory - No user data found, showing default');
  }
}

// =========================
// Logout
// =========================
function setupLogout() {
  const logoutButtons = document.querySelectorAll('.logout-btn, [data-action="logout"]');
  logoutButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      if (confirm('Are you sure you want to logout?')) logout();
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
    }).finally(() => {
      localStorage.removeItem('authToken');
      localStorage.removeItem('currentUser');
      window.location.href = 'index.html';
    });
  } else {
    window.location.href = 'index.html';
  }
}

// =========================
// Load inventory table
// =========================
async function loadInventory() {
  try {
    const res = await fetch(`${API_BASE_URL}/medicines`);
    const medicines = await res.json();

    localStorage.setItem("medicines", JSON.stringify(medicines));

    renderInventoryTable(medicines);

  } catch (err) {
    console.error("Error loading inventory:", err);

    const medicines = JSON.parse(localStorage.getItem("medicines")) || [];
    renderInventoryTable(medicines);
  }
}

function renderInventoryTable(medicines) {
  const tbody = document.getElementById("inventoryBody");
  const categoryFilter = document.getElementById("categoryFilter");

  tbody.innerHTML = "";

  // Populate Manufacturer Filter
  const manufacturerFilter = document.getElementById("manufacturerFilter");
  if (manufacturerFilter) {
    const manufacturers = [...new Set(medicines.map(med => med.manufacturer).filter(Boolean))];
    manufacturerFilter.innerHTML = '<option value="">All Manufacturers</option>';
    manufacturers.forEach(m => {
      manufacturerFilter.innerHTML += `<option value="${m}">${m}</option>`;
    });
  }

  // Populate Category Filter
  const categories = [...new Set(medicines.map(med => med.category).filter(Boolean))];
  categoryFilter.innerHTML = '<option value="">All Categories</option>';
  categories.forEach(category => {
    categoryFilter.innerHTML += `<option value="${category}">${category}</option>`;
  });

  // If no medicines found
  if (medicines.length === 0) {
    tbody.innerHTML = '<tr><td colspan="9" style="text-align:center; padding:20px; color:#666;">No medicines in inventory</td></tr>';
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

    if (daysUntilExpiry <= 0) {
      status = "Expired";
      statusClass = "status-expired";
      rowClass = "expired-row";
      expiredCount++;
    } else if (daysUntilExpiry <= 30) {
      status = "Expiring Soon";
      statusClass = "status-soon";
      rowClass = "expiring-row";
    }

    // Extract threshold based on unit
    const unit = med.unit ? med.unit.toLowerCase() : "pack";
    const threshold = unitThresholds[unit] || 2;

    if (med.quantity <= threshold) {
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
      <td>${expDate.toLocaleDateString()}</td>
      <td><span class="${statusClass}">${status}</span></td>
      <td>
        <button class="btn-small btn-edit" onclick="editMedicine(${index})">Edit</button>
        <button class="btn-small btn-delete" onclick="deleteMedicine(${index})">Delete</button>
      </td>
    `;
    tbody.appendChild(row);
  });

  document.getElementById('totalStock').textContent = `Total Stock: ${totalStock}`;
  document.getElementById('expiredStock').textContent = `Expired: ${expiredCount}`;
  document.getElementById('lowStock').textContent = `Low Stock: ${lowStockCount}`;
  document.getElementById('totalValue').textContent = `Total Value: ₹${totalValue.toFixed(2)}`;

  filterInventory();
}

// =========================
// Filters
// =========================
function setupFilters() {
  const searchInput = document.getElementById("searchInput");
  const categoryFilter = document.getElementById("categoryFilter");
  const statusFilter = document.getElementById("statusFilter");
  const manufacturerFilter = document.getElementById("manufacturerFilter");
  const stockFilter = document.getElementById("stockFilter");
  const sortFilter = document.getElementById("sortFilter");

  if (searchInput) {
    searchInput.addEventListener("input", filterInventory);
  }

  [categoryFilter, statusFilter, manufacturerFilter, stockFilter, sortFilter].forEach(element => {
    if (element) {
      element.addEventListener("change", filterInventory);
    }
  });
}

function filterInventory() {
  const searchTerm = document.getElementById("searchInput").value.toLowerCase();
  const categoryFilter = document.getElementById("categoryFilter").value;
  const statusFilter = document.getElementById("statusFilter").value;
  const manufacturerFilter = document.getElementById("manufacturerFilter").value.toLowerCase();
  const stockFilter = document.getElementById("stockFilter").value;
  const sortFilter = document.getElementById("sortFilter").value;

  const rows = Array.from(document.querySelectorAll("#inventoryBody tr"));

  rows.forEach(row => {
    if (row.children.length === 1) return; // Skip message row like "No medicines in inventory"

    const name = row.children[0].textContent.toLowerCase();
    const manufacturer = row.children[1].textContent.toLowerCase();
    const category = row.children[2].textContent;
    const quantity = parseInt(row.children[4].textContent.split(" ")[0]) || 0;
    const statusText = row.children[7].textContent.toLowerCase();

    // --- Filtering Logic ---
    const matchesSearch = name.includes(searchTerm) || manufacturer.includes(searchTerm);
    const matchesCategory = !categoryFilter || category.includes(categoryFilter);
    const matchesStatus =
      !statusFilter ||
      (statusFilter === "valid" && statusText.includes("valid")) ||
      (statusFilter === "expiring" && statusText.includes("expiring")) ||
      (statusFilter === "expired" && statusText.includes("expired")) ||
      (statusFilter === "low-stock" && statusText.includes("low stock"));
    const matchesManufacturer = !manufacturerFilter || manufacturer.includes(manufacturerFilter);

    // Get unit from "7 pack"
    const [qtyStr, unitRaw] = row.children[4].textContent.split(" ");
    const qty = parseInt(qtyStr) || 0;
    const unit = unitRaw ? unitRaw.toLowerCase() : "pack";
    const threshold = unitThresholds[unit] || 2;

    let matchesStock = true;
    if (stockFilter === "low") {
      matchesStock = qty <= threshold;
    } else if (stockFilter === "medium") {
      matchesStock = qty > threshold && qty <= threshold * 3;
    } else if (stockFilter === "high") {
      matchesStock = qty > threshold * 3;
    }

    row.style.display =
      matchesSearch && matchesCategory && matchesStatus && matchesManufacturer && matchesStock
        ? ""
        : "none";
  });

  // --- Sorting Logic ---
  if (sortFilter) {
    const tbody = document.getElementById("inventoryBody");

    // Only sort visible rows
    const visibleRows = rows.filter(r => r.style.display !== "none");

    // Conversion map (excluding Tablet)
    const unitConversions = {
      capsule: 1,
      strip: 10,
      pack: 100,
      bottle: 250,
      vial: 50
    };

    function normalizeQuantity(cellText) {
      const [num, unit] = cellText.split(" ");
      const value = parseInt(num) || 0;
      const multiplier = unitConversions[unit?.toLowerCase()] || 1;
      return value * multiplier;
    }

    visibleRows.sort((a, b) => {
      switch (sortFilter) {
        case "name":
          return a.children[0].textContent.localeCompare(b.children[0].textContent);

        case "expiry":
          return new Date(a.children[6].textContent) - new Date(b.children[6].textContent);

        case "price": // Price Low → High
          return (
            parseFloat(a.children[5].textContent.replace(/[₹,]/g, "")) -
            parseFloat(b.children[5].textContent.replace(/[₹,]/g, ""))
          );

        case "price-desc": // Price High → Low
          return (
            parseFloat(b.children[5].textContent.replace(/[₹,]/g, "")) -
            parseFloat(a.children[5].textContent.replace(/[₹,]/g, ""))
          );

        default:
          return 0;
      }
    });

    // Clear and re-append sorted rows
    tbody.innerHTML = "";
    visibleRows.forEach(row => tbody.appendChild(row));
  }
}

// =========================
// Edit and Delete
// =========================
function editMedicine(index) {
  const medicines = JSON.parse(localStorage.getItem("medicines")) || [];
  const medicine = medicines[index];

  const newQuantity = prompt(`Edit quantity for ${medicine.name}:`, medicine.quantity);
  if (newQuantity && !isNaN(newQuantity) && newQuantity > 0) {
    medicines[index].quantity = parseInt(newQuantity);
    localStorage.setItem("medicines", JSON.stringify(medicines));
    loadInventory();
  }
}

async function deleteMedicine(index) {
  const medicines = JSON.parse(localStorage.getItem("medicines")) || [];
  const medicine = medicines[index];

  if (!medicine || !medicine._id) {
    alert("Medicine ID missing, cannot delete.");
    return;
  }

  if (confirm(`Are you sure you want to delete ${medicine.name}?`)) {
    try {
      const res = await fetch(`${API_BASE_URL}/medicines/${medicine._id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" }
      });

      if (res.ok) {
        medicines.splice(index, 1);
        localStorage.setItem("medicines", JSON.stringify(medicines));

        localStorage.setItem("refreshExpiry", "true");

        alert("Medicine deleted successfully.");
        loadInventory();
      } else {
        alert("Failed to delete medicine from server.");
      }
    } catch (err) {
      console.error("Error deleting medicine:", err);
      alert("An error occurred while deleting.");
    }
  }
}
