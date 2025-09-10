const API_BASE_URL = 'http://localhost:5000/api';

document.addEventListener("DOMContentLoaded", () => {
  loadDashboardData();
});

// Fetch data and update dashboard
async function loadDashboardData() {
  try {
    const response = await fetch("http://localhost:5000/api/medicines");
    const medicines = await response.json();

    const { totalMedicines, expiringCount, expiredCount, validCount, lowStockCount } =
      processMedicineData(medicines);

    // Update counters
    animateCounter("totalMedicines", totalMedicines);
    animateCounter("expiredMedicines", expiredCount);
    animateCounter("expiringMedicines", expiringCount);
    animateCounter("lowStock", lowStockCount);

    // Update expiry chart
    updateExpiryChart(validCount, expiringCount, expiredCount, totalMedicines);
  } catch (error) {
    console.error("Error loading dashboard data:", error);
  }
}

// Process medicine data safely (no negatives)
function processMedicineData(medicines) {
  const today = new Date();
  let totalMedicines = 0;
  let expiringCount = 0;
  let expiredCount = 0;
  let validCount = 0;
  let lowStockCount = 0;

  medicines.forEach((med) => {
    const expDate = new Date(med.expiryDate || med.expiry);
    const daysUntilExpiry = Math.ceil((expDate - today) / (1000 * 60 * 60 * 24));

    // Ensure non-negative quantity
    const quantity = Math.max(0, parseInt(med.quantity) || 0);
    totalMedicines += quantity;

    if (daysUntilExpiry < 0) {
      expiredCount++;
    } else if (daysUntilExpiry <= 30) {
      expiringCount++;
    } else {
      validCount++;
    }

    // Automatic low stock detection
    if (quantity > 0 && quantity <= 2) {
      lowStockCount++;
    }
  });

  return { totalMedicines, expiringCount, expiredCount, validCount, lowStockCount };
}

// Counter animation (safe for 0 and negatives)
function animateCounter(elementId, targetValue) {
  const element = document.getElementById(elementId);
  const safeTarget = Math.max(0, targetValue); // Never negative
  let current = 0;
  const duration = 1000;
  const steps = safeTarget;
  const stepDuration = steps > 0 ? duration / steps : 0;

  if (steps === 0) {
    element.textContent = "0";
    return;
  }

  const timer = setInterval(() => {
    current++;
    element.textContent = current;

    if (current >= safeTarget) {
      clearInterval(timer);
    }
  }, stepDuration);
}

// Expiry chart update (no negatives, handles empty case)
function updateExpiryChart(valid, expiring, expired, total) {
  total = Math.max(0, total);
  valid = Math.max(0, valid);
  expiring = Math.max(0, expiring);
  expired = Math.max(0, expired);

  if (total === 0) {
    document.getElementById("validBar").style.width = "0%";
    document.getElementById("expiringBar").style.width = "0%";
    document.getElementById("expiredBar").style.width = "0%";
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

function deleteActivity(activityId) {
  const activityElement = document.getElementById(activityId);
  if (activityElement) {
    activityElement.remove();
  }
}

