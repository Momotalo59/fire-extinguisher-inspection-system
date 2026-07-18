// 🔧 Utility Functions - ฟังก์ชั่นช่วยเหลือทั่วไป

/**
 * แสดง Loading Spinner
 */
function showLoading() {
  Swal.fire({
    title: 'กำลังโหลด...',
    allowOutsideClick: false,
    didOpen: (toast) => {
      Swal.showLoading();
    }
  });
}

/**
 * ปิด Loading Spinner
 */
function hideLoading() {
  Swal.close();
}

/**
 * แสดง Success Message
 */
function showSuccess(title, message = '') {
  return Swal.fire({
    icon: 'success',
    title: title,
    text: message,
    confirmButtonText: 'ตกลง'
  });
}

/**
 * แสดง Error Message
 */
function showError(title, message = '') {
  return Swal.fire({
    icon: 'error',
    title: title,
    text: message,
    confirmButtonText: 'ตกลง'
  });
}

/**
 * แสดง Warning Message
 */
function showWarning(title, message = '') {
  return Swal.fire({
    icon: 'warning',
    title: title,
    text: message,
    confirmButtonText: 'ตกลง'
  });
}

/**
 * Confirm Dialog
 */
function showConfirm(title, message = '') {
  return Swal.fire({
    icon: 'question',
    title: title,
    text: message,
    showCancelButton: true,
    confirmButtonText: 'ยืนยัน',
    cancelButtonText: 'ยกเลิก'
  });
}

/**
 * ฟังก์ชั่นบันทึก Log
 */
function logAction(action, details = {}) {
  const user = firebase.auth().currentUser;
  const timestamp = new Date().toISOString();
  
  console.log(`[${timestamp}] ${action}:`, details);
  
  // บันทึกไป Firestore (ทางเลือก)
  if (user) {
    firebase.firestore().collection('activityLogs').add({
      userId: user.uid,
      userEmail: user.email,
      action: action,
      details: details,
      timestamp: timestamp
    }).catch(err => console.error('Log error:', err));
  }
}

/**
 * Format วันที่เป็น Thai Format
 */
function formatThaiDate(date) {
  if (!(date instanceof Date)) {
    date = new Date(date);
  }
  
  const months = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
                  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];
  
  const day = date.getDate();
  const month = months[date.getMonth()];
  const year = date.getFullYear() + 543; // Convert to Buddhist calendar
  
  return `${day} ${month} ${year}`;
}

/**
 * Format วันที่เป็น YYYY-MM-DD
 */
function formatDate(date) {
  if (!(date instanceof Date)) {
    date = new Date(date);
  }
  
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
}

/**
 * คำนวณจำนวนวัน
 */
function daysBetween(date1, date2) {
  const one_day = 24 * 60 * 60 * 1000;
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  return Math.round((d2.getTime() - d1.getTime()) / one_day);
}

/**
 * ตรวจสอบว่าหมดอายุหรือไม่
 */
function isExpired(expiryDate) {
  return new Date() > new Date(expiryDate);
}

/**
 * ตรวจสอบว่าใกล้หมดอายุหรือไม่ (ในอีก 30 วัน)
 */
function isExpiringSoon(expiryDate, days = 30) {
  const today = new Date();
  const expiry = new Date(expiryDate);
  const daysUntilExpiry = daysBetween(today, expiry);
  return daysUntilExpiry <= days && daysUntilExpiry >= 0;
}

/**
 * Generate QR Code
 */
function generateQRCode(text, elementId) {
  const qrContainer = document.getElementById(elementId);
  if (qrContainer) {
    qrContainer.innerHTML = '';
    const qr = new QRCode(qrContainer, {
      text: text,
      width: 256,
      height: 256,
      colorDark: '#000000',
      colorLight: '#ffffff',
      correctLevel: QRCode.CorrectLevel.H
    });
  }
}

/**
 * Convert Base64 to Blob
 */
function base64ToBlob(base64String, contentType = 'image/jpeg') {
  const byteCharacters = atob(base64String.split(',')[1] || base64String);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  return new Blob([byteArray], { type: contentType });
}

/**
 * Upload ไฟล์ไป Firebase Storage
 */
async function uploadToStorage(file, path) {
  showLoading();
  try {
    const storageRef = firebase.storage().ref();
    const fileRef = storageRef.child(path);
    const snapshot = await fileRef.put(file);
    const downloadURL = await snapshot.ref.getDownloadURL();
    hideLoading();
    return downloadURL;
  } catch (error) {
    hideLoading();
    console.error('Upload error:', error);
    throw error;
  }
}

/**
 * Validate Email
 */
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate Phone
 */
function isValidPhone(phone) {
  const phoneRegex = /^[0-9]{10}$/;
  return phoneRegex.test(phone);
}

console.log('✅ Utility functions loaded');