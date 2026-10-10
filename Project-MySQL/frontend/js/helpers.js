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

function formatContentWithLinks(text) {
  if (!text) return '';
  // Convert email addresses to mailto: links
  let res = text.replace(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/gi, '<a href="mailto:$1" class="contact-link">$1</a>');
  // Convert Belarusian and international phone numbers to tel: links
  res = res.replace(/(\+375[\s\-]?(?:\(?\d{2}\)?|\d{2})[\s\-]?\d{3}[\s\-]?\d{2,4}[\s\-]?\d{0,2})/g, (match) => {
    const cleanDigits = match.replace(/[^\d+]/g, '');
    if (cleanDigits.length < 10) return match;
    return `<a href="tel:${cleanDigits}" class="contact-link">${match}</a>`;
  });
  return res;
}
