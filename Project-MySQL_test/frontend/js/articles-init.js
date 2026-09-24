var currentArticleId = null;

document.addEventListener('DOMContentLoaded', function() {
  var navToggle = document.getElementById('navToggle');
  var navMenu = document.getElementById('navMenu');
  if (navToggle) {
    navToggle.addEventListener('click', function() {
      navMenu.classList.toggle('active');
      navToggle.classList.toggle('active');
      document.body.classList.toggle('nav-open');
    });
    document.querySelectorAll('.nav-link').forEach(function(l) {
      l.addEventListener('click', function() {
        navMenu.classList.remove('active');
        navToggle.classList.remove('active');
        document.body.classList.remove('nav-open');
      });
    });
  }

  var articleModal = document.getElementById('articleModal');
  var modalClose = document.querySelector('#articleModal .modal-close');
  if (modalClose) modalClose.addEventListener('click', function() { articleModal.classList.remove('show'); });
  if (articleModal) articleModal.addEventListener('click', function(e) { if (e.target === articleModal) articleModal.classList.remove('show'); });

  var replyToId = null;
  var submitBtn = document.getElementById('submitComment');
  if (submitBtn) {
    submitBtn.addEventListener('click', async function() {
      var author = document.getElementById('commentAuthor').value.trim();
      var text = document.getElementById('commentText').value.trim();
      var errorEl = document.getElementById('commentError');
      if (!author || !text) { errorEl.textContent = 'Заполните имя и текст комментария'; return; }
      var articleId = submitBtn.dataset.articleId;
      if (!articleId) { errorEl.textContent = 'Ошибка: статья не выбрана'; return; }
      errorEl.textContent = '';
      submitBtn.disabled = true;
      submitBtn.textContent = 'Отправка...';
      try {
        var body = { author: author, text: text };
        if (replyToId) body.parentId = replyToId;
        var res = await fetch('/api/articles/' + articleId + '/comments', {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body)
        });
        var data = await res.json();
        if (res.ok) {
          replyToId = null;
          document.getElementById('replyToInfo').textContent = '';
          document.getElementById('commentAuthor').value = '';
          document.getElementById('commentText').value = '';
          loadArticleModal(articleId);
        } else {
          errorEl.textContent = data.error || 'Ошибка при отправке';
        }
      } catch (_) { errorEl.textContent = 'Ошибка соединения'; }
      finally { submitBtn.disabled = false; submitBtn.textContent = 'Отправить'; }
    });
  }

  document.addEventListener('click', function(e) {
    var replyBtn = e.target.closest('.comment-reply-btn');
    if (replyBtn) {
      replyToId = replyBtn.dataset.commentId;
      document.getElementById('replyToInfo').textContent = 'Ответ ' + replyBtn.dataset.author + ':';
      document.getElementById('commentAuthor').focus();
      window.scrollTo(0, document.getElementById('submitComment').getBoundingClientRect().top + window.scrollY - 200);
    }
  });

  var navbar = document.getElementById('navbar');
  window.addEventListener('scroll', function() {
    navbar.classList.toggle('scrolled', window.scrollY > 100);
  });

  loadArticles();
});
