// 📊 Dashboard Module - Dashboard Analytics

let dashboardChart = null;
let monthlyChart = null;

/**
 * โหลดข้อมูล Dashboard
 */
async function loadDashboardData() {
  showLoading();
  try {
    const stats = await fetchDashboardStats();
    displayDashboardStats(stats);
    await loadCharts(stats);
    await loadRecentInspections();
    hideLoading();
  } catch (error) {
    hideLoading();
    console.error('Load dashboard error:', error);
    showError('ข้อผิดพลาด', error.message);
  }
}

/**
 * ดึงสถิติ Dashboard
 */
async function fetchDashboardStats() {
  const extinguishers = await firebase.firestore().collection('fireExtinguishers').get();
  
  let stats = {
    total: extinguishers.size,
    inspected: 0,
    notInspected: 0,
    passed: 0,
    failed: 0,
    expired: 0,
    expiringSoon: 0,
    needRepair: 0,
    byType: {},
    byStatus: {},
    byBuilding: {}
  };

  extinguishers.forEach(doc => {
    const extinguisher = doc.data();
    
    // Count by status
    stats[extinguisher.status.toLowerCase()] = (stats[extinguisher.status.toLowerCase()] || 0) + 1;
    
    // Check if expired
    if (isExpired(extinguisher.expiryDate)) {
      stats.expired++;
    } else if (isExpiringSoon(extinguisher.expiryDate)) {
      stats.expiringSoon++;
    }
    
    // Count by type
    stats.byType[extinguisher.type] = (stats.byType[extinguisher.type] || 0) + 1;
    
    // Count by building
    stats.byBuilding[extinguisher.location.building] = (stats.byBuilding[extinguisher.location.building] || 0) + 1;
  });

  return stats;
}

/**
 * แสดงสถิติบน Dashboard
 */
function displayDashboardStats(stats) {
  document.getElementById('stat-total').textContent = stats.total;
  document.getElementById('stat-passed').textContent = stats.passed || 0;
  document.getElementById('stat-failed').textContent = stats.failed || 0;
  document.getElementById('stat-expired').textContent = stats.expired;
  document.getElementById('stat-expiring-soon').textContent = stats.expiringSoon;
  document.getElementById('stat-need-repair').textContent = stats.needRepair || 0;
  
  const passPercentage = stats.total > 0 ? ((stats.passed / stats.total) * 100).toFixed(1) : 0;
  document.getElementById('pass-percentage').textContent = passPercentage + '%';
}

/**
 * โหลดกราฟ
 */
async function loadCharts(stats) {
  // Pie Chart - Status
  const ctxStatus = document.getElementById('statusChart')?.getContext('2d');
  if (ctxStatus) {
    new Chart(ctxStatus, {
      type: 'doughnut',
      data: {
        labels: ['ปกติ', 'ต้องซ่อม', 'หมดอายุ', 'ชำรุด'],
        datasets: [{
          data: [
            stats.byStatus['ปกติ'] || 0,
            stats.byStatus['ต้องซ่อม'] || 0,
            stats.expired,
            stats.byStatus['ชำรุด'] || 0
          ],
          backgroundColor: ['#28a745', '#ffc107', '#dc3545', '#6c757d'],
          borderColor: '#fff',
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { position: 'bottom' },
          tooltip: { callbacks: { label: (ctx) => `${ctx.label}: ${ctx.parsed}` } }
        }
      }
    });
  }

  // Bar Chart - By Type
  const ctxType = document.getElementById('typeChart')?.getContext('2d');
  if (ctxType) {
    const types = Object.keys(stats.byType);
    const counts = Object.values(stats.byType);
    
    new Chart(ctxType, {
      type: 'bar',
      data: {
        labels: types,
        datasets: [{
          label: 'จำนวนถัง',
          data: counts,
          backgroundColor: '#667eea',
          borderColor: '#667eea',
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        plugins: { legend: { display: true } },
        scales: { y: { beginAtZero: true } }
      }
    });
  }
}

/**
 * โหลดการตรวจเช็คล่าสุด
 */
async function loadRecentInspections() {
  try {
    const snapshot = await firebase.firestore()
      .collection('inspections')
      .orderBy('inspectionDate', 'desc')
      .limit(10)
      .get();

    const tbody = document.getElementById('recent-inspections-tbody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    snapshot.forEach(doc => {
      const inspection = doc.data();
      const row = tbody.insertRow();
      
      row.innerHTML = `
        <td>${inspection.extinguisherId}</td>
        <td>${formatThaiDate(inspection.inspectionDate)}</td>
        <td>${inspection.inspector.name}</td>
        <td><span class="badge ${inspection.result === 'ผ่าน' ? 'badge-passed' : 'badge-failed'}">${inspection.result}</span></td>
        <td><button class="btn btn-sm btn-info" onclick="viewInspectionDetails('${doc.id}')">ดูรายละเอียด</button></td>
      `;
    });
  } catch (error) {
    console.error('Load recent inspections error:', error);
  }
}

/**
 * ดูรายละเอียดการตรวจ
 */
async function viewInspectionDetails(inspectionId) {
  try {
    const doc = await firebase.firestore().collection('inspections').doc(inspectionId).get();
    const inspection = doc.data();
    
    sessionStorage.setItem('selectedInspection', JSON.stringify({
      id: inspectionId,
      data: inspection
    }));
    
    window.location.href = 'history.html';
  } catch (error) {
    console.error('View inspection error:', error);
    showError('ข้อผิดพลาด', error.message);
  }
}

console.log('✅ Dashboard module loaded');