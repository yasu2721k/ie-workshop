import { db } from '../firebase-config.js';
import { collection, getDocs, deleteDoc, doc, orderBy, query } from 'https://www.gstatic.com/firebasejs/10.14.0/firebase-firestore.js';

const courseList = document.getElementById('course-list');

// 認証完了後に講座一覧を読み込み
window.addEventListener('auth-ready', () => {
  loadCourses();
});

async function loadCourses() {
  courseList.innerHTML = '<p class="loading">読み込み中...</p>';

  try {
    const q = query(collection(db, 'courses'), orderBy('updatedAt', 'desc'));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      courseList.innerHTML = `
        <div class="empty-state">
          <p>講座がまだありません</p>
          <a href="course-edit.html" class="btn btn-primary">最初の講座を作成</a>
        </div>
      `;
      return;
    }

    courseList.innerHTML = '';
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const card = createCourseCard(docSnap.id, data);
      courseList.appendChild(card);
    });
  } catch (err) {
    console.error('Failed to load courses:', err);
    courseList.innerHTML = '<p class="loading">読み込みに失敗しました</p>';
  }
}

function createCourseCard(id, data) {
  const card = document.createElement('div');
  card.className = 'course-card';

  const statusClass = data.status === 'published' ? 'status-published' : 'status-draft';
  const statusLabel = data.status === 'published' ? '公開中' : '下書き';

  const updatedAt = data.updatedAt?.toDate?.();
  const dateStr = updatedAt
    ? updatedAt.toLocaleDateString('ja-JP', { year: 'numeric', month: '2-digit', day: '2-digit' })
    : '-';

  const fieldCount = data.fields?.length || 0;

  card.innerHTML = `
    <div class="course-info">
      <div class="course-name">${escapeHtml(data.name || '無題の講座')}</div>
      <div class="course-meta">
        <span class="status-badge ${statusClass}">${statusLabel}</span>
        <span>フィールド: ${fieldCount}件</span>
        <span>更新: ${dateStr}</span>
        <span>slug: ${escapeHtml(data.slug || '-')}</span>
      </div>
    </div>
    <div class="course-actions">
      <a href="course-edit.html?id=${id}" class="btn btn-secondary btn-sm">編集</a>
      <button class="btn btn-danger btn-sm" data-delete="${id}" data-name="${escapeHtml(data.name || '')}">削除</button>
    </div>
  `;

  card.querySelector('[data-delete]').addEventListener('click', async (e) => {
    const name = e.target.dataset.name;
    if (!confirm(`「${name}」を削除しますか？この操作は取り消せません。`)) return;

    try {
      await deleteDoc(doc(db, 'courses', id));
      card.remove();
      // 全部消えたらempty state
      if (courseList.children.length === 0) {
        courseList.innerHTML = `
          <div class="empty-state">
            <p>講座がまだありません</p>
            <a href="course-edit.html" class="btn btn-primary">最初の講座を作成</a>
          </div>
        `;
      }
    } catch (err) {
      console.error('Delete failed:', err);
      alert('削除に失敗しました');
    }
  });

  return card;
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
