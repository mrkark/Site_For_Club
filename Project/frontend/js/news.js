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
