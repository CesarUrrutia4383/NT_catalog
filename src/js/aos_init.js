/**
 * @fileoverview Este archivo inicializa la librería AOS.
 * @see https://github.com/michalsnik/aos
 */

import AOS from 'aos';
import 'aos/dist/aos.css';

/**
 * @description Inicializa la librería AOS con una duración de 1000ms y ejecuta la animación solo una vez.
 */
AOS.init({
  duration: 1000,
  once: false,
  mirror: false
});
