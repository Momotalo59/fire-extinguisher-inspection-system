// 📄 Reports Generator - สร้างรายงาน PDF/Excel

/**
 * สร้างรายงาน PDF รายเดือน
 */
async function generateMonthlyReport(month, year) {
  showLoading();
  try {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    const snapshot = await firebase.firestore()
      .collection('inspections')
      .where('inspectionDate', '>=', formatDate(startDate))
      .where('inspectionDate', '<=', formatDate(endDate))
      .get();

    const inspections = [];
    snapshot.forEach(doc => inspections.push({ id: doc.id, ...doc.data() }));

    const pdf = new jsPDF();
    
    // Header
    pdf.setFontSize(16);
    pdf.text('รายงานการตรวจเช็คถังดับเพลิง', 10, 10);
    pdf.setFontSize(12);
    pdf.text(`รายเดือน: ${month}/${year}`, 10, 20);
    pdf.text(`วันที่พิมพ์: ${formatThaiDate(new Date())}`, 10, 30);

    // Table
    const tableData = [];
    inspections.forEach((inspection, index) => {
      tableData.push([
        index + 1,
        inspection.extinguisherId,
        inspection.inspector.name,
        inspection.result,
        inspection.notes || '-'
      ]);
    });

    pdf.autoTable({
      head: [['ลำดับ', 'รหัสถัง', 'ผู้ตรวจ', 'ผลการตรวจ', 'หมายเหตุ']],
      body: tableData,
      startY: 40,
      theme: 'grid',
      styles: { font: 'Tahoma', fontSize: 10 }
    });

    // Statistics
    const totalInspections = inspections.length;
    const passedInspections = inspections.filter(i => i.result === 'ผ่าน').length;
    const failedInspections = inspections.filter(i => i.result === 'ไม่ผ่าน').length;
    const passPercentage = totalInspections > 0 ? ((passedInspections / totalInspections) * 100).toFixed(1) : 0;

    const finalY = pdf.lastAutoTable.finalY + 20;
    pdf.setFontSize(11);
    pdf.text('สรุปผล:', 10, finalY);
    pdf.setFontSize(10);
    pdf.text(`- รวมการตรวจทั้งหมด: ${totalInspections}`, 15, finalY + 10);
    pdf.text(`- ผ่านการตรวจ: ${passedInspections}`, 15, finalY + 20);
    pdf.text(`- ไม่ผ่านการตรวจ: ${failedInspections}`, 15, finalY + 30);
    pdf.text(`- เปอร์เซ็นต์ที่ผ่าน: ${passPercentage}%`, 15, finalY + 40);

    hideLoading();
    
    // ดาวน์โหลด
    pdf.save(`report-${year}-${String(month).padStart(2, '0')}.pdf`);
    logAction('report_generated', { type: 'monthly', month, year });
    showSuccess('สร้างรายงานเสร็จสิ้น', 'ไฟล์ PDF ถูกสร้างเรียบร้อยแล้ว');
  } catch (error) {
    hideLoading();
    console.error('Generate monthly report error:', error);
    showError('สร้างรายงานไม่สำเร็จ', error.message);
  }
}

/**
 * สร้างรายงาน PDF รายปี
 */
async function generateYearlyReport(year) {
  showLoading();
  try {
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31);

    const snapshot = await firebase.firestore()
      .collection('inspections')
      .where('inspectionDate', '>=', formatDate(startDate))
      .where('inspectionDate', '<=', formatDate(endDate))
      .get();

    const inspections = [];
    snapshot.forEach(doc => inspections.push(doc.data()));

    const pdf = new jsPDF();
    pdf.setFontSize(16);
    pdf.text('รายงานประจำปีการตรวจเช็คถังดับเพลิง', 10, 10);
    pdf.setFontSize(12);
    pdf.text(`ปี: ${year}`, 10, 20);

    // Monthly statistics
    const monthlyStats = {};
    for (let i = 1; i <= 12; i++) {
      monthlyStats[i] = inspections.filter(insp => {
        const inspDate = new Date(insp.inspectionDate);
        return inspDate.getMonth() === i - 1 && inspDate.getFullYear() === year;
      }).length;
    }

    const tableData = [];
    const months = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
    
    months.forEach((month, index) => {
      tableData.push([month, monthlyStats[index + 1] || 0]);
    });

    pdf.autoTable({
      head: [['เดือน', 'จำนวนการตรวจ']],
      body: tableData,
      startY: 30,
      theme: 'grid'
    });

    hideLoading();
    pdf.save(`report-yearly-${year}.pdf`);
    logAction('report_generated', { type: 'yearly', year });
    showSuccess('สร้างรายงานเสร็จสิ้น', 'ไฟล์ PDF ถูกสร้างเรียบร้อยแล้ว');
  } catch (error) {
    hideLoading();
    console.error('Generate yearly report error:', error);
    showError('สร้างรายงานไม่สำเร็จ', error.message);
  }
}

/**
 * Export เป็น Excel
 */
async function exportToExcel(data, filename = 'report.xlsx') {
  try {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Report');
    XLSX.writeFile(workbook, filename);
    
    logAction('data_exported', { format: 'excel', filename });
    showSuccess('ส่งออกเสร็จสิ้น', 'ไฟล์ Excel ถูกสร้างเรียบร้อยแล้ว');
  } catch (error) {
    console.error('Export Excel error:', error);
    showError('ส่งออกไม่สำเร็จ', error.message);
  }
}

/**
 * Export เป็น CSV
 */
async function exportToCSV(data, filename = 'report.csv') {
  try {
    const headers = Object.keys(data[0]);
    const csv = [
      headers.join(','),
      ...data.map(row => headers.map(header => `"${row[header]}"`).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();

    logAction('data_exported', { format: 'csv', filename });
  } catch (error) {
    console.error('Export CSV error:', error);
    showError('ส่งออกไม่สำเร็จ', error.message);
  }
}

console.log('✅ Reports Generator module loaded');