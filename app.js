// ===== 定数 =====
const LIFF_ID = '2009051834-pEtorbrL';
const STORAGE_KEY = 'urihome-budget-sim';
const TOTAL_DURATION = 20; // テスト動画: 20秒

const TIMELINE = [
  { pauseAt: 3,  step: 1, field: 'income',  label: '年収（税込）を入力してください' },
  { pauseAt: 8,  step: 2, field: 'rent',    label: '現在の家賃を入力してください' },
  { pauseAt: 13, step: 3, field: 'savings', label: '月々の貯金額を入力してください' },
  { pauseAt: 18, step: 4, field: 'reserve', label: '予備費を入力してください' },
];

// ===== アプリ状態 =====
const AppState = {
  currentStep: 0,
  inputs: { income: null, rent: null, savings: null, reserve: null },
  videoTime: 0,
  isSpotlightActive: false,
  isStarted: false,
};

// ===== DOM要素 =====
const $ = (id) => document.getElementById(id);
const startScreen = $('start-screen');
const startBtn = $('start-btn');
const canvas = $('video-canvas');
const progressBar = $('video-progress-bar');
const overlay = $('spotlight-overlay');
const nextBtn = $('next-btn');
const resultArea = $('result-area');
const sendLineBtn = $('send-line-btn');
const resetBtn = $('reset-btn');

// ===== MockVideoController =====
class MockVideoController {
  constructor(canvasEl) {
    this.canvas = canvasEl;
    this.ctx = canvasEl.getContext('2d');
    this.duration = TOTAL_DURATION;
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

    // 背景
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, w, h);

    // 現在のセグメントテキスト
    let displayText = '住宅予算診断スタート！';
    let subText = '';
    const currentSec = this.currentTime;

    for (let i = TIMELINE.length - 1; i >= 0; i--) {
      if (currentSec >= TIMELINE[i].pauseAt) {
        if (i < TIMELINE.length - 1) {
          displayText = TIMELINE[i].label;
          subText = `ステップ ${TIMELINE[i].step} / ${TIMELINE.length}`;
        } else {
          displayText = TIMELINE[i].label;
          subText = `ステップ ${TIMELINE[i].step} / ${TIMELINE.length}`;
        }
        break;
      }
    }

    if (currentSec >= this.duration - 1) {
      displayText = '診断完了！';
      subText = 'あなたの住宅予算が算出されました';
    }

    // メインテキスト
    ctx.fillStyle = '#ffffff';
    ctx.font = `bold ${20 * dpr}px "Yomogi", cursive, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(displayText, w / 2, h / 2 - 10 * dpr);

    // サブテキスト
    if (subText) {
      ctx.fillStyle = 'rgba(255,255,255,0.6)';
      ctx.font = `${13 * dpr}px "Yomogi", cursive, sans-serif`;
      ctx.fillText(subText, w / 2, h / 2 + 18 * dpr);
    }

    // 時間表示
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.font = `${11 * dpr}px sans-serif`;
    ctx.textAlign = 'right';
    const elapsed = Math.floor(this.currentTime);
    const total = this.duration;
    ctx.fillText(`${elapsed}s / ${total}s`, w - 12 * dpr, h - 10 * dpr);

    // プログレスバー更新
    const pct = (this.currentTime / this.duration) * 100;
    progressBar.style.width = pct + '%';
  }
}

// ===== 動画コントローラ初期化 =====
const videoController = new MockVideoController(canvas);

// ===== 動画タイムアップデート =====
videoController.onTimeUpdate = function (currentTime) {
  AppState.videoTime = currentTime;

  const nextPause = TIMELINE.find(
    (t) => t.step > AppState.currentStep && currentTime >= t.pauseAt
  );
  if (nextPause) {
    activateStep(nextPause);
  }
};

videoController.onEnded = function () {
  if (AppState.currentStep >= TIMELINE.length) {
    showResult();
  }
};

// ===== スポットライト =====
function activateStep(entry) {
  videoController.pause();
  AppState.currentStep = entry.step;
  AppState.isSpotlightActive = true;

  // オーバーレイ表示
  overlay.classList.add('active');

  // 全ステップのスポットライトを解除
  document.querySelectorAll('.form-step.spotlight').forEach((el) =>
    el.classList.remove('spotlight')
  );

  // 対象ステップをハイライト
  const stepEl = $(`step-${entry.step}`);
  stepEl.classList.remove('locked');
  stepEl.classList.add('spotlight');

  // 次へボタンを対象ステップの直後に配置
  stepEl.after(nextBtn);
  nextBtn.style.display = 'none';
  nextBtn.classList.remove('visible');

  // スクロール＆フォーカス
  setTimeout(() => {
    stepEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    const input = stepEl.querySelector('input');
    if (input) {
      input.focus();
      // 既に値があれば次へボタン表示
      if (input.value && parseFloat(input.value) > 0) {
        showNextBtn();
      }
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

// ===== 入力監視 =====
TIMELINE.forEach((entry) => {
  const input = $(entry.field);
  input.addEventListener('input', () => {
    const val = parseFloat(input.value);
    if (val > 0) {
      showNextBtn();
    } else {
      hideNextBtn();
    }
    // 即時保存
    AppState.inputs[entry.field] = val > 0 ? val : null;
    saveState();
  });
});

// ===== 次へボタン =====
nextBtn.addEventListener('click', () => {
  const entry = TIMELINE[AppState.currentStep - 1];
  if (!entry) return;

  const input = $(entry.field);
  AppState.inputs[entry.field] = parseFloat(input.value);

  // スポットライト解除
  overlay.classList.remove('active');
  document.querySelectorAll('.form-step.spotlight').forEach((el) => {
    el.classList.remove('spotlight');
    el.classList.add('completed');
  });
  hideNextBtn();
  AppState.isSpotlightActive = false;

  saveState();

  // 動画再開
  videoController.play();
});

// ===== 予算計算 =====
function calculateBudget() {
  const { rent, savings, reserve } = AppState.inputs;

  // 安全月支払い額 = (家賃 + 貯金) - 予備費
  const safeMonthlyPayment = (rent + savings) - reserve;

  // 総予算を逆算（35年ローン・金利1.5%）
  const interestRate = 0.015;
  const loanYears = 35;
  const monthlyRate = interestRate / 12;
  const numPayments = loanYears * 12;
  const factor =
    (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) /
    (Math.pow(1 + monthlyRate, numPayments) - 1);

  // safeMonthlyPayment は万円単位 → 円に変換して計算
  const totalBudgetYen = (safeMonthlyPayment * 10000) / factor;
  const totalBudgetMan = Math.round(totalBudgetYen / 10000);

  return {
    safeMonthlyPayment,
    totalBudget: totalBudgetMan,
  };
}

// ===== 結果表示 =====
function showResult() {
  const budget = calculateBudget();

  $('result-monthly').textContent = `${budget.safeMonthlyPayment} 万円 / 月`;
  $('result-budget').textContent = `約 ${budget.totalBudget.toLocaleString()} 万円`;

  resultArea.classList.add('visible');

  setTimeout(() => {
    resultArea.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, 200);

  saveState();
}

// ===== LINE送信 =====
sendLineBtn.addEventListener('click', async () => {
  const budget = calculateBudget();
  const messageText = [
    '=== 住宅予算診断結果 ===',
    '',
    `年収: ${AppState.inputs.income}万円`,
    `現在の家賃: ${AppState.inputs.rent}万円/月`,
    `貯金額: ${AppState.inputs.savings}万円/月`,
    `予備費: ${AppState.inputs.reserve}万円/月`,
    '',
    `▶ 安全月支払い額: ${budget.safeMonthlyPayment}万円`,
    `▶ 推定住宅予算: 約${budget.totalBudget.toLocaleString()}万円`,
    '',
    '※ 35年ローン・金利1.5%で試算',
    '========================',
  ].join('\n');

  if (liff.isInClient()) {
    try {
      await liff.sendMessages([{ type: 'text', text: messageText }]);
      alert('診断結果をLINEトークに送信しました！');
    } catch (e) {
      console.error('LIFF sendMessages error:', e);
      alert('送信に失敗しました。もう一度お試しください。');
    }
  } else {
    // LINEアプリ外（ブラウザ）で開いた場合
    alert('LINEアプリ内で開くと、トークに結果を送信できます。\n\n' + messageText);
  }
});

// ===== リセット =====
resetBtn.addEventListener('click', () => {
  if (!confirm('入力内容をすべてリセットしますか？')) return;
  localStorage.removeItem(STORAGE_KEY);
  location.reload();
});

// ===== LocalStorage =====
function saveState() {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      currentStep: AppState.currentStep,
      inputs: AppState.inputs,
      videoTime: videoController.currentTime,
      isStarted: AppState.isStarted,
    })
  );
}

function loadState() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) return false;

  try {
    const data = JSON.parse(saved);
    AppState.currentStep = data.currentStep || 0;
    AppState.inputs = data.inputs || { income: null, rent: null, savings: null, reserve: null };
    AppState.isStarted = data.isStarted || false;

    // 入力値を復元
    Object.entries(AppState.inputs).forEach(([key, val]) => {
      if (val !== null) {
        $(key).value = val;
      }
    });

    return true;
  } catch {
    return false;
  }
}

// ===== ステップの表示状態を更新 =====
function updateStepVisibility() {
  TIMELINE.forEach((entry) => {
    const stepEl = $(`step-${entry.step}`);
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

// ===== 初期化 =====
function init() {
  const hasState = loadState();

  if (hasState && AppState.isStarted) {
    // 中断箇所から再開
    startScreen.classList.add('hidden');
    updateStepVisibility();
    videoController.seekTo(
      AppState.currentStep > 0
        ? TIMELINE[AppState.currentStep - 1].pauseAt
        : 0
    );

    // 全ステップ完了済みなら結果表示
    if (AppState.currentStep >= TIMELINE.length && allInputsFilled()) {
      showResult();
    }
  } else {
    // 初期状態: 全ステップをロック
    TIMELINE.forEach((entry) => {
      $(`step-${entry.step}`).classList.add('locked');
    });
  }

  // 初期描画
  videoController.render();
}

function allInputsFilled() {
  return Object.values(AppState.inputs).every((v) => v !== null && v > 0);
}

// ===== スタートボタン =====
startBtn.addEventListener('click', () => {
  AppState.isStarted = true;
  startScreen.classList.add('hidden');
  saveState();
  videoController.play();
});

// ===== モバイルキーボード対応 =====
document.querySelectorAll('.form-step input').forEach((input) => {
  input.addEventListener('focus', () => {
    setTimeout(() => {
      input.closest('.form-step').scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }, 300);
  });
});

// ===== LIFF初期化 & 起動 =====
liff
  .init({ liffId: LIFF_ID })
  .then(() => {
    console.log('LIFF initialized');
    init();
  })
  .catch((err) => {
    console.error('LIFF init error:', err);
    // LIFF初期化に失敗しても診断自体は動かす
    init();
  });
