async function loadInstructors() {
  try {
    const data = await fetchAPI('/api/instructors');
    const grid = document.getElementById('instructorsGrid');
    if (data.length === 0) {
      grid.innerHTML = '<div class="schedule-loading">Информация об инструкторах скоро появится</div>';
      return;
    }
    grid.innerHTML = data.map(i => {
      const spaceIdx = i.name.indexOf(' ');
      const surname = spaceIdx > -1 ? i.name.substring(0, spaceIdx) : i.name;
      const rest = spaceIdx > -1 ? i.name.substring(spaceIdx + 1) : '';
      return `
      <div class="instructor-card">
        <img src="${i.photo || '/img/default-instructor.svg'}" alt="${i.name}" class="instructor-img" loading="lazy">
        <div class="instructor-name"><span class="instructor-surname">${surname}</span>${rest ? `<br><span class="instructor-rest">${rest}</span>` : ''}</div>
        ${i.title ? `<p class="instructor-title">${i.title}</p>` : ''}
        ${i.description ? `<p class="instructor-desc">${i.description}</p>` : ''}
      </div>
    `;
    }).join('');
  } catch (err) {
    document.getElementById('instructorsGrid').innerHTML = '<div class="schedule-loading">Ошибка загрузки</div>';
  }
}
