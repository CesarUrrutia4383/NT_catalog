document.addEventListener('DOMContentLoaded', () => {
  const logosContainer = document.querySelector('.logos-grid');

  if (logosContainer) {
    const logoItems = Array.from(logosContainer.querySelectorAll('.logo-item'));
    let currentIndex = 0;

    function setActiveLogo(index) {
      logoItems.forEach((logo, i) => {
        logo.classList.toggle('active', i === index);
      });
    }

    if (logoItems.length > 0) {
      // Start the animation
      setInterval(() => {
        currentIndex = (currentIndex + 1) % logoItems.length;
        setActiveLogo(currentIndex);
      }, 1000);
    } else {
      console.log("No se encontraron logos para animar.");
    }
  } else {
    console.log("No se encontró el contenedor de logos.");
  }
});
