/**
 * @fileoverview Maneja el carrusel de sucursales en la página de contacto.
 * Controla la navegación automática y manual entre las slides.
 */

document.addEventListener('DOMContentLoaded', function () {
    const slides = document.querySelectorAll('.carrusel-slide');
    const sucursales = document.querySelectorAll('.sucursal');
    let currentSlide = 0;
    let intervalId;
    let timeoutId;

    /**
     * Muestra el slide y la sucursal correspondiente al índice.
     * @param {number} index - Índice del slide a mostrar.
     */
    function showSlide(index) {
        slides.forEach((slide, i) => {
            slide.classList.toggle('active', i === index);
        });
        sucursales.forEach((sucursal, i) => {
            sucursal.classList.toggle('active', i === index);
        });
    }

    /**
     * Muestra el siguiente slide en el carrusel.
     */
    function nextSlide() {
        currentSlide = (currentSlide + 1) % slides.length;
        showSlide(currentSlide);
    }

    /**
     * Inicia el carrusel automático.
     */
    function startCarousel() {
        stopCarousel(); // Asegurarse de que no haya intervalos duplicados
        intervalId = setInterval(nextSlide, 5000); // Cambia de slide cada 5 segundos
    }

    /**
     * Detiene el carrusel automático.
     */
    function stopCarousel() {
        clearInterval(intervalId);
    }

    /**
     * Reinicia el timeout del carrusel.
     */
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
