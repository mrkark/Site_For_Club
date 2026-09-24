async function loadReviews() {
  try {
    const data = await fetchAPI('/api/reviews');
    const grid = document.getElementById('reviewsGrid');
    if (data.length === 0) {
      grid.innerHTML = '<div class="schedule-loading">Отзывы скоро появятся</div>';
      scrollToAnchor();
      return;
    }
    grid.innerHTML = data.map(r => `
      <div class="review-card">
        <img src="${r.photo || '/img/default-instructor.svg'}" alt="Отзыв ${r.author} о клубе каратэ Сэнкё" class="review-photo" loading="lazy">
        <div class="review-body">
          <div class="review-author">${r.author}</div>
          <p class="review-text">${(r.text || '').replace(/\n/g, '<br>')}</p>
        </div>
      </div>
    `).join('');

    scrollToAnchor();
  } catch (err) {
    document.getElementById('reviewsGrid').innerHTML = '<div class="schedule-loading">Ошибка загрузки</div>';
    scrollToAnchor();
  }
}
