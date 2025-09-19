const API_BASE_URL = 'http://localhost:5000/api';

let allMedicines = []; // global storage
const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');

// ===============================
// Get expiry status helper
// ===============================
function getExpiryStatus(med) {
  if (!med.expiryDate) return "unknown";
  const today = new Date();
  const expiryDate = new Date(med.expiryDate);
  const diffDays = (expiryDate - today) / (1000 * 60 * 60 * 24);

  if (diffDays < 0) return "expired";
  if (diffDays <= 90) return "expiring";
  return "valid";
}

// ===============================
// Render expiry table
// ===============================
function renderExpiryTable(medicines) {
  const tableBody = document.getElementById("expiryTableBody");
  if (!tableBody) return;

  tableBody.innerHTML = "";

  if (medicines.length === 0) {
    const row = document.createElement("tr");
    row.innerHTML = `<td colspan="5" style="text-align:center; color: gray;">No medicines found</td>`;
    tableBody.appendChild(row);
    return;
  }

  let serial = 1;
  medicines.forEach(med => {
    const expiryDate = med.expiryDate ? new Date(med.expiryDate) : null;
    const expiryStatus = getExpiryStatus(med);

    // Skip valid medicines, only show expired or expiring soon
    if (expiryStatus === "valid") return;

    const statusBadge = expiryStatus === "expired"
      ? `<span class="badge expired">Expired</span>`
      : `<span class="badge expiring">Expiring Soon</span>`;

    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${serial}</td>
      <td>${med.name || med.medicineName || "Unnamed"}</td>
      <td>${med.batchNo || "N/A"}</td>
      <td>${expiryDate ? expiryDate.toLocaleDateString() : "N/A"}</td>
      <td>${statusBadge}</td>
    `;
    tableBody.appendChild(row);
    serial++;
  });
}

// ===============================
// Update Summary Cards
// ===============================
function updateSummary(filteredMedicines) {
  let expired = 0, expiring = 0, total = 0;

  filteredMedicines.forEach(med => {
    const status = getExpiryStatus(med);
    if (status === "expired") expired++;
    else if (status === "expiring") expiring++;

    if (status === "expired" || status === "expiring") total++;
  });

  document.getElementById("expiredCount").textContent = expired;
  document.getElementById("expiringSoonCount").textContent = expiring;

  const totalFilteredCountElement = document.getElementById("totalFilteredCount");
  if (totalFilteredCountElement) totalFilteredCountElement.textContent = total;
}

// ===============================
// Apply filters from dropdowns
// ===============================
function applyFilters() {
  const filterDays = document.getElementById("filterDays")?.value || "all";
  const categoryFilter = document.getElementById("categoryFilter")?.value || "all";
  const today = new Date();

  let filteredMeds = allMedicines.filter(med => {
    if (!med.expiryDate) return false;
    const expiryDate = new Date(med.expiryDate);
    const diffDays = (expiryDate - today) / (1000 * 60 * 60 * 24);
    const status = getExpiryStatus(med);

    if (categoryFilter === "expired" && status !== "expired") return false;
    if (categoryFilter === "expiring" && status !== "expiring") return false;

    if (filterDays !== "all") {
      if (status === "expired") return false;
      if (diffDays > parseInt(filterDays)) return false;
    }

    return true;
  });

  if (filteredMeds.length === 0) {
    const tableBody = document.getElementById("expiryTableBody");
    tableBody.innerHTML = `
      <tr>
        <td colspan="5" style="text-align:center; color: gray;">
          No medicines found for the selected filters
        </td>
      </tr>
    `;
  } else {
    renderExpiryTable(filteredMeds);
  }

  updateSummary(filteredMeds);
}

// ===============================
// Fetch and calculate expiry data
// ===============================
async function loadExpiryData() {
  try {
    const res = await fetch(`${API_BASE_URL}/medicines`);
    allMedicines = await res.json();

    // First render without filters
    applyFilters();
  } catch (err) {
    console.error("Error loading expiry data:", err);
  }
}

// ===============================
// Logout Functionality
// ===============================
function setupLogout() {
  const logoutBtn = document.getElementById("logoutBtn");
  if (!logoutBtn) return;

  logoutBtn.addEventListener("click", () => {
    if (!confirm("Are you sure you want to logout?")) return;
    localStorage.clear();
    sessionStorage.clear();
    window.location.replace("index.html");
  });
}

// ===============================
// Display logged-in user info (Full Name + Role)
// ===============================
function displayUserInfo() {
  const fullNameElem = document.getElementById('userFirstName'); // or your name display element
  const roleElem = document.getElementById('userRole');

  if (!currentUser) return;

  // Show full name (first + last)
  const fullName = `${currentUser.firstName || ''} ${currentUser.lastName || ''}`.trim();
  if (fullNameElem) fullNameElem.textContent = fullName || 'User';

  // Show role in lowercase (or capitalize first letter if you want)
  if (roleElem) roleElem.textContent = currentUser.role ? currentUser.role.charAt(0).toUpperCase() + currentUser.role.slice(1) : 'User';
}

// ===============================
// Initialize page
// ===============================
document.addEventListener("DOMContentLoaded", () => {
  // Auto-refresh after inventory update
  if (localStorage.getItem("refreshExpiry") === "true") {
    localStorage.removeItem("refreshExpiry");
    console.log("Auto-refreshing expiry data after inventory update...");
  }

  loadExpiryData();

  // Filters
  document.getElementById("filterDays")?.addEventListener("change", applyFilters);
  document.getElementById("categoryFilter")?.addEventListener("change", applyFilters);

  setupLogout();
  displayUserInfo();

  // Hide User Management for non-admins
  if (currentUser.role !== 'admin') {
    const userLink = document.getElementById('userManagementLink');
    if (userLink) userLink.style.display = 'none';
  }
});
