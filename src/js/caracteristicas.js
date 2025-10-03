/**
 * @fileoverview Contiene la lógica para la sección de características en la página principal.
 * Maneja las pestañas y el cambio automático de la pestaña activa.
 */

const previews = document.getElementById('previews');
const tabs = document.getElementById('tabs');

if (previews && tabs) {
  let currentIndex = 0;
  const tabsList = Array.from(tabs.querySelectorAll('.tab'));
  const previewsList = Array.from(previews.querySelectorAll('.thumb'));

  /**
   * @description Establece la pestaña y preview activos.
   * @param {number} index - Índice de la pestaña a activar.
   */
  function setActiveTab(index) {
    if(index === currentIndex) return; // evita repetir

    // Animar previews: quitar active suavemente
    previewsList[currentIndex].classList.remove('active');
    // Poner active al siguiente con delay mínimo para transición
    setTimeout(() => previewsList[index].classList.add('active'), 50);

    // Tabs: cambiar clases activo/inactivo
    tabsList[currentIndex].classList.remove('active');
    tabsList[index].classList.add('active');

    currentIndex = index;
  }

  /**
   * @description Cambia automáticamente la pestaña activa cada 5 segundos.
   */
  let autoChange = setInterval(() => {
    let nextIndex = (currentIndex + 1) % tabsList.length;
    setActiveTab(nextIndex);
  }, 5000);

  /**
   * @description Maneja el evento click en las pestañas.
   * Cuando se hace click en una pestaña, esta se activa y se reinicia el cambio automático.
   * @param {Event} e - Evento click.
   */
  tabs.addEventListener('click', (e) => {
    e.preventDefault();
    const selectedTab = e.target.closest('.tab');
    if (selectedTab) {
      const index = tabsList.indexOf(selectedTab);
      if (index !== -1) {
        setActiveTab(index);
        clearInterval(autoChange);
        autoChange = setInterval(() => {
          let nextIndex = (currentIndex + 1) % tabsList.length;
          setActiveTab(nextIndex);
        }, 5000);
      }
    }
  });
}
