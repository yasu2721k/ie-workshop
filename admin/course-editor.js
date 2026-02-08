import { db, storage } from '../firebase-config.js';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'https://www.gstatic.com/firebasejs/10.14.0/firebase-firestore.js';
import { ref, uploadBytesResumable, getDownloadURL } from 'https://www.gstatic.com/firebasejs/10.14.0/firebase-storage.js';

// ===== 状態 =====
let courseId = new URLSearchParams(location.search).get('id');
let isNew = !courseId;
let fieldCounter = 0;
let timelineCounter = 0;
let calcCounter = 0;

// ===== DOM =====
const $ = (id) => document.getElementById(id);
const pageTitle = $('page-title');
const fieldsContainer = $('fields-container');
const timelineContainer = $('timeline-container');
const calcContainer = $('calc-container');

// ===== 初期化 =====
window.addEventListener('auth-ready', async () => {
  if (!isNew) {
    pageTitle.textContent = '講座を編集';
    await loadCourse(courseId);
  }
});

async function loadCourse(id) {
  try {
    const snap = await getDoc(doc(db, 'courses', id));
    if (!snap.exists()) {
      alert('講座が見つかりません');
      location.href = 'index.html';
      return;
    }
    const data = snap.data();
    populateForm(data);
  } catch (err) {
    console.error('Load error:', err);
    alert('読み込みに失敗しました');
  }
}

function populateForm(data) {
  $('course-name').value = data.name || '';
  $('course-slug').value = data.slug || '';
  $('slug-preview').textContent = data.slug || '---';

  // プレビュー/公開リンクを表示
  updateViewLinks(data.slug, data.status);
  $('course-description').value = data.description || '';
  $('course-liff-id').value = data.liffId || '';
  $('course-color').value = data.ui?.primaryColor || '#764ba2';

  $('ui-start-title').value = data.ui?.startScreenTitle || '';
  $('ui-start-desc').value = data.ui?.startScreenDescription || '';
  $('ui-worksheet-title').value = data.ui?.title || '';
  $('ui-result-title').value = data.ui?.resultTitle || '';

  // 動画
  if (data.video?.downloadUrl) {
    $('video-url').value = data.video.downloadUrl;
    showVideoPreview(data.video.downloadUrl);
  }

  // フィールド
  fieldsContainer.innerHTML = '';
  (data.fields || []).forEach((f) => addFieldCard(f));

  // タイムライン
  timelineContainer.innerHTML = '';
  (data.timeline || []).forEach((t) => addTimelineCard(t));

  // 計算
  calcContainer.innerHTML = '';
  (data.calculation?.steps || []).forEach((c) => addCalcCard(c));
  $('calc-note').value = data.calculation?.note || '';
}

// ===== フィールドビルダー =====
function addFieldCard(data = {}) {
  fieldCounter++;
  const id = data.id || `field_${fieldCounter}`;
  const card = document.createElement('div');
  card.className = 'field-card';
  card.dataset.fieldId = id;

  card.innerHTML = `
    <div class="card-header">
      <span class="card-title">フィールド: <strong>${id}</strong></span>
      <div class="card-actions">
        <button class="btn-move-up" title="上へ">↑</button>
        <button class="btn-move-down" title="下へ">↓</button>
        <button class="btn-remove" title="削除">✕</button>
      </div>
    </div>
    <div class="field-row">
      <div class="form-group">
        <label>ID</label>
        <input type="text" class="f-id" value="${escapeAttr(id)}" placeholder="income">
      </div>
      <div class="form-group">
        <label>ラベル</label>
        <input type="text" class="f-label" value="${escapeAttr(data.label || '')}" placeholder="年収（税込）">
      </div>
    </div>
    <div class="field-row">
      <div class="form-group">
        <label>ステップラベル</label>
        <input type="text" class="f-step-label" value="${escapeAttr(data.stepLabel || '')}" placeholder="① 年収（税込）">
      </div>
      <div class="form-group">
        <label>タイプ</label>
        <select class="f-type">
          <option value="number" ${data.type === 'number' ? 'selected' : ''}>数値</option>
          <option value="text" ${data.type === 'text' ? 'selected' : ''}>テキスト</option>
        </select>
      </div>
    </div>
    <div class="field-row">
      <div class="form-group">
        <label>単位</label>
        <input type="text" class="f-unit" value="${escapeAttr(data.unit || '')}" placeholder="万円">
      </div>
      <div class="form-group">
        <label>プレースホルダー</label>
        <input type="text" class="f-placeholder" value="${escapeAttr(data.placeholder || '')}" placeholder="例: 500">
      </div>
    </div>
  `;

  // イベント
  card.querySelector('.btn-remove').addEventListener('click', () => card.remove());
  card.querySelector('.btn-move-up').addEventListener('click', () => {
    const prev = card.previousElementSibling;
    if (prev) fieldsContainer.insertBefore(card, prev);
  });
  card.querySelector('.btn-move-down').addEventListener('click', () => {
    const next = card.nextElementSibling;
    if (next) fieldsContainer.insertBefore(next, card);
  });

  // ID変更時にヘッダーも更新
  card.querySelector('.f-id').addEventListener('input', (e) => {
    card.dataset.fieldId = e.target.value;
    card.querySelector('.card-title strong').textContent = e.target.value;
  });

  fieldsContainer.appendChild(card);
}

$('add-field-btn').addEventListener('click', () => addFieldCard());

// ===== タイムラインビルダー =====
function addTimelineCard(data = {}) {
  timelineCounter++;
  const card = document.createElement('div');
  card.className = 'timeline-card';

  card.innerHTML = `
    <div class="card-header">
      <span class="card-title">一時停止 #${timelineCounter}</span>
      <div class="card-actions">
        <button class="btn-remove" title="削除">✕</button>
      </div>
    </div>
    <div class="field-row">
      <div class="form-group">
        <label>停止秒数</label>
        <input type="number" class="t-pause-at" value="${data.pauseAt || ''}" placeholder="3" min="0" step="0.5">
      </div>
      <div class="form-group">
        <label>対象フィールドID</label>
        <input type="text" class="t-field-id" value="${escapeAttr(data.fieldId || '')}" placeholder="income">
      </div>
    </div>
    <div class="form-group">
      <label>案内テキスト</label>
      <input type="text" class="t-prompt" value="${escapeAttr(data.prompt || '')}" placeholder="年収を入力してください">
    </div>
  `;

  card.querySelector('.btn-remove').addEventListener('click', () => card.remove());
  timelineContainer.appendChild(card);
}

$('add-timeline-btn').addEventListener('click', () => addTimelineCard());

// ===== 計算ステップビルダー =====
function addCalcCard(data = {}) {
  calcCounter++;
  const card = document.createElement('div');
  card.className = 'calc-card';

  card.innerHTML = `
    <div class="card-header">
      <span class="card-title">計算 #${calcCounter}</span>
      <div class="card-actions">
        <button class="btn-remove" title="削除">✕</button>
      </div>
    </div>
    <div class="field-row">
      <div class="form-group">
        <label>結果ID</label>
        <input type="text" class="c-id" value="${escapeAttr(data.id || `calc_${calcCounter}`)}" placeholder="safeMonthlyPayment">
      </div>
      <div class="form-group">
        <label>表示ラベル</label>
        <input type="text" class="c-label" value="${escapeAttr(data.label || '')}" placeholder="安全月支払い額">
      </div>
    </div>
    <div class="form-group">
      <label>計算式</label>
      <input type="text" class="c-formula" value="${escapeAttr(data.formula || '')}" placeholder="(rent + savings) - reserve">
    </div>
    <div class="field-row">
      <div class="form-group">
        <label>単位</label>
        <input type="text" class="c-unit" value="${escapeAttr(data.unit || '')}" placeholder="万円">
      </div>
      <div class="form-group" style="display:flex; align-items:center; gap:16px; padding-top:20px;">
        <label><input type="checkbox" class="c-display" ${data.display !== false ? 'checked' : ''}> 結果に表示</label>
        <label><input type="checkbox" class="c-main" ${data.isMain ? 'checked' : ''}> メイン結果</label>
      </div>
    </div>
  `;

  card.querySelector('.btn-remove').addEventListener('click', () => card.remove());
  calcContainer.appendChild(card);
}

$('add-calc-btn').addEventListener('click', () => addCalcCard());

// ===== 動画アップロード =====
$('video-file').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  // IDが未確定なら先に仮IDを生成
  if (!courseId) {
    courseId = crypto.randomUUID();
    isNew = true;
  }

  const storageRef = ref(storage, `videos/${courseId}/${file.name}`);
  const uploadTask = uploadBytesResumable(storageRef, file);

  const progressArea = $('upload-progress');
  const bar = $('upload-bar');
  const percent = $('upload-percent');
  progressArea.classList.remove('hidden');

  uploadTask.on('state_changed',
    (snapshot) => {
      const pct = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
      bar.style.width = pct + '%';
      percent.textContent = pct + '%';
    },
    (err) => {
      console.error('Upload error:', err);
      alert('アップロードに失敗しました');
      progressArea.classList.add('hidden');
    },
    async () => {
      const url = await getDownloadURL(uploadTask.snapshot.ref);
      $('video-url').value = url;
      showVideoPreview(url);
      progressArea.classList.add('hidden');
    }
  );
});

// URLを貼り付け or 入力後にEnterでプレビュー
$('video-url').addEventListener('input', debounce(() => {
  const url = $('video-url').value.trim();
  if (url) showVideoPreview(url);
}, 500));

$('video-url').addEventListener('paste', () => {
  setTimeout(() => {
    const url = $('video-url').value.trim();
    if (url) showVideoPreview(url);
  }, 100);
});

function showVideoPreview(url) {
  const area = $('video-preview-area');
  const video = $('video-preview');

  // YouTube URLの場合は埋め込みURLに変換
  const youtubeMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/);
  if (youtubeMatch) {
    // YouTubeはvideoタグで直接再生できないので、メッセージ表示
    area.classList.remove('hidden');
    video.style.display = 'none';
    area.innerHTML = `
      <div style="background:#000;color:#fff;padding:20px;border-radius:8px;text-align:center;">
        <p>YouTube動画: ${youtubeMatch[1]}</p>
        <p style="font-size:0.8rem;color:#aaa;">YouTubeは直接プレビューできませんが、保存後にユーザー画面で再生できます</p>
      </div>
      <p>動画の長さ: <input type="number" id="video-duration-manual" placeholder="秒数を入力" style="width:80px;"> 秒</p>
    `;
    $('video-duration-manual')?.addEventListener('input', (e) => {
      $('video-duration').textContent = e.target.value;
    });
    return;
  }

  // 通常の動画URL
  area.classList.remove('hidden');
  area.innerHTML = `
    <video id="video-preview" controls playsinline></video>
    <p>動画の長さ: <span id="video-duration">-</span>秒</p>
  `;
  const newVideo = $('video-preview');
  newVideo.src = url;
  newVideo.addEventListener('loadedmetadata', () => {
    $('video-duration').textContent = Math.round(newVideo.duration);
  }, { once: true });
  newVideo.addEventListener('error', () => {
    area.innerHTML = `
      <div style="background:#fee;color:#c00;padding:12px;border-radius:8px;">
        動画を読み込めませんでした。URLを確認してください。
      </div>
      <p>動画の長さ: <input type="number" id="video-duration-manual" placeholder="秒数を手動入力" style="width:100px;"> 秒</p>
    `;
  });
}

function debounce(fn, ms) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}

// ===== Slug自動生成 =====
$('course-name').addEventListener('input', () => {
  if (isNew || !$('course-slug').value) {
    const slug = $('course-name').value
      .toLowerCase()
      .replace(/[^a-z0-9\u3040-\u309f\u30a0-\u30ff\u4e00-\u9faf]+/g, '-')
      .replace(/^-|-$/g, '');
    $('course-slug').value = slug;
    $('slug-preview').textContent = slug || '---';
  }
});

$('course-slug').addEventListener('input', () => {
  $('slug-preview').textContent = $('course-slug').value || '---';
});

// ===== データ収集 =====
function collectFormData(status) {
  // フィールド
  const fields = [];
  fieldsContainer.querySelectorAll('.field-card').forEach((card, idx) => {
    fields.push({
      id: card.querySelector('.f-id').value.trim(),
      label: card.querySelector('.f-label').value.trim(),
      stepLabel: card.querySelector('.f-step-label').value.trim(),
      type: card.querySelector('.f-type').value,
      unit: card.querySelector('.f-unit').value.trim(),
      placeholder: card.querySelector('.f-placeholder').value.trim(),
      order: idx + 1,
    });
  });

  // タイムライン
  const timeline = [];
  timelineContainer.querySelectorAll('.timeline-card').forEach((card) => {
    timeline.push({
      pauseAt: parseFloat(card.querySelector('.t-pause-at').value) || 0,
      fieldId: card.querySelector('.t-field-id').value.trim(),
      prompt: card.querySelector('.t-prompt').value.trim(),
    });
  });
  timeline.sort((a, b) => a.pauseAt - b.pauseAt);

  // 計算
  const calcSteps = [];
  calcContainer.querySelectorAll('.calc-card').forEach((card) => {
    calcSteps.push({
      id: card.querySelector('.c-id').value.trim(),
      label: card.querySelector('.c-label').value.trim(),
      formula: card.querySelector('.c-formula').value.trim(),
      unit: card.querySelector('.c-unit').value.trim(),
      display: card.querySelector('.c-display').checked,
      isMain: card.querySelector('.c-main').checked,
    });
  });

  const videoUrl = $('video-url').value.trim();

  return {
    name: $('course-name').value.trim(),
    slug: $('course-slug').value.trim(),
    description: $('course-description').value.trim(),
    liffId: $('course-liff-id').value.trim(),
    status,
    ui: {
      startScreenTitle: $('ui-start-title').value.trim(),
      startScreenDescription: $('ui-start-desc').value.trim(),
      title: $('ui-worksheet-title').value.trim(),
      resultTitle: $('ui-result-title').value.trim(),
      primaryColor: $('course-color').value,
    },
    video: videoUrl ? { downloadUrl: videoUrl, duration: parseInt($('video-duration')?.textContent) || 0 } : null,
    fields,
    timeline,
    calculation: {
      steps: calcSteps,
      note: $('calc-note').value.trim(),
    },
    updatedAt: serverTimestamp(),
  };
}

// ===== 保存 =====
async function saveCourse(status) {
  const data = collectFormData(status);

  if (!data.name) {
    alert('講座名を入力してください');
    return;
  }

  try {
    if (isNew) {
      if (!courseId) courseId = crypto.randomUUID();
      data.createdAt = serverTimestamp();
      await setDoc(doc(db, 'courses', courseId), data);
      isNew = false;
      // URLにIDを付与
      history.replaceState(null, '', `course-edit.html?id=${courseId}`);
    } else {
      await updateDoc(doc(db, 'courses', courseId), data);
    }

    const msg = status === 'published' ? '公開しました' : '下書きを保存しました';
    alert(msg);

    // リンクを更新
    updateViewLinks(data.slug, status);
  } catch (err) {
    console.error('Save error:', err);
    alert('保存に失敗しました: ' + err.message);
  }
}

// 保存ボタン
$('save-draft-btn').addEventListener('click', () => saveCourse('draft'));
$('publish-btn').addEventListener('click', () => saveCourse('published'));
$('save-draft-btn-bottom').addEventListener('click', () => saveCourse('draft'));
$('publish-btn-bottom').addEventListener('click', () => saveCourse('published'));

// ===== ユーティリティ =====
function escapeAttr(str) {
  return String(str).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}

// ===== プレビュー/公開リンク =====
function updateViewLinks(slug, status) {
  const previewLink = $('preview-link');
  const publicLink = $('public-link');
  const baseUrl = location.origin + location.pathname.replace('/admin/course-edit.html', '');

  if (slug) {
    // プレビューリンク（下書きでも見れる）
    previewLink.href = `${baseUrl}/?course=${slug}&preview=1`;
    previewLink.classList.remove('hidden');

    // 公開リンク（publishedのみ）
    if (status === 'published') {
      publicLink.href = `${baseUrl}/?course=${slug}`;
      publicLink.classList.remove('hidden');
    } else {
      publicLink.classList.add('hidden');
    }
  }
}
