window.onload = function () {
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
        stopCarousel();
        intervalId = setInterval(nextSlide, 5000);
    }

    function stopCarousel() {
        clearInterval(intervalId);
    }

    function resetCarouselTimeout() {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
            startCarousel();
        }, 10000);
    }

    if (slides.length > 0 && sucursales.length > 0) {
        showSlide(currentSlide);
        startCarousel();

        sucursales.forEach((sucursal, index) => {
            sucursal.addEventListener('click', () => {
                stopCarousel();
                currentSlide = index;
                showSlide(currentSlide);
                resetCarouselTimeout();
            });
        });
    }

    if (typeof AOS !== 'undefined') {
        AOS.init({
            duration: 800,
            once: true,
        });
    }
};
