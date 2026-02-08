import { auth } from '../firebase-config.js';
import { signInWithEmailAndPassword, onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/10.14.0/firebase-auth.js';

const loginScreen = document.getElementById('login-screen');
const dashboard = document.getElementById('dashboard');
const loginForm = document.getElementById('login-form');
const loginError = document.getElementById('login-error');
const userEmail = document.getElementById('user-email');
const logoutBtn = document.getElementById('logout-btn');

// 認証状態の監視
onAuthStateChanged(auth, (user) => {
  if (user) {
    if (loginScreen) loginScreen.classList.add('hidden');
    if (dashboard) dashboard.classList.remove('hidden');
    if (userEmail) userEmail.textContent = user.email;
    window.dispatchEvent(new CustomEvent('auth-ready', { detail: user }));
  } else {
    if (loginScreen) loginScreen.classList.remove('hidden');
    if (dashboard) dashboard.classList.add('hidden');
  }
});

// ログイン
if (loginForm) {
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (loginError) loginError.textContent = '';
    const btn = document.getElementById('login-btn');
    if (btn) btn.disabled = true;

    const email = document.getElementById('login-email')?.value || '';
    const password = document.getElementById('login-password')?.value || '';

    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      if (loginError) loginError.textContent = 'メールアドレスまたはパスワードが正しくありません';
      console.error('Login error:', err);
    } finally {
      if (btn) btn.disabled = false;
    }
  });
}

// ログアウト
if (logoutBtn) {
  logoutBtn.addEventListener('click', () => {
    signOut(auth);
  });
}
