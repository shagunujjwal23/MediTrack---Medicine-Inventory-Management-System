const API_BASE_URL = 'http://localhost:5000/api';

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
    // Low Stock Detection
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
// 5) Delete Activity
// ===============================
function deleteActivity(activityId) {
  if (!confirm("Are you sure you want to remove this activity from the log?")) return;
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

  document.getElementById("validBar").title = `${valid} medicines (${validPercent.toFixed(1)}%)`;
  document.getElementById("expiringBar").title = `${expiring} medicines (${expiringPercent.toFixed(1)}%)`;
  document.getElementById("expiredBar").title = `${expired} medicines (${expiredPercent.toFixed(1)}%)`;
}

// ===============================
// 8) Notifications Section
// ===============================
const NOTIF_API_URL = `${API_BASE_URL}/notifications`;

async function loadNotifications() {
  try {
    const res = await fetch(NOTIF_API_URL);
    const json = await res.json();

    const notifications = json.data || [];
    renderNotifications(notifications);
    updateBadgeCount(notifications);
  } catch (err) {
    console.error("Error loading notifications:", err);
  }
}

function renderNotifications(notifications) {
  const list = document.getElementById("sidebarNotifList");
  if (!list) return;

  list.innerHTML = "";

  if (!notifications.length) {
    list.innerHTML = `<li class="no-notifications">No new notifications</li>`;
    return;
  }

  notifications.forEach((notif) => {
    const li = document.createElement("li");
    li.className = notif.read ? "read" : "unread";
    li.innerHTML = `
      <span>${notif.message}</span>
      <small>${formatDateTime(notif.createdAt)}</small>
    `;
    li.onclick = () => markNotificationAsRead(notif._id);
    list.appendChild(li);
  });
}

function updateBadgeCount(notifications) {
  const unreadCount = notifications.filter(n => !n.read).length;
  const badge = document.getElementById("notificationBadge");
  if (!badge) return;

  badge.style.display = unreadCount > 0 ? "inline-block" : "none";
  badge.textContent = unreadCount;
}

async function markNotificationAsRead(id) {
  try {
    await fetch(`${NOTIF_API_URL}/${id}/read`, { method: "PATCH" });
    loadNotifications();
  } catch (err) {
    console.error("Error marking notification as read:", err);
  }
}

async function clearAllNotifications() {
  if (!confirm("Are you sure you want to clear all notifications?")) return;
  try {
    await fetch(`${NOTIF_API_URL}/clear`, { method: "DELETE" });
    await loadNotifications();
  } catch (err) {
    console.error("Error clearing notifications:", err);
  }
}

function filterNotifications(filter) {
  const items = document.querySelectorAll("#sidebarNotifList li");
  items.forEach(item => {
    if (filter === "all") {
      item.style.display = "flex";
    } else if (filter === "unread") {
      item.style.display = item.classList.contains("unread") ? "flex" : "none";
    } else if (filter === "read") {
      item.style.display = item.classList.contains("read") ? "flex" : "none";
    }
  });
}

function formatDateTime(dateString) {
  const date = new Date(dateString);
  return date.toLocaleString();
}

// ===============================
// 9) Sidebar Open/Close
// ===============================
function openNotificationSidebar() {
  document.getElementById("notificationSidebar").classList.add("open");
  document.getElementById("notificationOverlay").classList.add("active");
  document.body.classList.add("no-scroll"); // Lock main dashboard scroll
  loadNotifications();
}

function closeNotificationSidebar() {
  document.getElementById("notificationSidebar").classList.remove("open");
  document.getElementById("notificationOverlay").classList.remove("active");
  document.body.classList.remove("no-scroll"); // Unlock dashboard scroll
}

// ===============================
// 10) Initialize on Page Load
// ===============================
document.addEventListener("DOMContentLoaded", () => {
  loadDashboardData();

  // ✅ Notification button (bell icon)
  const notifBtn = document.getElementById("notificationBtn");
  if (notifBtn) {
    notifBtn.addEventListener("click", openNotificationSidebar);
  }

  // ✅ Clear notifications
  const clearBtn = document.querySelector(".clear-all-btn");
  if (clearBtn) {
    clearBtn.addEventListener("click", clearAllNotifications);
  }

  // ✅ Export button
  const exportBtn = document.getElementById("exportBtn");
  if (exportBtn) {
    exportBtn.addEventListener("click", exportReport);
  }
});

// ===============================
// 11) Export Inventory Report
// ===============================
async function exportReport() {
  try {
    const exportType = document.getElementById("exportFormat").value;

    // Fetch medicines
    const response = await fetch(`${API_BASE_URL}/medicines`);
    const medicines = await response.json();

    if (!medicines || medicines.length === 0) {
      alert("No data available to export.");
      return;
    }

    if (exportType === "csv") {
      exportAsCSV(medicines);
    } else if (exportType === "excel") {
      exportAsExcel(medicines);
    } else if (exportType === "pdf") {
      exportAsPDF(medicines);
    }
  } catch (error) {
    console.error("Export failed:", error);
    alert("Failed to export report. Please try again.");
  }
}

function exportAsCSV(data) {
  const headers = Object.keys(data[0]);
  const csvRows = [headers.join(",")];

  data.forEach(item => {
    const row = headers.map(header => `"${item[header] || ''}"`);
    csvRows.push(row.join(","));
  });

  const csvContent = csvRows.join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `inventory_report_${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();

  alert("CSV report exported successfully!");
}

function exportAsExcel(data) {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Inventory Report");

  XLSX.writeFile(workbook, `inventory_report_${new Date().toISOString().slice(0, 10)}.xlsx`);

  alert("Excel report exported successfully!");
}

function exportAsPDF(data) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  // Title
  doc.setFontSize(18);
  doc.text("Inventory Report", 14, 20);

  // Table data
  const columns = Object.keys(data[0]);
  const rows = data.map(item => columns.map(col => item[col] || ""));

  doc.autoTable({
    head: [columns],
    body: rows,
    startY: 30,
    theme: "grid",
    styles: { fontSize: 8 },
  });

  doc.save(`inventory_report_${new Date().toISOString().slice(0, 10)}.pdf`);

  alert("PDF report exported successfully!");
}
