// 📊 Inspection Form Handler - ฟอร์มตรวจเช็ค

let currentInspection = {};
let inspectionPhotos = [];

/**
 * โหลดข้อมูลถังดับเพลิง
 */
async function loadExtinguisherData() {
  try {
    const selectedData = JSON.parse(sessionStorage.getItem('selectedExtinguisher') || '{}');
    if (!selectedData.id) {
      showError('ข้อมูลไม่สมบูรณ์', 'ไม่พบข้อมูลถังดับเพลิง');
      return;
    }

    currentInspection.extinguisherId = selectedData.id;
    currentInspection.extinguisher = selectedData.data;

    // แสดงข้อมูลถังบนหน้าจอ
    displayExtinguisherInfo(selectedData.data);
    
    // โหลดประวัติการตรวจก่อนหน้า
    await loadPreviousInspection(selectedData.id);
  } catch (error) {
    console.error('Load extinguisher error:', error);
    showError('ข้อผิดพลาด', error.message);
  }
}

/**
 * แสดงข้อมูลถังบนหน้า
 */
function displayExtinguisherInfo(extinguisher) {
  document.getElementById('ext-id').textContent = extinguisher.id || '-';
  document.getElementById('ext-type').textContent = extinguisher.type || '-';
  document.getElementById('ext-capacity').textContent = extinguisher.capacity || '-';
  document.getElementById('ext-location').textContent = `${extinguisher.location.building} - ห้อง ${extinguisher.location.room}` || '-';
  document.getElementById('ext-expiry').textContent = formatThaiDate(extinguisher.expiryDate) || '-';
}

/**
 * โหลดข้อมูลการตรวจก่อนหน้า
 */
async function loadPreviousInspection(extinguisherId) {
  try {
    const snapshot = await firebase.firestore()
      .collection('inspections')
      .where('extinguisherId', '==', extinguisherId)
      .orderBy('inspectionDate', 'desc')
      .limit(1)
      .get();

    if (!snapshot.empty) {
      const previousInspection = snapshot.docs[0].data();
      // Fill form with previous data if needed
      currentInspection.previousInspection = previousInspection;
    }
  } catch (error) {
    console.error('Load previous inspection error:', error);
  }
}

/**
 * บันทึกผลการตรวจเช็ค
 */
async function submitInspection(event) {
  event.preventDefault();
  showLoading();

  try {
    const user = firebase.auth().currentUser;
    if (!user) throw new Error('User not authenticated');

    // รวบรวมข้อมูล
    const checkList = {
      pressure: {
        status: document.getElementById('pressure-status').value,
        value: document.getElementById('pressure-value').value,
        notes: document.getElementById('pressure-notes').value
      },
      seal: {
        status: document.getElementById('seal-status').value,
        notes: document.getElementById('seal-notes').value
      },
      pin: {
        status: document.getElementById('pin-status').value,
        notes: document.getElementById('pin-notes').value
      },
      hose: {
        status: document.getElementById('hose-status').value,
        notes: document.getElementById('hose-notes').value
      },
      nozzle: {
        status: document.getElementById('nozzle-status').value,
        notes: document.getElementById('nozzle-notes').value
      },
      cylinder: {
        status: document.getElementById('cylinder-status').value,
        notes: document.getElementById('cylinder-notes').value
      },
      rust: {
        status: document.getElementById('rust-status').value,
        notes: document.getElementById('rust-notes').value
      },
      dent: {
        status: document.getElementById('dent-status').value,
        notes: document.getElementById('dent-notes').value
      },
      label: {
        status: document.getElementById('label-status').value,
        notes: document.getElementById('label-notes').value
      }
    };

    // ดึง GPS Location
    const location = await getCurrentLocation();

    // อัปโหลดรูปภาพ
    let photoUrls = [];
    const photoInput = document.getElementById('photo-input');
    if (photoInput.files && photoInput.files.length > 0) {
      photoUrls = await uploadImages(photoInput.files, currentInspection.extinguisherId);
    }

    // บันทึกลายเซ็น
    let inspectorSignature = null;
    if (!isSignatureEmpty()) {
      inspectorSignature = await saveSignature(currentInspection.extinguisherId);
    }

    // สร้าง Inspection Record
    const inspectionData = {
      extinguisherId: currentInspection.extinguisherId,
      inspectionDate: formatDate(new Date()),
      inspectionType: document.getElementById('inspection-type').value,
      inspector: {
        uid: user.uid,
        email: user.email,
        name: user.displayName
      },
      checkList: checkList,
      photos: {
        before: photoUrls.slice(0, Math.ceil(photoUrls.length / 2)),
        after: photoUrls.slice(Math.ceil(photoUrls.length / 2))
      },
      location: location,
      signature: {
        inspector: inspectorSignature
      },
      result: determineResult(checkList),
      notes: document.getElementById('notes').value,
      nextInspectionDate: calculateNextInspectionDate(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // บันทึกลง Firestore
    const docRef = await firebase.firestore().collection('inspections').add(inspectionData);
    
    // อัปเดต Fire Extinguisher
    await firebase.firestore().collection('fireExtinguishers')
      .doc(currentInspection.extinguisherId)
      .update({
        lastInspectionDate: inspectionData.inspectionDate,
        nextInspectionDate: inspectionData.nextInspectionDate,
        status: inspectionData.result === 'ผ่าน' ? 'ปกติ' : 'ต้องซ่อม'
      });

    hideLoading();
    logAction('inspection_completed', { inspectionId: docRef.id, extinguisherId: currentInspection.extinguisherId });
    
    showSuccess('บันทึกเสร็จสิ้น', 'ผลการตรวจเช็คถูกบันทึกเรียบร้อยแล้ว');
    
    setTimeout(() => {
      window.location.href = 'dashboard.html';
    }, 2000);
  } catch (error) {
    hideLoading();
    console.error('Submit inspection error:', error);
    showError('บันทึกไม่สำเร็จ', error.message);
  }
}

/**
 * คำนวณผลการตรวจ
 */
function determineResult(checkList) {
  let allPassed = true;
  for (let key in checkList) {
    if (checkList[key].status === 'ผิดปกติ' || checkList[key].status === 'ต้องซ่อม') {
      allPassed = false;
      break;
    }
  }
  return allPassed ? 'ผ่าน' : 'ไม่ผ่าน';
}

/**
 * คำนวณวันตรวจครั้งถัดไป
 */
function calculateNextInspectionDate() {
  const today = new Date();
  const nextDate = new Date(today.getFullYear(), today.getMonth() + 1, today.getDate());
  return formatDate(nextDate);
}

console.log('✅ Inspection module loaded');