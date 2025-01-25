document.addEventListener('DOMContentLoaded', () => {
  const menuToggle = document.querySelector('#side-menu-toggle');
  const mobileNav = document.querySelector('.mobile-nav');
  const backdrop = document.querySelector('.backdrop');

  if (menuToggle && mobileNav && backdrop) {
      menuToggle.addEventListener('click', (e) => {
          mobileNav.classList.toggle('show');
          backdrop.classList.toggle('show');
      });

      backdrop.addEventListener('click', () => {
          mobileNav.classList.remove('show');
          backdrop.classList.remove('show');
      });
  }
});