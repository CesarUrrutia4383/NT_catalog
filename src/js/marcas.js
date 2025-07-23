const logosContainer = document.querySelector('.logos-container');

if (logosContainer) {
  const logoItems = Array.from(logosContainer.querySelectorAll('.logo-item'));
  let currentLogo = 0;
  let autoLogoChange;

  function setActiveLogo(index) {
    logoItems.forEach((logo, i) => {
      logo.classList.toggle('active', i === index);
    });
    currentLogo = index;
  }

  function startAutoChange() {
    if (autoLogoChange) return; // evitar duplicados
    autoLogoChange = setInterval(() => {
      let nextLogo = (currentLogo + 1) % logoItems.length;
      setActiveLogo(nextLogo);
    }, 3000);
  }

  function stopAutoChange() {
    clearInterval(autoLogoChange);
    autoLogoChange = null;
  }

  // Inicializar
  setActiveLogo(0);
  startAutoChange();

  logosContainer.addEventListener('mouseenter', stopAutoChange);
  logosContainer.addEventListener('mouseleave', startAutoChange);
}
