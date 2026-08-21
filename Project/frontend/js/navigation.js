document.addEventListener('DOMContentLoaded', function() {
  scrollToAnchor();

  document.addEventListener('click', (e) => {
    const link = e.target.closest('a[href^="#"]');
    if (link) {
      e.preventDefault();
      const targetId = link.getAttribute('href').substring(1);
      const targetElement = document.getElementById(targetId);
      
      if (targetElement) {
        const headerOffset = 80;
        const elementPosition = targetElement.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
        
        window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
        history.pushState(null, null, `#${targetId}`);
      }
    }
  });
});
