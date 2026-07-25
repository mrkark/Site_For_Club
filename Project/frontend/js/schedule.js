function getSeason() {
  const month = new Date().getMonth() + 1;
  return (month >= 6 && month <= 8) ? 'summer' : 'winter';
}

async function loadSchedule() {
  try {
    const season = getSeason();
    const data = await fetchAPI('/api/schedule?season=' + season);
    const grid = document.getElementById('scheduleGrid');
    const indicator = document.getElementById('seasonToggle');
    if (indicator) {
      indicator.textContent = season === 'summer'
        ? 'Летнее расписание'
        : 'Зимнее расписание';
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
          <div class="schedule-entry">
            <div class="schedule-time"><i class="far fa-clock"></i> ${i.time}</div>
            ${i.group_name ? `<div class="schedule-group"><i class="fas fa-users"></i> ${i.group_name}</div>` : ''}
            ${i.description ? `<div class="schedule-desc">${i.description}</div>` : ''}
          </div>`).join('')}
      </div>
    `).join('');
  } catch (err) {
    document.getElementById('scheduleGrid').innerHTML = '<div class="schedule-loading">Ошибка загрузки</div>';
  }
}
