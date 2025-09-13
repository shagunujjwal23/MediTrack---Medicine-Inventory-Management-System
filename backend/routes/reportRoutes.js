// backend/routes/reportRoutes.js
const express = require("express");
const router = express.Router();
const Medicine = require("../models/Medicine");
const { Parser } = require("json2csv");
const ExcelJS = require("exceljs");
const PDFDocument = require("pdfkit");
const stream = require("stream");

// ================================
// GET /api/reports/export?format=csv|excel|pdf
// ================================
router.get("/export", async (req, res) => {
  try {
    const { format = "csv" } = req.query; // default format is CSV
    console.log("Export route called with format:", format); // Debug log

    const medicines = await Medicine.find();

    if (!medicines || medicines.length === 0) {
      return res.status(404).json({ error: "No medicines found to export" });
    }

    console.log("Medicines fetched:", medicines.length); // Debug log

    // Format medicine data
    const data = medicines.map(med => ({
      Name: med.name,
      BatchNumber: med.batchNo || "N/A",  // ✅ FIXED FIELD NAME
      Quantity: med.quantity,
      Unit: med.unit || "N/A",
      Price: med.price,
      ExpiryDate: med.expiryDate
        ? new Date(med.expiryDate).toISOString().split("T")[0]
        : "N/A",
      Status: getStatus(med.expiryDate),
      CreatedAt: med.createdAt
        ? new Date(med.createdAt).toLocaleString()
        : "N/A",
    }));

    // Call appropriate exporter
    if (format === "csv") {
      return exportCSV(data, res);
    } else if (format === "excel") {
      return exportExcel(data, res);
    } else if (format === "pdf") {
      return exportPDF(data, res);
    } else {
      return res.status(400).json({ error: "Invalid format specified" });
    }
  } catch (err) {
    console.error("Export Error:", err);
    res.status(500).json({ error: "Failed to export report" });
  }
});

// ================================
// Helper: Determine status by expiry date
// ================================
function getStatus(expiryDate) {
  if (!expiryDate) return "N/A";

  const today = new Date();
  const exp = new Date(expiryDate);
  const diff = Math.ceil((exp - today) / (1000 * 60 * 60 * 24));

  if (diff <= 0) return "Expired";
  if (diff <= 30) return "Expiring Soon";
  return "Valid";
}

// ================================
// 1) CSV Export
// ================================
function exportCSV(data, res) {
  const parser = new Parser();
  const csv = parser.parse(data);

  res.header("Content-Type", "text/csv");
  res.attachment(`medicine_report_${Date.now()}.csv`);
  res.send(csv);
}

// ================================
// 2) Excel Export
// ================================
async function exportExcel(data, res) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Medicine Report");

  worksheet.columns = [
    { header: "Name", key: "Name", width: 25 },
    { header: "Batch Number", key: "BatchNumber", width: 15 },
    { header: "Quantity", key: "Quantity", width: 10 },
    { header: "Unit", key: "Unit", width: 10 },
    { header: "Price", key: "Price", width: 10 },
    { header: "Expiry Date", key: "ExpiryDate", width: 15 },
    { header: "Status", key: "Status", width: 15 },
    { header: "Created At", key: "CreatedAt", width: 20 },
  ];

  data.forEach(item => worksheet.addRow(item));
  worksheet.getRow(1).font = { bold: true };

  const buffer = await workbook.xlsx.writeBuffer();
  res.header("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  res.attachment(`medicine_report_${Date.now()}.xlsx`);
  res.send(buffer);
}

// ================================
// 3) PDF Export
// ================================
function exportPDF(data, res) {
  const doc = new PDFDocument({ margin: 30, size: "A4" });
  const passthrough = new stream.PassThrough();
  doc.pipe(passthrough);
  passthrough.pipe(res);

  res.header("Content-Type", "application/pdf");
  res.attachment(`medicine_report_${Date.now()}.pdf`);

  doc.fontSize(20).text("Medicine Inventory Report", { align: "center" });
  doc.moveDown();

  // Table Header
  doc.fontSize(12).text("Name | Batch | Qty | Unit | Price | Expiry | Status", { underline: true });
  doc.moveDown(0.5);

  // Table Rows
  data.forEach(item => {
    doc.text(
      `${item.Name} | ${item.BatchNumber} | ${item.Quantity} | ${item.Unit} | ₹${item.Price} | ${item.ExpiryDate} | ${item.Status}`
    );
  });

  doc.end();
}

module.exports = router;
