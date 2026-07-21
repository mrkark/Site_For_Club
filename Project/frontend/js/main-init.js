let currentArticleId = null;

document.addEventListener('DOMContentLoaded', () => {

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

  // Load all sections
  loadSchedule();
  loadInstructors();
  loadArticles();
  loadNews();
  loadVideos();
});
