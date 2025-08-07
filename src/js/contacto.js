document.addEventListener('DOMContentLoaded', function () {
    const slides = document.querySelectorAll('.carrusel-slide');
    const sucursales = document.querySelectorAll('.sucursal');
    let currentSlide = 0;
    let intervalId;
    let timeoutId;

    function showSlide(index) {
        slides.forEach((slide, i) => {
            slide.classList.toggle('active', i === index);
        });
        sucursales.forEach((sucursal, i) => {
            sucursal.classList.toggle('active', i === index);
        });
    }

    function nextSlide() {
        currentSlide = (currentSlide + 1) % slides.length;
        showSlide(currentSlide);
    }

    function startCarousel() {
        stopCarousel(); // Asegurarse de que no haya intervalos duplicados
        intervalId = setInterval(nextSlide, 5000); // Cambia de slide cada 5 segundos
    }

    function stopCarousel() {
        clearInterval(intervalId);
    }

    function resetCarouselTimeout() {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
            startCarousel();
        }, 10000); // Reiniciar después de 10 segundos de inactividad
    }

    // Iniciar el carrusel
    if (slides.length > 0) {
        showSlide(currentSlide);
        startCarousel();
    }

    // Manejar clics en las tarjetas de sucursal
    sucursales.forEach((sucursal, index) => {
        sucursal.addEventListener('click', () => {
            stopCarousel();
            currentSlide = index;
            showSlide(currentSlide);
            resetCarouselTimeout();
        });
    });

    // Inicializar AOS
    if (typeof AOS !== 'undefined') {
        AOS.init({
            duration: 800, // Duración de la animación
            once: true, // La animación solo ocurre una vez
        });
    }
});
