const API_BASE_URL = 'http://localhost:5000/api';

let allMedicines = []; // global storage

// Get expiry status helper
function getExpiryStatus(med) {
  if (!med.expiryDate) return "unknown";
  const today = new Date();
  const expiryDate = new Date(med.expiryDate);
  const diffDays = (expiryDate - today) / (1000 * 60 * 60 * 24);

  if (diffDays < 0) return "expired";
  if (diffDays <= 30) return "expiring";
  return "valid";
}

// Render expiry table
function renderExpiryTable(medicines) {
  const tableBody = document.getElementById("expiryTableBody");
  if (!tableBody) return;

  tableBody.innerHTML = "";

  if (medicines.length === 0) {
    const row = document.createElement("tr");
    row.innerHTML = `<td colspan="4" style="text-align:center;">No medicines found</td>`;
    tableBody.appendChild(row);
    return;
  }

  medicines.forEach((med, index) => {
    const expiryDate = med.expiryDate ? new Date(med.expiryDate) : null;
    const expiryStatus = getExpiryStatus(med);

    // Skip valid medicines, only show expired or expiring soon
    if (expiryStatus === "valid") return;

    // Badge for expired or expiring soon
    const statusBadge = expiryStatus === "expired"
      ? `<span class="badge expired">Expired</span>`
      : `<span class="badge expiring">Expiring Soon</span>`;

    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${index + 1}</td>
      <td>${med.name || med.medicineName || "Unnamed"}</td>
      <td>${expiryDate ? expiryDate.toLocaleDateString() : "N/A"}</td>
      <td>${statusBadge}</td>
    `;
    tableBody.appendChild(row);
  });
}

// Update summary cards
function updateSummary(medicines) {
  let expired = 0, expiring = 0;
  medicines.forEach(med => {
    const status = getExpiryStatus(med);
    if (status === "expired") expired++;
    if (status === "expiring") expiring++;
  });

  document.getElementById("expiredCount").textContent = expired;
  document.getElementById("expiringSoonCount").textContent = expiring;
}

// Apply filters from dropdowns
function applyFilters() {
  const filterDays = document.getElementById("filterDays")?.value || "all";
  const categoryFilter = document.getElementById("categoryFilter")?.value || "all";

  const today = new Date();

  let filteredMeds = allMedicines.filter(med => {
    if (!med.expiryDate) return false;
    const expiryDate = new Date(med.expiryDate);
    const diffDays = (expiryDate - today) / (1000 * 60 * 60 * 24);
    const status = getExpiryStatus(med);

    // Category filter
    if (categoryFilter !== "all" && categoryFilter !== status) return false;

    // Days filter (skip expired)
    if (filterDays !== "all" && status !== "expired") {
      if (diffDays > parseInt(filterDays)) return false;
    }

    return true;
  });

  // Render filtered data into table
  renderExpiryTable(filteredMeds);

  // Always update summary based on *all medicines*
  updateSummary(allMedicines);
}

// Fetch and calculate expiry data
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

// Run on page load
document.addEventListener("DOMContentLoaded", () => {
  // Check if inventory triggered a refresh
  if (localStorage.getItem("refreshExpiry") === "true") {
    localStorage.removeItem("refreshExpiry");
    console.log("Auto-refreshing expiry data after inventory update...");
  }

  loadExpiryData();

  // Filters
  document.getElementById("filterDays")?.addEventListener("change", applyFilters);
  document.getElementById("categoryFilter")?.addEventListener("change", applyFilters);
});
