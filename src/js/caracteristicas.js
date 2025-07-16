const previews = document.getElementById('previews');
const tabs = document.getElementById('tabs');

let currentIndex = 0;
const tabsList = Array.from(tabs.querySelectorAll('.tab'));
const previewsList = Array.from(previews.querySelectorAll('.thumb'));

function setActiveTab(index) {
  // Limpiar activo anterior
  tabs.querySelector('.active').classList.remove('active');
  previews.querySelector('.active').classList.remove('active');

  // Activar nuevo
  tabsList[index].classList.add('active');
  previewsList[index].classList.add('active');

  currentIndex = index;
}

// Cambia la pestaña automáticamente cada 5 segundos
let autoChange = setInterval(() => {
  let nextIndex = (currentIndex + 1) % tabsList.length;
  setActiveTab(nextIndex);
}, 5000);

// Selección manual con click
tabs.addEventListener('click', (e) => {
  e.preventDefault();

  const selectedTab = e.target.closest('.tab');
  if (selectedTab) {
    const index = tabsList.indexOf(selectedTab);
    if (index !== -1) {
      setActiveTab(index);

      // Reiniciar el intervalo para que no se cambie justo después de un clic
      clearInterval(autoChange);
      autoChange = setInterval(() => {
        let nextIndex = (currentIndex + 1) % tabsList.length;
        setActiveTab(nextIndex);
      }, 5000);
    }
  }
});
