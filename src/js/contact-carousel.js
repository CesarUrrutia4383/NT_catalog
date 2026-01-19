/**
 * @fileoverview Lógica para el carrusel de la página de contacto.
 * Maneja la rotación automática de las imágenes de las sucursales y su sincronización con la lista de información.
 */

// Encapsular en una función para ejecutar cuando el DOM esté listo
function initContactCarousel() {
    const carruselContainer = document.querySelector('.sucursales-carrusel');
    // Salir si no estamos en la página de contacto o si falta la estructura del carrusel
    if (!carruselContainer) {
        return;
    }

    const slides = Array.from(document.querySelectorAll('.carrusel-slide'));
    const sucursales = Array.from(document.querySelectorAll('.sucursal'));

    if (slides.length === 0 || sucursales.length === 0) {
        console.warn('Lógica del carrusel: No se encontraron elementos slides o sucursales.');
        return;
    }

    let currentIndex = 0;
    let intervalId;
    const intervalTime = 4000; // 4 segundos

    /**
     * Activa el slide y la información de la sucursal en el índice dado.
     * @param {number} index - Índice del slide a mostrar.
     */
    function showSlide(index) {
        // Normalizar índice
        if (index >= slides.length) index = 0;
        if (index < 0) index = slides.length - 1;

        currentIndex = index;

        // Eliminar clase active de todos y forzar estilos en línea
        // Esto asegura que la visibilidad y el z-index sean correctos independientemente de especificidad CSS o conflictos
        slides.forEach(slide => {
            slide.classList.remove('active');
            slide.style.opacity = '0';
            slide.style.zIndex = '0';
            slide.style.pointerEvents = 'none'; // Evitar clics en slides invisibles
            slide.style.transition = 'opacity 0.5s ease-in-out';
            slide.style.position = 'absolute'; // Asegurar posición absoluta
            slide.style.top = '0';
            slide.style.left = '0';
            slide.style.width = '100%';
            slide.style.height = '100%';
        });
        sucursales.forEach(sucursal => sucursal.classList.remove('active'));

        // Agregar clase active al actual y forzar estilos visibles
        if (slides[currentIndex]) {
            slides[currentIndex].classList.add('active');
            slides[currentIndex].style.opacity = '1';
            slides[currentIndex].style.zIndex = '10';
            slides[currentIndex].style.pointerEvents = 'auto';
        }
        if (sucursales[currentIndex]) sucursales[currentIndex].classList.add('active');
    }

    /**
     * Inicia el temporizador de rotación automática.
     */
    function startTimer() {
        stopTimer(); // Asegurar que no haya duplicados
        intervalId = setInterval(() => {
            showSlide(currentIndex + 1);
        }, intervalTime);
    }

    /**
     * Detiene el temporizador de rotación automática.
     */
    function stopTimer() {
        if (intervalId) {
            clearInterval(intervalId);
            intervalId = null;
        }
    }

    // Agregar eventos de clic a las sucursales para cambiar manualmente
    sucursales.forEach((sucursal, index) => {
        sucursal.addEventListener('click', () => {
            stopTimer();
            showSlide(index);
            startTimer(); // Reiniciar temporizador después de interacción manual
        });
    });

    // Verificar cuál está activo actualmente en HTML para establecer el estado inicial correctamente
    const initialActive = slides.findIndex(s => s.classList.contains('active'));
    currentIndex = initialActive >= 0 ? initialActive : 0;

    // Forzar consistencia del estado inicial
    showSlide(currentIndex);
    startTimer();
}

// Ejecutar función init cuando el DOM esté listo, cubriendo estados de carga y ya cargado
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initContactCarousel);
} else {
    initContactCarousel();
}
