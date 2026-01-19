/**
 * @fileoverview Logic for the Contact page carousel.
 * Handles the auto-rotation of branch images and synchronization with the branch info list.
 */

document.addEventListener('DOMContentLoaded', () => {
    const carruselContainer = document.querySelector('.sucursales-carrusel');
    // Exit if not on the contact page or if the carousel structure is missing
    if (!carruselContainer) return;

    const slides = Array.from(document.querySelectorAll('.carrusel-slide'));
    const sucursales = Array.from(document.querySelectorAll('.sucursal'));

    if (slides.length === 0 || sucursales.length === 0) return;

    let currentIndex = 0;
    let intervalId;
    const intervalTime = 4000; // 4 seconds

    /**
     * Activates the slide and sucursal info at the given index.
     * @param {number} index - Index of the slide to show.
     */
    function showSlide(index) {
        // Wrap around index
        if (index >= slides.length) index = 0;
        if (index < 0) index = slides.length - 1;

        currentIndex = index;

        // Remove active class from all
        slides.forEach(slide => slide.classList.remove('active'));
        sucursales.forEach(sucursal => sucursal.classList.remove('active'));

        // Add active class to current
        if (slides[currentIndex]) slides[currentIndex].classList.add('active');
        if (sucursales[currentIndex]) sucursales[currentIndex].classList.add('active');
    }

    /**
     * Starts the auto-rotation timer.
     */
    function startTimer() {
        stopTimer(); // Ensure no duplicates
        intervalId = setInterval(() => {
            showSlide(currentIndex + 1);
        }, intervalTime);
    }

    /**
     * Stops the auto-rotation timer.
     */
    function stopTimer() {
        if (intervalId) {
            clearInterval(intervalId);
            intervalId = null;
        }
    }

    // Add click events to sucursales to switch manually
    sucursales.forEach((sucursal, index) => {
        sucursal.addEventListener('click', () => {
            stopTimer();
            showSlide(index);
            startTimer(); // Restart timer after manual interaction
        });

        // Add hover effect pause? Optional, but often nice.
        // Let's keep it simple: clicking sets it.
    });

    // Initialize
    // Ensure the first one is active matches logic (HTML might already have it, but good to enforce)
    showSlide(0);
    startTimer();
});
