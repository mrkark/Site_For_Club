document.addEventListener('DOMContentLoaded', () => {

  let currentArticleId = null;

  // Mobile nav toggle
  const navToggle = document.getElementById('navToggle');
  const navMenu = document.getElementById('navMenu');
  navToggle.addEventListener('click', () => navMenu.classList.toggle('active'));
  document.querySelectorAll('.nav-link').forEach(l => {
    l.addEventListener('click', () => navMenu.classList.remove('active'));
  });

  // Shrink navbar on scroll
  const navbar = document.getElementById('navbar');
  window.addEventListener('scroll', () => {
    navbar.style.background = window.scrollY > 50
      ? 'rgba(15, 15, 26, 0.98)'
      : 'rgba(15, 15, 26, 0.95)';
  });

  // Hidden admin button
  document.getElementById('adminHiddenBtn').addEventListener('click', () => {
    document.getElementById('loginModal').classList.add('show');
  });

  // Login modal
  const loginModal = document.getElementById('loginModal');
  document.getElementById('loginModalClose').addEventListener('click', () => loginModal.classList.remove('show'));
  loginModal.addEventListener('click', (e) => { if (e.target === loginModal) loginModal.classList.remove('show'); });

  document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const login = document.getElementById('loginInput').value;
    const password = document.getElementById('passwordInput').value;
    const error = document.getElementById('loginError');
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ login, password })
      });
      const data = await res.json();
      if (data.success) {
        loginModal.classList.remove('show');
        window.location.href = '/admin.html';
      } else {
        error.textContent = data.error || 'Ошибка входа';
      }
    } catch (err) {
      error.textContent = 'Ошибка соединения';
    }
  });

  // Article modal
  const articleModal = document.getElementById('articleModal');
  document.querySelector('#articleModal .modal-close').addEventListener('click', () => articleModal.classList.remove('show'));
  articleModal.addEventListener('click', (e) => { if (e.target === articleModal) articleModal.classList.remove('show'); });

  document.getElementById('submitComment').addEventListener('click', async () => {
    const author = document.getElementById('commentAuthor').value.trim();
    const text = document.getElementById('commentText').value.trim();
    if (!author || !text) return;
    try {
      const res = await fetch(`/api/articles/${currentArticleId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ author, text })
      });
      if (res.ok) {
        document.getElementById('commentAuthor').value = '';
        document.getElementById('commentText').value = '';
        loadArticleModal(currentArticleId);
      }
    } catch (err) {}
  });

  // Load sections
  loadSchedule();
  loadInstructors();
  loadArticles();
  loadNews();
  loadVideos();
});

async function fetchAPI(url) {
  const res = await fetch(url);
  return res.json();
}

// ===== SCHEDULE =====
async function loadSchedule() {
  try {
    const data = await fetchAPI('/api/schedule');
    const grid = document.getElementById('scheduleGrid');
    if (data.length === 0) {
      grid.innerHTML = '<div class="schedule-loading">Расписание скоро появится</div>';
      return;
    }
    const days = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота', 'Воскресенье'];
    const grouped = {};
    data.forEach(item => {
      if (!grouped[item.dayOfWeek]) grouped[item.dayOfWeek] = [];
      grouped[item.dayOfWeek].push(item);
    });
    grid.innerHTML = Object.entries(grouped).map(([day, items]) => `
      <div class="schedule-card">
        <div class="schedule-day">${day}</div>
        ${items.map(i => `
          <div style="margin-top:8px;padding-top:8px;border-top:1px solid #eee">
            <div class="schedule-time"><i class="far fa-clock"></i> ${i.time}</div>
            ${i.group_name ? `<div class="schedule-group"><i class="fas fa-users"></i> ${i.group_name}</div>` : ''}
            ${i.description ? `<div style="font-size:0.85rem;color:#888;margin-top:4px">${i.description}</div>` : ''}
          </div>
        `).join('')}
      </div>
    `).join('');
  } catch (err) {
    document.getElementById('scheduleGrid').innerHTML = '<div class="schedule-loading">Ошибка загрузки</div>';
  }
}

// ===== INSTRUCTORS =====
async function loadInstructors() {
  try {
    const data = await fetchAPI('/api/instructors');
    const grid = document.getElementById('instructorsGrid');
    if (data.length === 0) {
      grid.innerHTML = '<div class="schedule-loading">Информация об инструкторах скоро появится</div>';
      return;
    }
    grid.innerHTML = data.map(i => `
      <div class="instructor-card">
        ${i.photo
          ? `<img src="${i.photo}" alt="${i.name}" class="instructor-img">`
          : `<div class="instructor-img-placeholder"><i class="fas fa-user-ninja"></i></div>`
        }
        <h3 class="instructor-name">${i.name}</h3>
        ${i.title ? `<p class="instructor-title">${i.title}</p>` : ''}
        ${i.description ? `<p class="instructor-desc">${i.description}</p>` : ''}
      </div>
    `).join('');
  } catch (err) {
    document.getElementById('instructorsGrid').innerHTML = '<div class="schedule-loading">Ошибка загрузки</div>';
  }
}

// ===== ARTICLES =====
async function loadArticles() {
  try {
    const data = await fetchAPI('/api/articles');
    const container = document.getElementById('articlesContainer');
    if (data.length === 0) {
      container.innerHTML = '<div class="schedule-loading">Статьи скоро появятся</div>';
      return;
    }
    container.innerHTML = data.map(a => `
      <div class="article-card" data-id="${a.id}">
        <div class="article-card-body">
          <div class="article-card-title">${a.title}</div>
          <div class="article-card-date"><i class="far fa-calendar"></i> ${formatDate(a.createdAt)}</div>
          ${a.content ? `<p class="article-card-excerpt">${a.content.substring(0, 200)}${a.content.length > 200 ? '...' : ''}</p>` : ''}
          ${a.filePath ? `<a href="${a.filePath}" class="article-card-download" target="_blank" onclick="event.stopPropagation()"><i class="fas fa-download"></i> Скачать файл</a>` : ''}
        </div>
      </div>
    `).join('');
    document.querySelectorAll('.article-card').forEach(card => {
      card.addEventListener('click', () => loadArticleModal(card.dataset.id));
    });
  } catch (err) {
    document.getElementById('articlesContainer').innerHTML = '<div class="schedule-loading">Ошибка загрузки</div>';
  }
}

async function loadArticleModal(id) {
  currentArticleId = id;
  try {
    const data = await fetchAPI(`/api/articles/${id}`);
    document.getElementById('modalArticleTitle').textContent = data.article.title;
    document.getElementById('modalArticleContent').textContent = data.article.content || '';
    const fileLink = document.getElementById('modalArticleFile');
    if (data.article.filePath) {
      fileLink.innerHTML = `<a href="${data.article.filePath}" target="_blank"><i class="fas fa-download"></i> Скачать файл</a>`;
    } else {
      fileLink.innerHTML = '';
    }
    const commentsDiv = document.getElementById('modalComments');
    if (data.comments && data.comments.length > 0) {
      commentsDiv.innerHTML = data.comments.map(c => `
        <div class="comment-item">
          <div class="comment-author"><i class="fas fa-user"></i> ${c.author}</div>
          <div class="comment-date">${formatDate(c.createdAt)}</div>
          <div class="comment-text">${c.text}</div>
        </div>
      `).join('');
    } else {
      commentsDiv.innerHTML = '<p style="color:#888">Комментариев пока нет</p>';
    }
    document.getElementById('articleModal').classList.add('show');
  } catch (err) {}
}

// ===== NEWS =====
async function loadNews() {
  try {
    const data = await fetchAPI('/api/news');
    const container = document.getElementById('newsContainer');
    if (data.length === 0) {
      container.innerHTML = '<div class="schedule-loading">Новости скоро появятся</div>';
      return;
    }
    container.innerHTML = data.map(n => `
      <div class="news-card">
        <div class="news-card-body">
          <div class="news-card-title">${n.title}</div>
          <div class="news-card-date"><i class="far fa-calendar"></i> ${formatDate(n.createdAt)}</div>
          ${n.content ? `<p class="news-card-text">${n.content}</p>` : ''}
          ${n.filePath ? `<a href="${n.filePath}" class="news-card-file" target="_blank"><i class="fas fa-download"></i> Скачать файл</a>` : ''}
        </div>
      </div>
    `).join('');
  } catch (err) {
    document.getElementById('newsContainer').innerHTML = '<div class="schedule-loading">Ошибка загрузки</div>';
  }
}

// ===== VIDEOS =====
const YOUTUBE_API_KEY = ''; // Add your YouTube API key here
const CHANNEL_ID = ''; // Add channel ID or use video IDs directly

const FALLBACK_VIDEOS = [
  { id: 'dQw4w9WgXcQ', title: 'Пример видео каратэ' },
];

async function loadVideos() {
  const grid = document.getElementById('videosGrid');
  let videos = [];

  if (YOUTUBE_API_KEY && CHANNEL_ID) {
    try {
      const res = await fetch(`https://www.googleapis.com/youtube/v3/search?key=${YOUTUBE_API_KEY}&channelId=${CHANNEL_ID}&part=snippet&order=date&maxResults=5`);
      const data = await res.json();
      if (data.items) {
        videos = data.items.filter(i => i.id.kind === 'youtube#video').map(i => ({
          id: i.id.videoId,
          title: i.snippet.title
        }));
      }
    } catch (err) {}
  }

  if (videos.length === 0) {
    videos = FALLBACK_VIDEOS;
  }

  grid.innerHTML = videos.map(v => `
    <div class="video-card">
      <div class="video-embed">
        <iframe src="https://www.youtube.com/embed/${v.id}" allowfullscreen></iframe>
      </div>
      <div class="video-card-body">
        <h3 class="video-card-title">${v.title}</h3>
      </div>
    </div>
  `).join('');
}

// ===== HELPERS =====
function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('ru-RU', { year: 'numeric', month: 'long', day: 'numeric' });
}
