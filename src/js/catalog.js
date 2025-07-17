const API_URL = 'https://nt-backapis.onrender.com/routes/productos';

const grid = document.getElementById('productos-grid');
const filtroMarca = document.getElementById('marca');
const filtroProposito = document.getElementById('proposito');

async function obtenerProductos() {
  const res = await fetch(API_URL);
  return res.json();
}

function llenarFiltros(productos) {
  const marcas = new Set();
  const propositos = new Set();

  productos.forEach(p => {
    marcas.add(p.marca);
    propositos.add(p.proposito);
  });

  [...marcas].forEach(m => {
    const option = document.createElement('option');
    option.value = m;
    option.textContent = m;
    filtroMarca.appendChild(option);
  });

  [...propositos].forEach(p => {
    const option = document.createElement('option');
    option.value = p;
    option.textContent = p;
    filtroProposito.appendChild(option);
  });
}

function mostrarProductos(productos) {
  grid.innerHTML = '';
  productos.forEach(p => {
    const card = document.createElement('div');
    card.className = 'producto';
    card.innerHTML = `
      <img src="${p.imagen_base64}" alt="${p.nombre}" />
      <h3>${p.nombre}</h3>
      <p>Marca: ${p.marca}</p>
      <p>Propósito: ${p.proposito}</p>
    `;
    grid.appendChild(card);
  });
}

function filtrar(productos) {
  const marca = filtroMarca.value;
  const proposito = filtroProposito.value;

  const filtrados = productos.filter(p =>
    (marca === '' || p.marca === marca) &&
    (proposito === '' || p.proposito === proposito)
  );

  mostrarProductos(filtrados);
}

document.addEventListener('DOMContentLoaded', async () => {
  const productos = await obtenerProductos();
  llenarFiltros(productos);
  mostrarProductos(productos);

  filtroMarca.addEventListener('change', () => filtrar(productos));
  filtroProposito.addEventListener('change', () => filtrar(productos));
});
