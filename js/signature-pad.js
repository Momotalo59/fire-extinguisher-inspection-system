// ✍️ Signature Pad Handler - ลายเซ็นดิจิทัล

let signaturePad = null;
let supervisorSignaturePad = null;

/**
 * เริ่มต้น Signature Pad
 */
function initSignaturePad(canvasId = 'signature-canvas') {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;

  // ปรับขนาด Canvas
  canvas.width = canvas.offsetWidth;
  canvas.height = canvas.offsetHeight;

  signaturePad = new SignaturePad(canvas, {
    backgroundColor: 'rgb(255, 255, 255)',
    penColor: 'rgb(0, 0, 0)',
    throttle: 16
  });
}

/**
 * เริ่มต้น Supervisor Signature Pad
 */
function initSupervisorSignaturePad(canvasId = 'supervisor-signature-canvas') {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;

  canvas.width = canvas.offsetWidth;
  canvas.height = canvas.offsetHeight;

  supervisorSignaturePad = new SignaturePad(canvas, {
    backgroundColor: 'rgb(255, 255, 255)',
    penColor: 'rgb(0, 0, 0)',
    throttle: 16
  });
}

/**
 * ล้างลายเซ็น
 */
function clearSignature() {
  if (signaturePad) {
    signaturePad.clear();
  }
}

/**
 * ล้างลายเซ็นหัวหน้า
 */
function clearSupervisorSignature() {
  if (supervisorSignaturePad) {
    supervisorSignaturePad.clear();
  }
}

/**
 * ตรวจสอบว่ามีลายเซ็นหรือไม่
 */
function isSignatureEmpty() {
  return signaturePad ? signaturePad.isEmpty() : true;
}

/**
 * ตรวจสอบว่ามีลายเซ็นหัวหน้าหรือไม่
 */
function isSupervisorSignatureEmpty() {
  return supervisorSignaturePad ? supervisorSignaturePad.isEmpty() : true;
}

/**
 * ดึงลายเซ็นเป็น Data URL
 */
function getSignatureDataURL() {
  if (signaturePad && !signaturePad.isEmpty()) {
    return signaturePad.toDataURL('image/png');
  }
  return null;
}

/**
 * ดึงลายเซ็นหัวหน้าเป็น Data URL
 */
function getSupervisorSignatureDataURL() {
  if (supervisorSignaturePad && !supervisorSignaturePad.isEmpty()) {
    return supervisorSignaturePad.toDataURL('image/png');
  }
  return null;
}

/**
 * บันทึกลายเซ็น
 */
async function saveSignature(inspectionId) {
  if (isSignatureEmpty()) {
    showError('ไม่มีลายเซ็น', 'กรุณาลงลายเซ็นของผู้ตรวจ');
    return null;
  }

  try {
    const signatureDataURL = getSignatureDataURL();
    const blob = base64ToBlob(signatureDataURL);
    const path = `inspections/${inspectionId}/signature-inspector.png`;
    const url = await uploadToStorage(blob, path);
    
    logAction('signature_saved', { inspectionId });
    return url;
  } catch (error) {
    console.error('Save signature error:', error);
    showError('บันทึกลายเซ็นไม่สำเร็จ', error.message);
    throw error;
  }
}

/**
 * บันทึกลายเซ็นหัวหน้า
 */
async function saveSupervisorSignature(inspectionId) {
  if (isSupervisorSignatureEmpty()) {
    showError('ไม่มีลายเซ็น', 'กรุณาลงลายเซ็นของหัวหน้างาน');
    return null;
  }

  try {
    const signatureDataURL = getSupervisorSignatureDataURL();
    const blob = base64ToBlob(signatureDataURL);
    const path = `inspections/${inspectionId}/signature-supervisor.png`;
    const url = await uploadToStorage(blob, path);
    
    logAction('supervisor_signature_saved', { inspectionId });
    return url;
  } catch (error) {
    console.error('Save supervisor signature error:', error);
    showError('บันทึกลายเซ็นไม่สำเร็จ', error.message);
    throw error;
  }
}

/**
 * ปรินท์ลายเซ็น
 */
function printSignature() {
  if (isSignatureEmpty()) {
    showError('ข้อผิดพลาด', 'ยังไม่มีลายเซ็น');
    return;
  }

  const printWindow = window.open('', '', 'height=400,width=600');
  const signatureImage = getSignatureDataURL();
  
  printWindow.document.write(`
    <html>
    <head>
      <title>พิมพ์ลายเซ็น</title>
      <style>
        body { margin: 20px; text-align: center; }
        img { max-width: 400px; border: 1px solid #000; margin: 20px 0; }
      </style>
    </head>
    <body>
      <h2>ลายเซ็นผู้ตรวจ</h2>
      <img src="${signatureImage}" alt="Signature">
      <script>window.print(); window.close();</script>
    </body>
    </html>
  `);
  printWindow.document.close();
}

console.log('✅ Signature Pad module loaded');