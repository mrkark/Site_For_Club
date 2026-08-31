function fileUrl(fp) {
  if (!fp) return '';
  return '/api/download/' + encodeURIComponent(fp.replace(/^\/uploads\//, ''));
}

function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('ru-RU', { year: 'numeric', month: 'long', day: 'numeric' });
}

function scrollToAnchor() {
  const hash = window.location.hash;
  if (!hash) return;

  const targetId = hash.substring(1);
  const targetElement = document.getElementById(targetId);

  if (targetElement) {
    setTimeout(() => {
      const headerOffset = 80;
      const elementPosition = targetElement.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }, 100);
  }
}
