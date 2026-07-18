// 💭 Notifications Module - ระบบแจ้งเตือน

/**
 * ส่งหฮ Email Notification
 */
async function sendEmailNotification(email, subject, message) {
  try {
    const response = await fetch('/.netlify/functions/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, subject, message })
    });

    if (!response.ok) throw new Error('Email send failed');
    logAction('email_sent', { email, subject });
    return true;
  } catch (error) {
    console.error('Email notification error:', error);
    return false;
  }
}

/**
 * ส่งหฮ LINE Notify
 */
async function sendLINENotification(token, message) {
  try {
    const response = await fetch('https://notify-api.line.me/api/notify', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({ message })
    });

    if (!response.ok) throw new Error('LINE send failed');
    logAction('line_notification_sent', { message });
    return true;
  } catch (error) {
    console.error('LINE notification error:', error);
    return false;
  }
}

/**
 * ส่งหฮ Telegram
 */
async function sendTelegramNotification(botToken, chatId, message) {
  try {
    const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'HTML'
      })
    });

    if (!response.ok) throw new Error('Telegram send failed');
    logAction('telegram_notification_sent', { chatId, message });
    return true;
  } catch (error) {
    console.error('Telegram notification error:', error);
    return false;
  }
}

/**
 * ส่งหฮ In-App Notification
 */
function showInAppNotification(type, title, message, duration = 3000) {
  Swal.fire({
    icon: type,
    title: title,
    text: message,
    position: 'top-end',
    toast: true,
    showConfirmButton: false,
    timer: duration,
    timerProgressBar: true
  });
}

/**
 * แจ้งเตือนเมื่อใกล้หมดอายุ
 */
async function notifyExpiryWarning(extinguisher) {
  const daysUntilExpiry = daysBetween(new Date(), new Date(extinguisher.expiryDate));
  
  if (daysUntilExpiry <= 30 && daysUntilExpiry >= 0) {
    const message = `⚠️ ถัง ${extinguisher.id} (ประเทศ${extinguisher.type}) ใกล้หมดอายุในอีก ${daysUntilExpiry} วัน`;
    
    try {
      // บันทึก Notification ใน Firestore
      await firebase.firestore().collection('notifications').add({
        type: 'expiryWarning',
        title: '⚠️ การแจ้งเตือนหมดอายุ',
        message: message,
        extinguisherId: extinguisher.id,
        severity: daysUntilExpiry <= 7 ? 'high' : 'medium',
        createdAt: new Date().toISOString(),
        read: false
      });

      showInAppNotification('warning', '⚠️ การแจ้งเตือน', message);
    } catch (error) {
      console.error('Expiry notification error:', error);
    }
  }
}

/**
 * แจ้งเตือนการตรวจมั่นเอง
 */
async function notifyInspectionDue(extinguisher) {
  const daysUntilInspection = daysBetween(new Date(), new Date(extinguisher.nextInspectionDate));
  
  if (daysUntilInspection <= 7 && daysUntilInspection >= 0) {
    const message = `💫 ถัง ${extinguisher.id} ครบกำหนดตรวจใน ${daysUntilInspection} วัน`;
    
    try {
      await firebase.firestore().collection('notifications').add({
        type: 'inspectionDue',
        title: '💫 ครบกำหนดตรวจ',
        message: message,
        extinguisherId: extinguisher.id,
        severity: 'high',
        createdAt: new Date().toISOString(),
        read: false
      });

      showInAppNotification('info', 'ud83d� ครบกำหนดตรวจ', message);
    } catch (error) {
      console.error('Inspection due notification error:', error);
    }
  }
}

/**
 * แจ้งเตือนแรงดันต่ำ
 */
async function notifyLowPressure(extinguisherId, pressure) {
  const message = `⚠️ ถัง ${extinguisherId} มีแรงดันต่ำ (${pressure} Bar)`;
  
  try {
    await firebase.firestore().collection('notifications').add({
      type: 'lowPressure',
      title: '⚠️ แรงดันต่ำ',
      message: message,
      extinguisherId: extinguisherId,
      severity: 'high',
      createdAt: new Date().toISOString(),
      read: false
    });

    showInAppNotification('error', '⚠️ แรงดันต่ำ', message);
  } catch (error) {
    console.error('Low pressure notification error:', error);
  }
}

/**
 * ปคม Notifications ที่ยังไม่ได้อ่าน
 */
async function countUnreadNotifications() {
  try {
    const snapshot = await firebase.firestore()
      .collection('notifications')
      .where('read', '==', false)
      .get();
    
    return snapshot.size;
  } catch (error) {
    console.error('Count notifications error:', error);
    return 0;
  }
}

/**
 * ทำเครื่องหมายว่า Notification ถูกอ่านแล้ว
 */
async function markNotificationAsRead(notificationId) {
  try {
    await firebase.firestore()
      .collection('notifications')
      .doc(notificationId)
      .update({ read: true });
  } catch (error) {
    console.error('Mark as read error:', error);
  }
}

console.log('✅ Notifications module loaded');