/**
 * @fileoverview Maneja el slideshow automático de imágenes.
 * Controla la transición entre slides y los indicadores de navegación.
 */

// Obtener referencias a los elementos del slideshow
const slideshow = document.getElementById('slideshow');
const slides = document.getElementById('slides');
const indicadores = document.getElementById('indicadores');
const btnCambiar = document.getElementById('cambiar');
let slideActual = 1;

if (slideshow && slides && indicadores) {
  /**
   * Función para pasar al siguiente slide
   */
  const siguienteSlide = () => {
      const primerSlide = slides.children[0];
      const ancho = primerSlide.offsetWidth;
      const velocidad = 400;
      
      // Aplicar transición para mover el slide
      slides.style.transition = `ease-out ${velocidad}ms all`;
      slides.style.transform = `translateX(-${ancho}px)`;
  
      setTimeout(() => {
          // Mover el primer slide al final y resetear la transición
          slides.appendChild(primerSlide);
          slides.style.transition = 'none';
          slides.style.transform = 'translateX(0)';
      }, velocidad);
  
      // Actualizar indicadores
      if(slideActual < slides.children.length){
         slideActual++;
      } else {
          slideActual = 1;
      }
      indicadores.querySelector('.active').classList.remove('active');
      indicadores.children[slideActual -1].classList.add('active');
  }
  
  // Iniciar el slideshow automático cada 3 segundos
  setInterval(() => {
      siguienteSlide();
  }, 3000);
}
