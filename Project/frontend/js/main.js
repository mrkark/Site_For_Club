document.addEventListener('DOMContentLoaded', () => {

  let currentArticleId = null;

  // Mobile nav toggle
  const navToggle = document.getElementById('navToggle');
  const navMenu = document.getElementById('navMenu');
  navToggle.addEventListener('click', () => {
    navMenu.classList.toggle('active');
    navToggle.classList.toggle('active');
    document.body.classList.toggle('nav-open');
  });
  document.querySelectorAll('.nav-link').forEach(l => {
    l.addEventListener('click', () => {
      navMenu.classList.remove('active');
      navToggle.classList.remove('active');
      document.body.classList.remove('nav-open');
    });
  });

  // Shrink navbar on scroll
  const navbar = document.getElementById('navbar');
  window.addEventListener('scroll', () => {
    navbar.style.background = window.scrollY > 50
      ? 'rgba(15, 15, 26, 0.98)'
      : 'rgba(15, 15, 26, 0.95)';
  });

  // Hidden admin button
  document.getElementById('adminHiddenBtn').addEventListener('click', async () => {
    try {
      const res = await fetch('/api/admin/session');
      const data = await res.json();
      if (data.authenticated) {
        window.location.href = '/admin.html';
        return;
      }
    } catch (_) {}
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

  let replyToId = null;
  document.getElementById('submitComment').addEventListener('click', async () => {
    const author = document.getElementById('commentAuthor').value.trim();
    const text = document.getElementById('commentText').value.trim();
    const errorEl = document.getElementById('commentError');
    if (!author || !text) {
      errorEl.textContent = 'Заполните имя и текст комментария';
      return;
    }
    const articleId = document.getElementById('submitComment').dataset.articleId;
    if (!articleId) {
      errorEl.textContent = 'Ошибка: статья не выбрана. Закройте и откройте статью заново.';
      return;
    }
    errorEl.textContent = '';
    const btn = document.getElementById('submitComment');
    btn.disabled = true;
    btn.textContent = 'Отправка...';
    try {
      const body = { author, text };
      if (replyToId) body.parentId = replyToId;
      const res = await fetch(`/api/articles/${articleId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (res.ok) {
        replyToId = null;
        document.getElementById('replyToInfo').textContent = '';
        document.getElementById('commentAuthor').value = '';
        document.getElementById('commentText').value = '';
        loadArticleModal(articleId);
      } else {
        errorEl.textContent = data.error || 'Ошибка при отправке';
      }
    } catch (err) {
      errorEl.textContent = 'Ошибка соединения с сервером';
    } finally {
      btn.disabled = false;
      btn.textContent = 'Отправить';
    }
  });

  // Reply button delegation
  document.addEventListener('click', (e) => {
    const replyBtn = e.target.closest('.comment-reply-btn');
    if (replyBtn) {
      replyToId = replyBtn.dataset.commentId;
      const replyToAuthor = replyBtn.dataset.author;
      document.getElementById('replyToInfo').textContent = `Ответ ${replyToAuthor}:`;
      document.getElementById('commentAuthor').focus();
      window.scrollTo(0, document.getElementById('submitComment').getBoundingClientRect().top + window.scrollY - 200);
    }
  });

  // Load sections
  loadSchedule();
  loadInstructors();
  loadArticles();
  loadNews();
  loadVideos();
});

async function fetchAPI(url) {
  const sep = url.includes('?') ? '&' : '?';
  const res = await fetch(url + sep + '_t=' + Date.now());
  return res.json();
}

// ===== SCHEDULE =====
let currentSeason = 'auto'; // 'auto', 'summer', 'winter'

function getSeason() {
  if (currentSeason === 'summer') return 'summer';
  if (currentSeason === 'winter') return 'winter';
  const month = new Date().getMonth() + 1;
  return (month >= 6 && month <= 8) ? 'summer' : 'winter';
}

async function loadSchedule() {
  try {
    const season = getSeason();
    const data = await fetchAPI('/api/schedule?season=' + season);
    const grid = document.getElementById('scheduleGrid');
    const toggle = document.getElementById('seasonToggle');
    if (toggle) {
      toggle.classList.remove('summer', 'winter');
      toggle.classList.add(season);
      toggle.innerHTML = season === 'summer'
        ? '<i class="fas fa-sun"></i> Летнее расписание <span class="badge">сейчас</span>'
        : '<i class="fas fa-snowflake"></i> Зимнее расписание <span class="badge">сейчас</span>';
    }
    if (data.length === 0) {
      grid.innerHTML = '<div class="schedule-loading">Расписание на этот сезон скоро появится</div>';
      return;
    }
    const days = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота', 'Воскресенье'];
    const grouped = {};
    const dayOrder = {};
    days.forEach((d, i) => dayOrder[d] = i);
    data.forEach(item => {
      if (!grouped[item.dayOfWeek]) grouped[item.dayOfWeek] = [];
      grouped[item.dayOfWeek].push(item);
    });
    const sorted = Object.entries(grouped).sort((a, b) => dayOrder[a[0]] - dayOrder[b[0]]);
    grid.innerHTML = sorted.map(([day, items]) => `
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

function switchSeason(season) {
  currentSeason = season;
  loadSchedule();
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
        <img src="${i.photo || '/img/default-instructor.svg'}" alt="${i.name}" class="instructor-img" loading="lazy">
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
let allArticles = [];
let articlesPage = 0;
const ARTICLES_PER_PAGE = 3;

async function loadArticles() {
  try {
    allArticles = await fetchAPI('/api/articles');
    const container = document.getElementById('articlesContainer');
    if (allArticles.length === 0) {
      container.innerHTML = '<div class="schedule-loading">Статьи скоро появятся</div>';
      return;
    }
    renderArticles();
  } catch (err) {
    document.getElementById('articlesContainer').innerHTML = '<div class="schedule-loading">Ошибка загрузки</div>';
  }
}

function renderArticles() {
  const container = document.getElementById('articlesContainer');
  const totalPages = Math.ceil(allArticles.length / ARTICLES_PER_PAGE);
  if (articlesPage >= totalPages) articlesPage = 0;
  const start = articlesPage * ARTICLES_PER_PAGE;
  const pageItems = allArticles.slice(start, start + ARTICLES_PER_PAGE);

  container.innerHTML = `
    <div class="pagination-tabs">
      ${Array.from({ length: totalPages }, (_, i) =>
        `<button class="pag-tab ${i === articlesPage ? 'active' : ''}" data-page="${i}">${i + 1}</button>`
      ).join('')}
      <span class="pag-count">${allArticles.length}</span>
    </div>
    <div class="articles-grid">
      ${pageItems.map(a => `
        <div class="article-card" data-id="${a.id}">
          <div class="article-card-body">
            <div class="article-card-title">${a.title}</div>
            <div class="article-card-date"><i class="far fa-calendar"></i> ${formatDate(a.createdAt)} <span class="article-views"><i class="far fa-eye"></i> ${a.views || 0}</span></div>
            ${a.content ? `<p class="article-card-excerpt">${a.content.substring(0, 200)}${a.content.length > 200 ? '...' : ''}</p>` : ''}
            ${a.filePath ? `<a href="${fileUrl(a.filePath)}" class="article-card-download" onclick="event.stopPropagation()"><i class="fas fa-download"></i> Скачать файл</a>` : ''}
          </div>
        </div>
      `).join('')}
    </div>
  `;

  container.querySelectorAll('.article-card').forEach(card => {
    card.addEventListener('click', () => loadArticleModal(card.dataset.id));
  });
  container.querySelectorAll('.pag-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      articlesPage = parseInt(btn.dataset.page);
      renderArticles();
    });
  });
}

async function loadArticleModal(id) {
  currentArticleId = id;
  document.getElementById('submitComment').dataset.articleId = id;
  try {
    await fetch(`/api/articles/${id}/view`, { method: 'POST' });
    const data = await fetchAPI(`/api/articles/${id}`);
    document.getElementById('modalArticleTitle').textContent = `${data.article.title} (${data.article.views || 0} просм.)`;
    document.getElementById('modalArticleContent').textContent = data.article.content || '';
    const fileLink = document.getElementById('modalArticleFile');
    if (data.article.filePath) {
      fileLink.innerHTML = `<a href="${fileUrl(data.article.filePath)}"><i class="fas fa-download"></i> Скачать файл</a>`;
    } else {
      fileLink.innerHTML = '';
    }
    const commentsDiv = document.getElementById('modalComments');
    if (data.comments && data.comments.length > 0) {
      commentsDiv.innerHTML = renderComments(data.comments, 0);
    } else {
      commentsDiv.innerHTML = '<p style="color:#888">Комментариев пока нет</p>';
    }
    document.getElementById('articleModal').classList.add('show');
  } catch (err) { console.error(err); }
}

// ===== THREADED COMMENTS =====
function renderComments(comments, depth) {
  return comments.map(c => `
    <div class="comment-item" style="${depth > 0 ? 'margin-left:30px;border-left:2px solid #c9a84c;padding-left:15px;margin-top:10px' : ''}">
      <div class="comment-header">
        <span class="comment-author"><i class="fas fa-user"></i> ${c.author}</span>
        <span class="comment-date">${formatDate(c.createdAt)}</span>
      </div>
      <div class="comment-text">${c.text}</div>
      <button class="comment-reply-btn" data-comment-id="${c.id}" data-author="${c.author}">Ответить</button>
      ${c.replies && c.replies.length > 0 ? renderComments(c.replies, depth + 1) : ''}
    </div>
  `).join('');
}

// ===== NEWS =====
let allNews = [];
let newsPage = 0;
const NEWS_PER_PAGE = 3;

async function loadNews() {
  try {
    allNews = await fetchAPI('/api/news');
    const container = document.getElementById('newsContainer');
    if (allNews.length === 0) {
      container.innerHTML = '<div class="schedule-loading">Новости скоро появятся</div>';
      return;
    }
    renderNews();
  } catch (err) {
    document.getElementById('newsContainer').innerHTML = '<div class="schedule-loading">Ошибка загрузки</div>';
  }
}

function renderNews() {
  const container = document.getElementById('newsContainer');
  const totalPages = Math.ceil(allNews.length / NEWS_PER_PAGE);
  if (newsPage >= totalPages) newsPage = 0;
  const start = newsPage * NEWS_PER_PAGE;
  const pageItems = allNews.slice(start, start + NEWS_PER_PAGE);

  container.innerHTML = `
    <div class="pagination-tabs">
      ${Array.from({ length: totalPages }, (_, i) =>
        `<button class="pag-tab ${i === newsPage ? 'active' : ''}" data-page="${i}">${i + 1}</button>`
      ).join('')}
      <span class="pag-count">${allNews.length}</span>
    </div>
    <div class="news-grid">
      ${pageItems.map(n => `
        <div class="news-card">
          <div class="news-card-body">
            <div class="news-card-title">${n.title}</div>
            <div class="news-card-date"><i class="far fa-calendar"></i> ${formatDate(n.createdAt)}</div>
            ${n.content ? `<p class="news-card-text">${n.content}</p>` : ''}
            ${n.filePath ? `<a href="${fileUrl(n.filePath)}" class="news-card-file"><i class="fas fa-download"></i> Скачать файл</a>` : ''}
          </div>
        </div>
      `).join('')}
    </div>
  `;

  container.querySelectorAll('.pag-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      newsPage = parseInt(btn.dataset.page);
      renderNews();
    });
  });
}

// ===== VIDEOS =====
const YOUTUBE_API_KEY = 'AIzaSyC6nwjbqtQ-iGADr9ydsr0fyRlwHPfxltA';
const CHANNEL_ID = 'UCj8H1ZZe0HZYtsXn8PsUn9w'; // JKS Belarus
const CACHE_KEY = 'jks_youtube_videos_v2';
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

async function loadVideos() {
  const grid = document.getElementById('videosGrid');
  let videos = getCachedVideos();

  if (!videos && YOUTUBE_API_KEY && CHANNEL_ID) {
    videos = await fetchYouTubeVideos();
    if (videos) cacheVideos(videos);
  }

  if (!videos || videos.length === 0) {
    grid.innerHTML = '<div class="schedule-loading">Видео пока не загружены</div>';
    return;
  }

  grid.innerHTML = videos.map(v => `
    <a href="https://www.youtube.com/watch?v=${v.id}" target="_blank" rel="noopener noreferrer" class="video-card">
      <div class="video-thumb">
        <div class="video-play-overlay"><i class="fas fa-play"></i></div>
        <img src="https://img.youtube.com/vi/${v.id}/mqdefault.jpg" alt="${v.title}" loading="lazy">
      </div>
      <div class="video-card-body">
        <h3 class="video-card-title">${v.title}</h3>
      </div>
    </a>
  `).join('');
}

function getCachedVideos() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const { data, expiry } = JSON.parse(raw);
    if (Date.now() > expiry) {
      localStorage.removeItem(CACHE_KEY);
      return null;
    }
    return data;
  } catch {
    return null;
  }
}

function cacheVideos(videos) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({
      data: videos,
      expiry: Date.now() + CACHE_TTL
    }));
  } catch {}
}

async function fetchYouTubeVideos() {
  try {
    const chRes = await fetch(
      `https://www.googleapis.com/youtube/v3/channels?key=${YOUTUBE_API_KEY}&id=${CHANNEL_ID}&part=contentDetails`
    );
    const chData = await chRes.json();
    if (chData.error || !chData.items || !chData.items[0]) return null;
    const uploadsPlaylistId = chData.items[0].contentDetails.relatedPlaylists.uploads;

    const plRes = await fetch(
      `https://www.googleapis.com/youtube/v3/playlistItems?key=${YOUTUBE_API_KEY}&playlistId=${uploadsPlaylistId}&part=snippet&maxResults=6`
    );
    const plData = await plRes.json();
    if (plData.error || !plData.items) return null;

    return plData.items.map(i => ({
      id: i.snippet.resourceId.videoId,
      title: i.snippet.title
    }));
  } catch (err) {
    return null;
  }
}

// ===== HELPERS =====
function fileUrl(fp) {
  if (!fp) return '';
  return '/api/download/' + encodeURIComponent(fp.replace(/^\/uploads\//, ''));
}

function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('ru-RU', { year: 'numeric', month: 'long', day: 'numeric' });
}
