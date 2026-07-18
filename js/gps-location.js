// 📍 GPS Location Handler - จัดการตำแหน่ง GPS

/**
 * ดึงตำแหน่งปัจจุบัน
 */
function getCurrentLocation() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation ไม่รองรับในเบราว์เซอร์นี้'));
      return;
    }

    showLoading();
    navigator.geolocation.getCurrentPosition(
      (position) => {
        hideLoading();
        const coords = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: new Date().toISOString()
        };
        console.log('Location obtained:', coords);
        resolve(coords);
      },
      (error) => {
        hideLoading();
        console.error('Geolocation error:', error);
        reject(new Error('ไม่สามารถดึงตำแหน่งได้: ' + error.message));
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  });
}

/**
 * แสดงแผนที่ Google Map
 */
function showGoogleMap(latitude, longitude, elementId = 'map') {
  const mapElement = document.getElementById(elementId);
  if (!mapElement) return;

  const map = new google.maps.Map(mapElement, {
    zoom: 15,
    center: { lat: parseFloat(latitude), lng: parseFloat(longitude) }
  });

  new google.maps.Marker({
    position: { lat: parseFloat(latitude), lng: parseFloat(longitude) },
    map: map,
    title: 'ตำแหน่งติดตั้ง'
  });
}

/**
 * คำนวณระยะห่างระหว่าง 2 จุด (Haversine Formula)
 */
function getDistanceBetween(lat1, lon1, lat2, lon2) {
  const R = 6371; // รัศมีโลก (กิโลเมตร)
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  return distance.toFixed(2);
}

/**
 * ตรวจสอบว่าตำแหน่งตรวจเช็คใกล้ตำแหน่งติดตั้งหรือไม่
 */
function verifyLocationAccuracy(inspectionLat, inspectionLon, installationLat, installationLon, maxDistance = 0.1) {
  const distance = getDistanceBetween(inspectionLat, inspectionLon, installationLat, installationLon);
  return distance <= maxDistance; // maxDistance = 100 เมตร (หน่วยเป็นกิโลเมตร)
}

/**
 * บันทึกตำแหน่ง GPS
 */
async function saveGPSLocation(extinguisherId) {
  try {
    const location = await getCurrentLocation();
    logAction('gps_location_saved', { extinguisherId, location });
    return location;
  } catch (error) {
    console.error('GPS save error:', error);
    showError('ข้อผิดพลาด', error.message);
    throw error;
  }
}

console.log('✅ GPS Location module loaded');