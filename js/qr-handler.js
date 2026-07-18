// 🔍 QR Code Handler - สแกนและจัดการ QR Code

/**
 * เริ่มต้นสแกน QR Code
 */
async function startQRScanner() {
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const videoDevices = devices.filter(device => device.kind === 'videoinput');
    
    if (videoDevices.length === 0) {
      showError('ข้อผิดพลาด', 'ไม่พบกล้องในอุปกรณ์');
      return;
    }

    const video = document.getElementById('qr-scanner-video');
    const canvas = document.getElementById('qr-scanner-canvas');
    const context = canvas.getContext('2d');

    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'environment' }
    });

    video.srcObject = stream;
    video.onloadedmetadata = () => {
      video.play();
      scanQRFrame(video, canvas, context);
    };
  } catch (error) {
    console.error('Camera error:', error);
    showError('ข้อผิดพลาด', 'ไม่สามารถเข้าถึงกล้องได้');
  }
}

/**
 * สแกน QR Frame ต่อเนื่อง
 */
function scanQRFrame(video, canvas, context) {
  if (video.readyState === video.HAVE_ENOUGH_DATA) {
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0);

    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    const code = jsQR(imageData.data, imageData.width, imageData.height);

    if (code) {
      // พบ QR Code
      handleQRScanned(code.data);
      return;
    }
  }
  requestAnimationFrame(() => scanQRFrame(video, canvas, context));
}

/**
 * จัดการ QR Code ที่สแกนได้
 */
async function handleQRScanned(qrData) {
  console.log('QR Code Scanned:', qrData);
  logAction('qr_scanned', { qrCode: qrData });

  showLoading();
  try {
    // ค้นหาถังดับเพลิงจาก QR Code
    const snapshot = await firebase.firestore()
      .collection('fireExtinguishers')
      .where('qrCode', '==', qrData)
      .limit(1)
      .get();

    if (snapshot.empty) {
      hideLoading();
      showError('ไม่พบถัง', 'ไม่พบข้อมูลถังดับเพลิงสำหรับ QR Code นี้');
      return;
    }

    const extinguisher = snapshot.docs[0];
    hideLoading();

    // บันทึกข้อมูลและเปลี่ยนหน้า
    sessionStorage.setItem('selectedExtinguisher', JSON.stringify({
      id: extinguisher.id,
      data: extinguisher.data()
    }));

    // Redirect ไปฟอร์มตรวจเช็ค
    window.location.href = 'inspection-form.html';
  } catch (error) {
    hideLoading();
    console.error('QR scan error:', error);
    showError('ข้อผิดพลาด', error.message);
  }
}

/**
 * หยุดสแกน QR Code
 */
function stopQRScanner() {
  const video = document.getElementById('qr-scanner-video');
  if (video && video.srcObject) {
    const tracks = video.srcObject.getTracks();
    tracks.forEach(track => track.stop());
  }
}

/**
 * สร้าง QR Code จากข้อมูล
 */
function generateQRFromData(data, elementId = 'qr-code-display') {
  const element = document.getElementById(elementId);
  if (element) {
    element.innerHTML = '';
    new QRCode(element, {
      text: data,
      width: 300,
      height: 300,
      colorDark: '#000000',
      colorLight: '#ffffff',
      correctLevel: QRCode.CorrectLevel.H
    });
  }
}

/**
 * พิมพ์ QR Code Label
 */
function printQRLabel(extinguisherId) {
  const printWindow = window.open('', '', 'height=400,width=600');
  const qrElement = document.getElementById('qr-code-display');
  const qrImage = qrElement.querySelector('img').src;

  printWindow.document.write(`
    <html>
    <head>
      <title>พิมพ์ QR Code Label</title>
      <style>
        body { margin: 20px; text-align: center; font-family: Arial, sans-serif; }
        .label { border: 2px solid #000; padding: 20px; width: 300px; margin: 0 auto; }
        h3 { margin: 10px 0; }
        img { width: 200px; height: 200px; margin: 10px 0; }
        .id { font-size: 18px; font-weight: bold; letter-spacing: 2px; }
      </style>
    </head>
    <body>
      <div class="label">
        <h3>ถังดับเพลิง</h3>
        <img src="${qrImage}" alt="QR Code">
        <div class="id">${extinguisherId}</div>
      </div>
      <script>window.print(); window.close();</script>
    </body>
    </html>
  `);
  printWindow.document.close();
}

console.log('✅ QR Handler module loaded');