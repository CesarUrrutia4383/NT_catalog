const btnVideo = document.getElementById('btn-video');
const overlayVideo = document.getElementById('overlay-video');

// Detectar si es dispositivo móvil
const isMobile = /Android|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i.test(navigator.userAgent);

btnVideo.addEventListener('click', () => {
  if (isMobile) {
    // En móvil, redirigir a YouTube
    window.location.href = 'https://www.youtube.com/watch?v=xTeGFxuU-7w';
  } else {
    // En escritorio, mostrar overlay con video
    overlayVideo.classList.add('active');
  }
});

overlayVideo.addEventListener('click', () => {
  overlayVideo.classList.remove('active');
});
