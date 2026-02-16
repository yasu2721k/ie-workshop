import { db } from './firebase-config.js';
import { collection, doc, getDoc, getDocs, query, where } from 'https://www.gstatic.com/firebasejs/10.14.0/firebase-firestore.js';

console.log('=== app.js v3 loaded ===');

// ===== DOM =====
const $ = (id) => document.getElementById(id);

// ===== 講座設定（Firestoreから読み込み） =====
let COURSE = null;
let TIMELINE = [];
let FIELDS = [];
let CALC_STEPS = [];
let LIFF_ID = null;
let STORAGE_KEY = 'ie-workshop';

// ===== アプリ状態 =====
const AppState = {
  currentStep: 0,
  inputs: {},
  videoTime: 0,
  isSpotlightActive: false,
  isStarted: false,
};

// ===== 講座読み込み =====
async function loadCourse() {
  const params = new URLSearchParams(location.search);
  const courseParam = params.get('course');

  if (!courseParam) {
    showError('URLに ?course=xxx パラメータが必要です');
    return null;
  }

  try {
    // まずIDで直接取得
    let snap = await getDoc(doc(db, 'courses', courseParam));

    // 見つからなければslugで検索
    if (!snap.exists()) {
      const q = query(collection(db, 'courses'), where('slug', '==', courseParam));
      const results = await getDocs(q);
      if (!results.empty) {
        snap = results.docs[0];
      }
    }

    if (!snap.exists()) {
      showError('講座が見つかりません');
      return null;
    }

    const data = snap.data();
    // preview=1 なら下書きも表示可能
    const isPreview = params.get('preview') === '1';
    if (data.status !== 'published' && !isPreview) {
      showError('この講座は現在非公開です');
      return null;
    }

    return data;
  } catch (err) {
    console.error('Course load error:', err);
    showError('講座の読み込みに失敗しました');
    return null;
  }
}

function showError(msg) {
  $('loading-screen').classList.add('hidden');
  $('error-screen').classList.remove('hidden');
  $('error-message').textContent = msg;
}

// ===== UIを動的構築 =====
function buildUI(course) {
  COURSE = course;
  FIELDS = (course.fields || []).sort((a, b) => a.order - b.order);
  TIMELINE = (course.timeline || []).map((t, i) => ({
    pauseAt: parseFloat(t.pauseAt) || 0,
    step: i + 1,
    field: t.fieldId,
    label: t.prompt,
  }));
  console.log('[buildUI] TIMELINE:', TIMELINE);
  CALC_STEPS = course.calculation?.steps || [];
  LIFF_ID = course.liffId || null;
  STORAGE_KEY = `ie-workshop-${course.slug || 'default'}`;

  // inputs初期化
  FIELDS.forEach((f) => { AppState.inputs[f.id] = null; });

  // ページタイトル
  document.title = (course.ui?.startScreenTitle || course.name) + ' | IE Workshop';

  // テーマカラー適用
  if (course.ui?.primaryColor) {
    document.documentElement.style.setProperty('--primary-color', course.ui.primaryColor);
  }

  // スタート画面
  $('start-title').textContent = course.ui?.startScreenTitle || course.name || '';
  $('start-desc').innerHTML = (course.ui?.startScreenDescription || '').replace(/\n/g, '<br>');

  // ワークシートタイトル
  $('worksheet-title').textContent = course.ui?.title || '';

  // 結果タイトル
  $('result-title').textContent = course.ui?.resultTitle || '結果';

  // フォームステップを動的生成
  const container = $('form-steps-container');
  FIELDS.forEach((field, idx) => {
    const stepEl = document.createElement('div');
    stepEl.className = 'form-step';
    stepEl.dataset.step = idx + 1;
    stepEl.id = `step-${idx + 1}`;
    stepEl.innerHTML = `
      <label for="${field.id}">${field.stepLabel || field.label}</label>
      <div class="input-line">
        <input type="${field.type || 'number'}" id="${field.id}"
               inputmode="${field.type === 'number' ? 'numeric' : 'text'}"
               placeholder="${field.placeholder || ''}">
        <span class="unit">${field.unit || ''}</span>
      </div>
    `;
    container.appendChild(stepEl);
  });

  // 動画設定
  setupVideo(course);
}

// ===== 動画セットアップ =====
let videoController;

function setupVideo(course) {
  const videoEl = $('course-video');
  const canvasEl = $('video-canvas');
  const youtubeEl = $('youtube-player');

  const videoUrl = course.video?.downloadUrl || '';
  console.log('[setupVideo] videoUrl:', videoUrl);
  console.log('[setupVideo] course.video:', course.video);

  // YouTube URL対応: watch?v=, youtu.be/, embed/, shorts/
  const youtubeMatch = videoUrl.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]+)/);
  console.log('[setupVideo] youtubeMatch:', youtubeMatch);

  if (youtubeMatch) {
    // YouTube動画
    canvasEl.style.display = 'none';
    videoEl.style.display = 'none';
    youtubeEl.style.display = 'block';
    videoController = new YouTubeController(youtubeEl, youtubeMatch[1], course.video?.duration || 60);
  } else if (videoUrl) {
    // 通常の動画ファイル
    canvasEl.style.display = 'none';
    youtubeEl.style.display = 'none';
    videoEl.style.display = 'block';
    videoEl.src = videoUrl;
    videoController = new RealVideoController(videoEl);
  } else {
    // 動画なし → Canvasモック
    videoEl.style.display = 'none';
    youtubeEl.style.display = 'none';
    canvasEl.style.display = 'block';
    videoController = new MockVideoController(canvasEl, course.video?.duration || 20);
  }

  // タイムアップデート
  videoController.onTimeUpdate = (currentTime) => {
    AppState.videoTime = currentTime;
    // デバッグ: 5秒ごとにログ出力
    if (Math.floor(currentTime) % 5 === 0 && Math.floor(currentTime) !== Math.floor(AppState.videoTime - 0.25)) {
      console.log('[onTimeUpdate] currentTime:', currentTime, 'currentStep:', AppState.currentStep);
    }
    const nextPause = TIMELINE.find(
      (t) => t.step > AppState.currentStep && currentTime >= t.pauseAt
    );
    if (nextPause) {
      console.log('[onTimeUpdate] Pause triggered:', nextPause);
      activateStep(nextPause);
    }
  };

  videoController.onEnded = () => {
    if (AppState.currentStep >= TIMELINE.length) showResult();
  };
}

// ===== YouTubeController =====
class YouTubeController {
  constructor(containerEl, videoId, duration) {
    this.container = containerEl;
    this.videoId = videoId;
    this.duration = duration;
    this.currentTime = 0;
    this.isPlaying = false;
    this.player = null;
    this.onTimeUpdate = null;
    this.onEnded = null;
    this._intervalId = null;
    this._ready = false;
    this._pendingPlay = false;

    // YouTube IFrame API読み込み
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      document.head.appendChild(tag);
    }

    window.onYouTubeIframeAPIReady = () => this._initPlayer();
    if (window.YT && window.YT.Player) this._initPlayer();
  }

  _initPlayer() {
    if (this._ready) return; // 重複防止
    this.player = new YT.Player(this.container.id || this.container, {
      videoId: this.videoId,
      playerVars: {
        playsinline: 1,
        controls: 0,
        disablekb: 1,
        modestbranding: 1,
        rel: 0,
        origin: location.origin,
      },
      events: {
        onReady: () => {
          console.log('[YouTubeController] Player ready');
          this._ready = true;
          if (this._pendingPlay) {
            console.log('[YouTubeController] Executing pending play');
            this.play();
          }
        },
        onStateChange: (e) => {
          console.log('[YouTubeController] State changed:', e.data);
          // 再生開始時（ユーザーがクリックした場合も含む）
          if (e.data === YT.PlayerState.PLAYING) {
            if (!this.isPlaying) {
              console.log('[YouTubeController] Video started playing, starting tracking');
              this.isPlaying = true;
              this._startTracking();
            }
          }
          // 一時停止時
          if (e.data === YT.PlayerState.PAUSED) {
            this.isPlaying = false;
            this._stopTracking();
          }
          // 終了時
          if (e.data === YT.PlayerState.ENDED && this.onEnded) {
            this.isPlaying = false;
            this._stopTracking();
            this.onEnded();
          }
        },
      },
    });
  }

  play() {
    console.log('[YouTubeController.play] called, _ready:', this._ready);
    if (!this._ready) {
      this._pendingPlay = true;
      console.log('[YouTubeController.play] Not ready, pending play');
      return;
    }
    this.player.playVideo();
    this.isPlaying = true;
    this._startTracking();
    console.log('[YouTubeController.play] Started tracking');
  }

  pause() {
    if (this.player && this._ready) this.player.pauseVideo();
    this.isPlaying = false;
    this._stopTracking();
  }

  seekTo(t) {
    if (this.player && this._ready) this.player.seekTo(t, true);
    this.currentTime = t;
  }

  _startTracking() {
    console.log('[YouTubeController._startTracking] Setting up interval');
    this._stopTracking();
    this._intervalId = setInterval(() => {
      if (this.player && this._ready) {
        this.currentTime = this.player.getCurrentTime();
        const pct = (this.currentTime / this.duration) * 100;
        $('video-progress-bar').style.width = pct + '%';
        if (this.onTimeUpdate) this.onTimeUpdate(this.currentTime);
      }
    }, 250);
  }

  _stopTracking() {
    if (this._intervalId) {
      clearInterval(this._intervalId);
      this._intervalId = null;
    }
  }

  render() {}
}

// ===== RealVideoController =====
class RealVideoController {
  constructor(videoEl) {
    this.video = videoEl;
    this.onTimeUpdate = null;
    this.onEnded = null;
    this.video.addEventListener('timeupdate', () => {
      if (this.onTimeUpdate) this.onTimeUpdate(this.video.currentTime);
      const pct = (this.video.currentTime / (this.video.duration || 1)) * 100;
      $('video-progress-bar').style.width = pct + '%';
    });
    this.video.addEventListener('ended', () => {
      if (this.onEnded) this.onEnded();
    });
  }
  get currentTime() { return this.video.currentTime; }
  get duration() { return this.video.duration; }
  play() { this.video.play(); }
  pause() { this.video.pause(); }
  seekTo(t) { this.video.currentTime = t; }
  render() {}
}

// ===== MockVideoController =====
class MockVideoController {
  constructor(canvasEl, duration) {
    this.canvas = canvasEl;
    this.ctx = canvasEl.getContext('2d');
    this.duration = duration;
    this.currentTime = 0;
    this.isPlaying = false;
    this.lastTimestamp = null;
    this.animationFrame = null;
    this.onTimeUpdate = null;
    this.onEnded = null;
    this._resize();
    window.addEventListener('resize', () => this._resize());
  }

  _resize() {
    const rect = this.canvas.parentElement.getBoundingClientRect();
    this.canvas.width = rect.width * window.devicePixelRatio;
    this.canvas.height = (rect.height - 4) * window.devicePixelRatio;
    this.canvas.style.width = rect.width + 'px';
    this.canvas.style.height = (rect.height - 4) + 'px';
    this.render();
  }

  play() {
    if (this.currentTime >= this.duration) return;
    this.isPlaying = true;
    this.lastTimestamp = performance.now();
    this._tick();
  }

  pause() {
    this.isPlaying = false;
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }
  }

  seekTo(time) {
    this.currentTime = Math.min(time, this.duration);
    this.render();
  }

  _tick() {
    if (!this.isPlaying) return;
    const now = performance.now();
    const delta = (now - this.lastTimestamp) / 1000;
    this.lastTimestamp = now;
    this.currentTime = Math.min(this.currentTime + delta, this.duration);
    this.render();
    if (this.onTimeUpdate) this.onTimeUpdate(this.currentTime);
    if (this.currentTime >= this.duration) {
      this.isPlaying = false;
      if (this.onEnded) this.onEnded();
      return;
    }
    this.animationFrame = requestAnimationFrame(() => this._tick());
  }

  render() {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;
    const dpr = window.devicePixelRatio;

    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, w, h);

    let displayText = COURSE?.ui?.startScreenTitle || '講座スタート！';
    let subText = '';

    for (let i = TIMELINE.length - 1; i >= 0; i--) {
      if (this.currentTime >= TIMELINE[i].pauseAt) {
        displayText = TIMELINE[i].label;
        subText = `ステップ ${TIMELINE[i].step} / ${TIMELINE.length}`;
        break;
      }
    }

    if (this.currentTime >= this.duration - 1) {
      displayText = '診断完了！';
      subText = '';
    }

    ctx.fillStyle = '#ffffff';
    ctx.font = `bold ${20 * dpr}px "Yomogi", cursive, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(displayText, w / 2, h / 2 - 10 * dpr);

    if (subText) {
      ctx.fillStyle = 'rgba(255,255,255,0.6)';
      ctx.font = `${13 * dpr}px "Yomogi", cursive, sans-serif`;
      ctx.fillText(subText, w / 2, h / 2 + 18 * dpr);
    }

    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.font = `${11 * dpr}px sans-serif`;
    ctx.textAlign = 'right';
    ctx.fillText(`${Math.floor(this.currentTime)}s / ${this.duration}s`, w - 12 * dpr, h - 10 * dpr);

    $('video-progress-bar').style.width = (this.currentTime / this.duration) * 100 + '%';
  }
}

// ===== スポットライト =====
const overlay = $('spotlight-overlay');
const nextBtn = $('next-btn');

function activateStep(entry) {
  videoController.pause();
  AppState.currentStep = entry.step;
  AppState.isSpotlightActive = true;

  overlay.classList.add('active');
  document.querySelectorAll('.form-step.spotlight').forEach((el) => el.classList.remove('spotlight'));

  const stepEl = $(`step-${entry.step}`);
  stepEl.classList.remove('locked');
  stepEl.classList.add('spotlight');

  stepEl.after(nextBtn);
  nextBtn.style.display = 'none';
  nextBtn.classList.remove('visible');

  setTimeout(() => {
    stepEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    const input = stepEl.querySelector('input');
    if (input) {
      input.focus();
      if (input.value && parseFloat(input.value) > 0) showNextBtn();
    }
  }, 300);

  saveState();
}

function showNextBtn() {
  nextBtn.style.display = 'block';
  nextBtn.classList.add('visible');
}

function hideNextBtn() {
  nextBtn.style.display = 'none';
  nextBtn.classList.remove('visible');
}

// ===== イベントバインド =====
function bindEvents() {
  // 入力監視
  TIMELINE.forEach((entry) => {
    const input = $(entry.field);
    if (!input) return;
    input.addEventListener('input', () => {
      const val = parseFloat(input.value);
      if (val > 0) showNextBtn();
      else hideNextBtn();
      AppState.inputs[entry.field] = val > 0 ? val : null;
      saveState();
    });
  });

  // 次へボタン
  nextBtn.addEventListener('click', () => {
    const entry = TIMELINE[AppState.currentStep - 1];
    if (!entry) return;

    const input = $(entry.field);
    AppState.inputs[entry.field] = parseFloat(input.value);

    overlay.classList.remove('active');
    document.querySelectorAll('.form-step.spotlight').forEach((el) => {
      el.classList.remove('spotlight');
      el.classList.add('completed');
    });
    hideNextBtn();
    AppState.isSpotlightActive = false;
    saveState();
    videoController.play();
  });

  // スタートボタン
  $('start-btn').addEventListener('click', () => {
    console.log('[start-btn] clicked, videoController:', videoController);
    AppState.isStarted = true;
    $('start-screen').classList.add('hidden');
    saveState();
    videoController.play();
  });

  // LINE送信
  $('send-line-btn').addEventListener('click', sendLineResult);

  // リセット
  $('reset-btn').addEventListener('click', () => {
    if (!confirm('入力内容をすべてリセットしますか？')) return;
    localStorage.removeItem(STORAGE_KEY);
    location.reload();
  });

  // モバイルキーボード対応
  document.querySelectorAll('.form-step input').forEach((input) => {
    input.addEventListener('focus', () => {
      setTimeout(() => {
        input.closest('.form-step').scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 300);
    });
  });
}

// ===== 計算エンジン（安全な式評価） =====
const BUILTIN = {
  LOAN_REVERSE(monthlyMan, rate, years) {
    const mr = rate / 12;
    const n = years * 12;
    const factor = (mr * Math.pow(1 + mr, n)) / (Math.pow(1 + mr, n) - 1);
    return Math.round((monthlyMan * 10000) / factor / 10000);
  },
  ROUND(v) { return Math.round(v); },
  MAX(...a) { return Math.max(...a); },
  MIN(...a) { return Math.min(...a); },
};

function evaluateFormula(formula, vars) {
  // トークン化: 数値、変数、演算子、括弧、関数呼び出し
  let expr = formula;

  // 関数呼び出しを置換: FUNC(a, b, c) → BUILTIN.FUNC(a, b, c)
  for (const fname of Object.keys(BUILTIN)) {
    const re = new RegExp(`${fname}\\(`, 'g');
    expr = expr.replace(re, `__FN__.${fname}(`);
  }

  // 変数を置換
  for (const [key, val] of Object.entries(vars)) {
    const re = new RegExp(`\\b${key}\\b`, 'g');
    expr = expr.replace(re, `(${val ?? 0})`);
  }

  // 安全性チェック: 許可する文字のみ
  const safe = expr.replace(/[0-9+\-*/().,%\s]|__FN__/g, '');
  if (safe.length > 0) {
    console.warn('Unsafe formula characters:', safe);
    return 0;
  }

  try {
    const fn = new Function('__FN__', `"use strict"; return (${expr});`);
    return fn(BUILTIN);
  } catch (e) {
    console.error('Formula error:', formula, e);
    return 0;
  }
}

function calculateResults() {
  const vars = { ...AppState.inputs };
  const results = [];

  for (const step of CALC_STEPS) {
    const value = evaluateFormula(step.formula, vars);
    vars[step.id] = value; // 次のステップで参照可能
    if (step.display) {
      results.push({ ...step, value });
    }
  }

  return results;
}

// ===== 結果表示 =====
function showResult() {
  const results = calculateResults();
  const resultCard = $('result-card');

  resultCard.innerHTML = results.map((r) => `
    <div class="result-item ${r.isMain ? 'result-main' : ''}">
      <span class="result-label">${r.label}</span>
      <span class="result-value">${r.isMain ? '約 ' : ''}${r.value.toLocaleString()} ${r.unit}</span>
    </div>
  `).join('');

  if (COURSE.calculation?.note) {
    resultCard.innerHTML += `<p class="result-note">${COURSE.calculation.note}</p>`;
  }

  $('result-area').classList.add('visible');
  setTimeout(() => {
    $('result-area').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, 200);

  saveState();
}

// ===== LINE送信 =====
async function sendLineResult() {
  const results = calculateResults();
  const lines = [`=== ${COURSE.name || '診断'}結果 ===`, ''];

  FIELDS.forEach((f) => {
    if (AppState.inputs[f.id] != null) {
      lines.push(`${f.label}: ${AppState.inputs[f.id]}${f.unit}`);
    }
  });

  lines.push('');
  results.forEach((r) => {
    lines.push(`▶ ${r.label}: ${r.isMain ? '約' : ''}${r.value.toLocaleString()}${r.unit}`);
  });

  if (COURSE.calculation?.note) {
    lines.push('', COURSE.calculation.note);
  }
  lines.push('========================');

  const messageText = lines.join('\n');

  if (typeof liff !== 'undefined' && liff.isInClient()) {
    try {
      await liff.sendMessages([{ type: 'text', text: messageText }]);
      alert('診断結果をLINEトークに送信しました！');
    } catch (e) {
      console.error('LIFF sendMessages error:', e);
      alert('送信に失敗しました。もう一度お試しください。');
    }
  } else {
    alert('LINEアプリ内で開くと、トークに結果を送信できます。\n\n' + messageText);
  }
}

// ===== LocalStorage =====
function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    currentStep: AppState.currentStep,
    inputs: AppState.inputs,
    videoTime: videoController?.currentTime || 0,
    isStarted: AppState.isStarted,
  }));
}

function loadState() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) return false;
  try {
    const data = JSON.parse(saved);
    AppState.currentStep = data.currentStep || 0;
    AppState.inputs = data.inputs || {};
    AppState.isStarted = data.isStarted || false;

    Object.entries(AppState.inputs).forEach(([key, val]) => {
      const el = $(key);
      if (el && val !== null) el.value = val;
    });
    return true;
  } catch {
    return false;
  }
}

function updateStepVisibility() {
  TIMELINE.forEach((entry) => {
    const stepEl = $(`step-${entry.step}`);
    if (!stepEl) return;
    if (entry.step < AppState.currentStep) {
      stepEl.classList.remove('locked', 'spotlight');
      stepEl.classList.add('completed');
    } else if (entry.step === AppState.currentStep) {
      stepEl.classList.remove('locked');
    } else {
      stepEl.classList.add('locked');
    }
  });
}

function allInputsFilled() {
  return FIELDS.every((f) => AppState.inputs[f.id] != null && AppState.inputs[f.id] > 0);
}

// ===== メイン初期化 =====
function initApp() {
  bindEvents();

  const hasState = loadState();

  if (hasState && AppState.isStarted) {
    $('start-screen').classList.add('hidden');
    updateStepVisibility();
    videoController.seekTo(
      AppState.currentStep > 0 ? TIMELINE[AppState.currentStep - 1].pauseAt : 0
    );
    if (AppState.currentStep >= TIMELINE.length && allInputsFilled()) {
      showResult();
    }
  } else {
    $('start-screen').classList.remove('hidden');
    TIMELINE.forEach((entry) => {
      const el = $(`step-${entry.step}`);
      if (el) el.classList.add('locked');
    });
  }

  videoController.render();
}

// ===== 起動 =====
(async () => {
  console.log('=== 起動開始 ===');
  try {
    const course = await loadCourse();
    console.log('=== course loaded ===', course);
    console.log('=== course.video ===', course?.video);
    if (!course) return;

    buildUI(course);

  $('loading-screen').classList.add('hidden');

    // LIFF初期化
    if (LIFF_ID && typeof liff !== 'undefined') {
      try {
        await liff.init({ liffId: LIFF_ID });
        console.log('LIFF initialized');
      } catch (err) {
        console.error('LIFF init error:', err);
      }
    }

    initApp();
  } catch (err) {
    console.error('=== 起動エラー ===', err);
  }
})();
