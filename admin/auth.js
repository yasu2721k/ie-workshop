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
    loginScreen.classList.add('hidden');
    dashboard.classList.remove('hidden');
    userEmail.textContent = user.email;
    window.dispatchEvent(new CustomEvent('auth-ready', { detail: user }));
  } else {
    loginScreen.classList.remove('hidden');
    dashboard.classList.add('hidden');
  }
});

// ログイン
loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  loginError.textContent = '';
  const btn = document.getElementById('login-btn');
  btn.disabled = true;

  const email = document.getElementById('login-email').value;
  const password = document.getElementById('login-password').value;

  try {
    await signInWithEmailAndPassword(auth, email, password);
  } catch (err) {
    loginError.textContent = 'メールアドレスまたはパスワードが正しくありません';
    console.error('Login error:', err);
  } finally {
    btn.disabled = false;
  }
});

// ログアウト
logoutBtn.addEventListener('click', () => {
  signOut(auth);
});
