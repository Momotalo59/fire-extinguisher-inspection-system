// 🔐 Authentication Module - ระบบเข้าสู่ระบบ

/**
 * ลงชื่อเข้าใช้
 */
async function login(email, password) {
  showLoading();
  try {
    const userCredential = await firebase.auth().signInWithEmailAndPassword(email, password);
    const user = userCredential.user;
    
    // ดึงข้อมูล Role จาก Firestore
    const userDoc = await firebase.firestore().collection('users').doc(user.uid).get();
    const userData = userDoc.data();
    
    // บันทึก Session
    sessionStorage.setItem('user', JSON.stringify({
      uid: user.uid,
      email: user.email,
      displayName: userData?.displayName || user.displayName,
      role: userData?.role || 'viewer',
      building: userData?.building || ''
    }));
    
    hideLoading();
    logAction('login_success', { email: user.email });
    
    // Redirect ไปแดชบอร์ด
    window.location.href = 'dashboard.html';
  } catch (error) {
    hideLoading();
    console.error('Login error:', error);
    
    let errorMessage = 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ';
    if (error.code === 'auth/user-not-found') {
      errorMessage = 'ไม่พบอีเมลนี้ในระบบ';
    } else if (error.code === 'auth/wrong-password') {
      errorMessage = 'รหัสผ่านผ่านไม่ถูกต้อง';
    } else if (error.code === 'auth/invalid-email') {
      errorMessage = 'อีเมลไม่ถูกต้อง';
    }
    
    showError('ลงชื่อเข้าใช้ไม่สำเร็จ', errorMessage);
  }
}

/**
 * ลงชื่อออก
 */
async function logout() {
  showLoading();
  try {
    const user = firebase.auth().currentUser;
    if (user) {
      logAction('logout', { email: user.email });
    }
    
    await firebase.auth().signOut();
    sessionStorage.removeItem('user');
    hideLoading();
    
    // Redirect ไปหน้า Login
    window.location.href = 'index.html';
  } catch (error) {
    hideLoading();
    console.error('Logout error:', error);
    showError('ลงชื่อออกไม่สำเร็จ', error.message);
  }
}

/**
 * สมัครสมาชิก (สำหรับ Admin เท่านั้น)
 */
async function registerUser(email, password, displayName, role = 'inspector', building = '') {
  showLoading();
  try {
    // สร้าง User ใน Firebase Auth
    const userCredential = await firebase.auth().createUserWithEmailAndPassword(email, password);
    const user = userCredential.user;
    
    // Update Profile
    await user.updateProfile({
      displayName: displayName
    });
    
    // บันทึกข้อมูล User ใน Firestore
    await firebase.firestore().collection('users').doc(user.uid).set({
      uid: user.uid,
      email: email,
      displayName: displayName,
      role: role,
      building: building,
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    
    hideLoading();
    logAction('user_created', { email: email, role: role });
    showSuccess('สมัครสมาชิกสำเร็จ', `ผู้ใช้ ${displayName} ถูกสร้างแล้ว`);
    return user.uid;
  } catch (error) {
    hideLoading();
    console.error('Register error:', error);
    
    let errorMessage = 'เกิดข้อผิดพลาด';
    if (error.code === 'auth/email-already-in-use') {
      errorMessage = 'อีเมลนี้ถูกใช้แล้ว';
    } else if (error.code === 'auth/weak-password') {
      errorMessage = 'รหัสผ่านอ่อนแอ (ต้องอย่างน้อย 6 ตัวอักษร)';
    } else if (error.code === 'auth/invalid-email') {
      errorMessage = 'อีเมลไม่ถูกต้อง';
    }
    
    showError('สมัครสมาชิกไม่สำเร็จ', errorMessage);
    throw error;
  }
}

/**
 * ตรวจสอบสถานะ Login
 */
function checkAuth() {
  return new Promise((resolve) => {
    firebase.auth().onAuthStateChanged((user) => {
      if (user) {
        // ผู้ใช้ได้เข้าสู่ระบบแล้ว
        const sessionUser = sessionStorage.getItem('user');
        if (sessionUser) {
          resolve(JSON.parse(sessionUser));
        } else {
          resolve({
            uid: user.uid,
            email: user.email,
            displayName: user.displayName
          });
        }
      } else {
        // ไม่ได้เข้าสู่ระบบ - Redirect ไปหน้า Login
        resolve(null);
      }
    });
  });
}

/**
 * ตรวจสอบ Permission
 */
async function checkPermission(requiredRole) {
  const user = JSON.parse(sessionStorage.getItem('user') || '{}');
  const userRole = user.role || 'viewer';
  
  const roleHierarchy = {
    'admin': 3,
    'supervisor': 2,
    'inspector': 1,
    'viewer': 0
  };
  
  return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
}

/**
 * ตั้งค่ารหัสผ่านใหม่
 */
async function resetPassword(email) {
  showLoading();
  try {
    await firebase.auth().sendPasswordResetEmail(email);
    hideLoading();
    showSuccess('ส่งอีเมลสำเร็จ', `ตรวจสอบอีเมล ${email} เพื่อตั้งรหัสผ่านใหม่`);
  } catch (error) {
    hideLoading();
    console.error('Reset password error:', error);
    showError('ส่งอีเมลล้มเหลว', error.message);
  }
}

console.log('✅ Auth module loaded');