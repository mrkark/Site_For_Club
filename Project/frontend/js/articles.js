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
          <div class="scroll-top">
            <div class="scroll-nail"></div>
            <div class="scroll-string-left"></div>
            <div class="scroll-string-right"></div>
          </div>
          <div class="scroll-body">
            <div class="article-card-body">
              <div class="article-card-title">${a.title}</div>
              <div class="article-card-date"><i class="far fa-calendar"></i> ${formatDate(a.createdAt)} <span class="article-views"><i class="far fa-eye"></i> ${a.views || 0}</span></div>
              ${a.content ? `<p class="article-card-excerpt">${a.content.substring(0, 200)}${a.content.length > 200 ? '...' : ''}</p>` : ''}
              ${a.filePath ? `<a href="${fileUrl(a.filePath)}" class="article-card-download" onclick="event.stopPropagation()"><i class="fas fa-download"></i> Скачать файл</a>` : ''}
            </div>
          </div>
          <div class="scroll-bottom"></div>
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
