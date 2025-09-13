const API_BASE_URL = 'http://localhost:5000/api';

document.addEventListener("DOMContentLoaded", () => {
  loadDashboardData();

  // Event: Export button
  const exportBtn = document.getElementById("exportBtn");
  if (exportBtn) {
    exportBtn.addEventListener("click", exportReport);
  }
});

// ===============================
// 0) Stock Thresholds per Unit
// ===============================
const unitThresholds = {
  pack: 2,
  bottle: 7,
  vial: 5
};

// ===============================
// 1) Load Dashboard Data
// ===============================
async function loadDashboardData() {
  try {
    const response = await fetch(`${API_BASE_URL}/medicines`);
    const medicines = await response.json();

    const {
      totalMedicines,
      totalStock,
      totalValue,
      expiringCount,
      expiredCount,
      validCount,
      lowStockCount
    } = processMedicineData(medicines);

    // Update counters
    animateCounter("totalMedicines", totalMedicines);
    animateCounter("totalStock", totalStock);
    animateCounter("expiredMedicines", expiredCount);
    animateCounter("expiringMedicines", expiringCount);
    animateCounter("lowStock", lowStockCount);
    animateCounter("totalValue", totalValue, "₹");

    // Update expiry chart
    updateExpiryChart(validCount, expiringCount, expiredCount, totalMedicines);

    // Update alerts & recent activity
    showDashboardAlerts(expiredCount, lowStockCount);
    loadRecentActivity(medicines);
  } catch (error) {
    console.error("Error loading dashboard data:", error);
  }
}

// ===============================
// 2) Process Data (Low Stock Fixed)
// ===============================
function processMedicineData(medicines) {
  const today = new Date();

  let totalMedicines = medicines.length;
  let totalStock = 0;
  let totalValue = 0;

  let expiringCount = 0;
  let expiredCount = 0;
  let validCount = 0;
  let lowStockCount = 0;

  medicines.forEach((med) => {
    const expDate = med.expiryDate ? new Date(med.expiryDate) : null;
    const daysUntilExpiry = expDate
      ? Math.ceil((expDate - today) / (1000 * 60 * 60 * 24))
      : Infinity;

    // ✅ Ensure quantity is a proper number
    const quantity = parseInt(med.quantity) || 0;
    totalStock += quantity;

    // ✅ Ensure price is valid
    const price = Math.max(0, parseFloat(med.price) || 0);
    totalValue += quantity * price;

    // ============================
    // Expiry Categorization
    // ============================
    if (daysUntilExpiry <= 0) {
      expiredCount++;
    } else if (daysUntilExpiry <= 30) {
      expiringCount++;
    } else {
      validCount++;
    }

    // ============================
    // Low Stock Detection (Exact Logic From inventory.js)
    // ============================
    const unit = med.unit ? med.unit.toLowerCase() : "pack";
    const threshold = unitThresholds[unit] || 2; // Default threshold = 2

    if (quantity <= threshold) {
      lowStockCount++;
    }
  });

  return {
    totalMedicines,
    totalStock,
    totalValue,
    expiringCount,
    expiredCount,
    validCount,
    lowStockCount
  };
}

// ===============================
// 3) Dashboard Alerts
// ===============================
function showDashboardAlerts(expiredCount, lowStockCount) {
  const container = document.getElementById("dashboardAlerts");
  if (!container) return;
  container.innerHTML = "";

  if (expiredCount > 0) {
    const div = document.createElement("div");
    div.className = "alert-card danger";
    div.innerHTML = `<i class="fas fa-exclamation-circle"></i>
      ${expiredCount} expired medicine(s). <a href="expiry.html">View expiry</a>`;
    container.appendChild(div);
  }

  if (lowStockCount > 0) {
    const div = document.createElement("div");
    div.className = "alert-card warning";
    div.innerHTML = `<i class="fas fa-box"></i>
      ${lowStockCount} low-stock item(s). <a href="inventory.html">View inventory</a>`;
    container.appendChild(div);
  }

  if (expiredCount === 0 && lowStockCount === 0) {
    container.innerHTML = `<div style="color:#333; font-weight:600;">
      All clear — no expired or low-stock items.
    </div>`;
  }
}

// ===============================
// 4) Recent Activity
// ===============================
async function loadRecentActivity(data, limit = 5) {
  try {
    // Sort by created date (newest first)
    data.sort((a, b) => {
      const dateA = new Date(a.createdAt || 0);
      const dateB = new Date(b.createdAt || 0);
      return dateB - dateA;
    });

    const recent = data.slice(0, limit);
    const recentList = document.getElementById("recentList");

    if (!recentList) return;
    recentList.innerHTML = "";

    if (recent.length === 0) {
      recentList.innerHTML = `
        <div class="activity-item placeholder">
          <div class="activity-icon"><i class="fas fa-plus-circle"></i></div>
          <div class="activity-content">
            <p>No recent activity</p>
            <small>Add medicines to see activity here</small>
          </div>
        </div>`;
      return;
    }

    recent.forEach((med) => {
      const expiry = med.expiryDate
        ? new Date(med.expiryDate).toLocaleDateString()
        : "N/A";

      const item = document.createElement("div");
      item.className = "activity-item";
      item.id = med._id;

      item.innerHTML = `
        <div style="display:flex; gap:10px; align-items:center;">
          <div class="activity-icon"><i class="fas fa-pills"></i></div>
          <div class="activity-content">
            <p><strong>${med.name}</strong></p>
            <small>Expiry: ${expiry}</small>
          </div>
        </div>
        <button class="delete-btn" onclick="deleteActivity('${med._id}')">
          <i class="fas fa-trash"></i>
        </button>
      `;
      recentList.appendChild(item);
    });
  } catch (err) {
    console.error("Recent activity load error:", err);
  }
}

// ===============================
// 5) Delete Activity (only from dashboard log)
// ===============================
function deleteActivity(activityId) {
  if (!confirm("Are you sure you want to remove this activity from the log?")) return;

  // Just remove from dashboard recent activity list
  document.getElementById(activityId)?.remove();

  alert("Activity removed from dashboard log!");
}

// ===============================
// 6) Counter Animation
// ===============================
function animateCounter(elementId, targetValue, prefix = "", suffix = "") {
  const element = document.getElementById(elementId);
  const safeTarget = Math.max(0, targetValue);
  let current = 0;
  const duration = 1000;
  const steps = safeTarget > 0 ? safeTarget : 1;
  const stepDuration = duration / steps;

  if (safeTarget === 0) {
    element.textContent = prefix + "0" + suffix;
    return;
  }

  const timer = setInterval(() => {
    current++;
    element.textContent = prefix + current + suffix;
    if (current >= safeTarget) clearInterval(timer);
  }, stepDuration);
}

// ===============================
// 7) Expiry Chart
// ===============================
function updateExpiryChart(valid, expiring, expired, total) {
  total = Math.max(0, total);

  if (total === 0) {
    ["validBar", "expiringBar", "expiredBar"].forEach(id => {
      document.getElementById(id).style.width = "0%";
    });
    return;
  }

  const validPercent = (valid / total) * 100;
  const expiringPercent = (expiring / total) * 100;
  const expiredPercent = (expired / total) * 100;

  document.getElementById("validBar").style.width = `${validPercent}%`;
  document.getElementById("expiringBar").style.width = `${expiringPercent}%`;
  document.getElementById("expiredBar").style.width = `${expiredPercent}%`;

  // Tooltips
  document.getElementById("validBar").title = `${valid} medicines (${validPercent.toFixed(1)}%)`;
  document.getElementById("expiringBar").title = `${expiring} medicines (${expiringPercent.toFixed(1)}%)`;
  document.getElementById("expiredBar").title = `${expired} medicines (${expiredPercent.toFixed(1)}%)`;
}
