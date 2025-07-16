const btnVideo = document.getElementById('btn-video');
const overlayVideo = document.getElementById('overlay-video');
const closeBtn = document.getElementById('close-video');
const iframe = overlayVideo.querySelector('iframe');
const originalSrc = iframe.src;

// Dispositivo móvil
const isMobile = /Android|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i.test(navigator.userAgent);

btnVideo.addEventListener('click', () => {
  if (isMobile) {
    window.location.href = 'https://www.youtube.com/watch?v=xTeGFxuU-7w';
  } else {
    overlayVideo.classList.add('active');
    iframe.src = originalSrc;
  }
});

closeBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  overlayVideo.classList.remove('active');
  iframe.src = ''; // Detener el video al cerrar
});
