// 📸 Camera & Upload Handler - จัดการกล้องและอัปโหลด

/**
 * เปิดกล้องเพื่อถ่ายรูป
 */
async function openCamera(elementId = 'camera-input') {
  try {
    const input = document.getElementById(elementId);
    input.click();
  } catch (error) {
    console.error('Camera error:', error);
    showError('ข้อผิดพลาด', 'ไม่สามารถเปิดกล้องได้');
  }
}

/**
 * จัดการรูปภาพที่เลือก
 */
async function handleImageUpload(event, previewElementId = 'image-preview') {
  const files = event.target.files;
  const previewElement = document.getElementById(previewElementId);
  
  if (!files || files.length === 0) return;

  // แสดง Preview
  for (let file of files) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = document.createElement('img');
      img.src = e.target.result;
      img.style.maxWidth = '200px';
      img.style.margin = '10px';
      img.style.borderRadius = '8px';
      previewElement.appendChild(img);
    };
    reader.readAsDataURL(file);
  }

  // บันทึกไฟล์ไว้อัปโหลด
  sessionStorage.setItem('pendingImages', JSON.stringify(Array.from(files).map(f => f.name)));
}

/**
 * อัปโหลดรูปไป Firebase Storage
 */
async function uploadImages(files, inspectionId) {
  showLoading();
  const uploadedUrls = [];

  try {
    for (let file of files) {
      const timestamp = Date.now();
      const path = `inspections/${inspectionId}/${timestamp}-${file.name}`;
      const url = await uploadToStorage(file, path);
      uploadedUrls.push(url);
    }

    hideLoading();
    logAction('images_uploaded', { inspectionId, count: uploadedUrls.length });
    return uploadedUrls;
  } catch (error) {
    hideLoading();
    console.error('Upload images error:', error);
    showError('อัปโหลดไม่สำเร็จ', error.message);
    throw error;
  }
}

/**
 * ถ่ายรูปจากกล้องแบบ Base64
 */
async function capturePhotoAsBase64(videoElementId = 'camera-video') {
  const video = document.getElementById(videoElementId);
  if (!video) {
    showError('ข้อผิดพลาด', 'ไม่พบองค์ประกอบวิดีโอ');
    return null;
  }

  const canvas = document.createElement('canvas');
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  const context = canvas.getContext('2d');
  context.drawImage(video, 0, 0);
  
  return canvas.toDataURL('image/jpeg');
}

/**
 * ถ่ายรูปหลายภาพ
 */
function setupMultipleImageCapture(inputId, previewContainerId) {
  const input = document.getElementById(inputId);
  const container = document.getElementById(previewContainerId);

  input.addEventListener('change', async (event) => {
    const files = event.target.files;
    container.innerHTML = '';

    for (let file of files) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const wrapper = document.createElement('div');
        wrapper.style.position = 'relative';
        wrapper.style.display = 'inline-block';
        wrapper.style.margin = '10px';

        const img = document.createElement('img');
        img.src = e.target.result;
        img.style.maxWidth = '150px';
        img.style.borderRadius = '8px';
        img.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';

        const removeBtn = document.createElement('button');
        removeBtn.innerHTML = '✕';
        removeBtn.style.position = 'absolute';
        removeBtn.style.top = '5px';
        removeBtn.style.right = '5px';
        removeBtn.style.background = '#dc3545';
        removeBtn.style.color = 'white';
        removeBtn.style.border = 'none';
        removeBtn.style.borderRadius = '50%';
        removeBtn.style.width = '30px';
        removeBtn.style.height = '30px';
        removeBtn.style.cursor = 'pointer';
        removeBtn.onclick = () => wrapper.remove();

        wrapper.appendChild(img);
        wrapper.appendChild(removeBtn);
        container.appendChild(wrapper);
      };
      reader.readAsDataURL(file);
    }
  });
}

console.log('✅ Camera & Upload module loaded');