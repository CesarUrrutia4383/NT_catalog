const previews = document.getElementById('previews');
const tabs = document.getElementById('tabs');

let currentIndex = 0;
const tabsList = Array.from(tabs.querySelectorAll('.tab'));
const previewsList = Array.from(previews.querySelectorAll('.thumb'));

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

let autoChange = setInterval(() => {
  let nextIndex = (currentIndex + 1) % tabsList.length;
  setActiveTab(nextIndex);
}, 5000);

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
