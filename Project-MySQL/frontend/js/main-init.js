let currentArticleId = null;

document.addEventListener('DOMContentLoaded', () => {

  // Mobile nav toggle
  const navToggle = document.getElementById('navToggle');
  const navMenu = document.getElementById('navMenu');
  if (navToggle && navMenu) {
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
  }

  // Highlight the nav link matching the current page/section
  const currentPath = window.location.pathname.replace(/\/$/, '') || '/index.html';
  document.querySelectorAll('.nav-link').forEach(l => {
    const href = l.getAttribute('href') || '';
    if (!href.startsWith('#') && href.replace(/\/$/, '') === currentPath) {
      l.classList.add('active');
    }
  });

  // Hidden admin button
  const adminHiddenBtn = document.getElementById('adminHiddenBtn');
  if (adminHiddenBtn) {
    adminHiddenBtn.addEventListener('click', async () => {
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
  }

  // Login modal
  const loginModal = document.getElementById('loginModal');
  if (loginModal) {
    document.getElementById('loginModalClose').addEventListener('click', () => loginModal.classList.remove('show'));
    loginModal.addEventListener('click', (e) => { if (e.target === loginModal) loginModal.classList.remove('show'); });

    const passwordToggle = document.getElementById('passwordToggle');
    const passwordInput = document.getElementById('passwordInput');
    if (passwordToggle && passwordInput) {
      passwordToggle.addEventListener('click', () => {
        const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordInput.setAttribute('type', type);
        passwordToggle.innerHTML = type === 'password' ? '<i class="fas fa-eye"></i>' : '<i class="fas fa-eye-slash"></i>';
        passwordToggle.setAttribute('aria-label', type === 'password' ? 'Показать пароль' : 'Скрыть пароль');
      });
    }

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
  }

  // Article modal
  const articleModal = document.getElementById('articleModal');
  if (articleModal) {
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
  }

  // FAQ accordion
  document.querySelectorAll('.faq-question').forEach(btn => {
    const answer = btn.nextElementSibling;
    btn.addEventListener('click', () => {
      const isOpen = btn.getAttribute('aria-expanded') === 'true';
      document.querySelectorAll('.faq-question').forEach(other => {
        other.setAttribute('aria-expanded', 'false');
        other.nextElementSibling.style.maxHeight = null;
      });
      if (!isOpen) {
        btn.setAttribute('aria-expanded', 'true');
        answer.style.maxHeight = answer.scrollHeight + 'px';
      }
    });
  });

  // Navbar background on scroll
  const navbar = document.getElementById('navbar');
  if (navbar) {
    window.addEventListener('scroll', () => {
      navbar.classList.toggle('scrolled', window.scrollY > 100);
    });
  }
});
