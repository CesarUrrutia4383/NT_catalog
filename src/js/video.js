/**
 * @fileoverview Controla la reproducción del video en el overlay.
 * Maneja la apertura y cierre del video, y redirige a YouTube en dispositivos móviles.
 */

// Obtener referencias a los elementos del DOM
const btnVideo = document.getElementById('btn-video');
const overlayVideo = document.getElementById('overlay-video');
const closeBtn = document.getElementById('close-video');

if (btnVideo && overlayVideo && closeBtn) {
  const iframe = overlayVideo.querySelector('iframe');
  const originalSrc = iframe.src;

  // Detectar si el dispositivo es móvil
  const isMobile = /Android|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i.test(navigator.userAgent);

  // Evento para abrir el video
  btnVideo.addEventListener('click', () => {
    if (isMobile) {
      // Redirigir a YouTube en dispositivos móviles
      window.location.href = 'https://www.youtube.com/watch?v=xTeGFxuU-7w';
    } else {
      // Mostrar el overlay y cargar el video
      overlayVideo.classList.add('active');
      iframe.src = originalSrc;
    }
  });

  // Evento para cerrar el video
  closeBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    overlayVideo.classList.remove('active');
    iframe.src = ''; // Detener el video al cerrar
  });
}
