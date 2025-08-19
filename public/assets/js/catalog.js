const API_URL = import.meta.env.VITE_API_URL;
const grid = document.getElementById('productos-grid');
const filtroMarca = document.getElementById('marca');
const filtroProposito = document.getElementById('proposito');
const cantidadProductos = document.getElementById('cantidad');
const loader = document.getElementById('loader');
const btnVerCarrito = document.getElementById('ver-carrito');
const modalCarrito = document.getElementById('modal-carrito');
const cerrarModalCarrito = document.getElementById('cerrar-modal-carrito');
const carritoListado = document.getElementById('carrito-listado');
const btnCotizarPDF = document.getElementById('cotizar-pdf');
const carritoCantidad = document.getElementById('carrito-cantidad');

import AOS from 'aos';
import 'aos/dist/aos.css';
AOS.init({ duration: 600, once: false });

function isValidCloudinaryUrl(url) {
  if (!url) return false;
  const cloudinaryPattern = /^https:\/\/res\.cloudinary\.com\/[^\/]+\/image\/upload\/.*$/;
  return cloudinaryPattern.test(url);
}

function getImageUrl(producto) {
  if (producto.imagen_url && isValidCloudinaryUrl(producto.imagen_url)) {
    return producto.imagen_url;
  } else {
    return '/assets/img/logo3.png';
  }
}

function openModal(modal) {
  modal.style.display = 'flex';
  modal.classList.remove('fade-out');
  modal.classList.add('fade-in');
  if (window.AOS) setTimeout(() => AOS.refreshHard(), 10);
}

function closeModal(modal) {
  modal.classList.remove('fade-in');
  modal.classList.add('fade-out');
  setTimeout(() => { modal.style.display = 'none'; if (window.AOS) AOS.refreshHard(); }, 350);
}

async function obtenerProductos() {
  try {
    const res = await fetch(import.meta.env.VITE_API_URL);
    if (!res.ok) throw new Error('No se pudo obtener productos');
    return await res.json();
  } catch (e) {
    showToast('Error al obtener productos');
    return [];
  }
}

let marcasYPropositos = {};

function llenarFiltros(productos) {
  const marcas = new Set();
  const propositos = new Set();
  marcasYPropositos = {};

  productos.forEach(p => {
    marcas.add(p.marca);
    propositos.add(p.proposito);
    if (!marcasYPropositos[p.marca]) {
      marcasYPropositos[p.marca] = new Set();
    }
    marcasYPropositos[p.marca].add(p.proposito);
  });

  filtroMarca.innerHTML = '<option value="">Todas las marcas</option>';
  [...marcas].sort().forEach(m => {
    const option = document.createElement('option');
    option.value = m;
    option.textContent = m;
    filtroMarca.appendChild(option);
  });

  actualizarFiltroProposito();
}

function actualizarFiltroProposito() {
  const marcaSeleccionada = filtroMarca.value;
  const propositoSeleccionado = filtroProposito.value;
  
  filtroProposito.innerHTML = '<option value="">Todos los propósitos</option>';
  
  let propositosDisponibles = new Set();
  if (marcaSeleccionada && marcasYPropositos[marcaSeleccionada]) {
    propositosDisponibles = marcasYPropositos[marcaSeleccionada];
  } else {
    // Si no hay marca seleccionada, mostrar todos los propósitos
    Object.values(marcasYPropositos).forEach(set => {
      set.forEach(p => propositosDisponibles.add(p));
    });
  }

  [...propositosDisponibles].sort().forEach(p => {
    const option = document.createElement('option');
    option.value = p;
    option.textContent = p;
    filtroProposito.appendChild(option);
  });

  // Restaurar selección si es posible
  if ([...propositosDisponibles].some(p => p === propositoSeleccionado)) {
    filtroProposito.value = propositoSeleccionado;
  }
}


function mostrarProductos(productos) {
  grid.innerHTML = ''; // Limpiar la cuadrícula
  productos.forEach(p => {
    const card = document.createElement('div');
    card.className = 'producto';
    card.dataset.productId = p.id;
    const imagen = getImageUrl(p);
    card.innerHTML = `
      <img src="${imagen}" alt="${p.nombre_producto || p.nombre}"
           onerror="this.src='/assets/img/logo3.png';" />
      <h3>${p.nombre_producto || p.nombre}</h3>
      <p><b>Marca:</b> ${p.marca}</p>
    `;
    card.addEventListener('click', () => mostrarModalProducto(p));
    grid.appendChild(card);
  });
  AOS.refresh();
}

const modal = document.getElementById('modal-producto');
const modalInfo = document.getElementById('modal-info');
const cerrarModal = document.getElementById('cerrar-modal');
let productoActual = null;
let carrito = [];

function mostrarModalProducto(producto) {
  productoActual = producto;
  const imagen = getImageUrl(producto);
  modalInfo.innerHTML = `
    <div class="modal-producto-layout">
      <div class="modal-producto-imagen">
        <img src="${imagen}" alt="${producto.nombre_producto || producto.nombre}" 
             onerror="this.src='/assets/img/logo3.png';" />
      </div>
      <div class="modal-producto-info">
        <h3>${producto.nombre_producto || producto.nombre}</h3>
        <div class="info-item"><span class="info-label">Marca:</span><span class="info-value">${producto.marca}</span></div>
        <div class="info-item"><span class="info-label">Propósito:</span><span class="info-value">${producto.proposito}</span></div>
        ${producto.info ? `<div class="info-item info-descripcion"><span class="info-label">Descripción:</span><span class="info-value">${producto.info}</span></div>` : ''}
      </div>
    </div>
  `;
  const acciones = modalInfo.parentElement.querySelector('.modal-acciones');
  acciones.innerHTML = `
    <div class="cantidad-control">
      <button type="button" class="cantidad-btn" id="btn-restar">-</button>
      <input type="number" id="modal-cantidad" min="1" value="1" max="${producto.existencias || 99}" />
      <button type="button" class="cantidad-btn" id="btn-sumar">+</button>
    </div>
    <button id="agregar-carrito">Agregar al carrito</button>
  `;
  document.getElementById('btn-restar').onclick = () => {
    const input = document.getElementById('modal-cantidad');
    if (input.value > 1) input.value--;
  };
  document.getElementById('btn-sumar').onclick = () => {
    const input = document.getElementById('modal-cantidad');
    if (input.value < (producto.existencias || 99)) input.value++;
  };
  document.getElementById('agregar-carrito').onclick = () => {
    const cantidad = parseInt(document.getElementById('modal-cantidad').value, 10);
    if (!productoActual || isNaN(cantidad) || cantidad < 1) return;
    if (cantidad > (productoActual.existencias || 99)) {
      showToast('No hay suficientes unidades disponibles.');
      return;
    }
    const idx = carrito.findIndex(item => item.id === productoActual.id);
    if (idx > -1) {
      carrito[idx].cantidad += cantidad;
    } else {
      carrito.push({ ...productoActual, cantidad });
    }
    closeModal(modal);
    actualizarCarritoCantidad();
    guardarCarrito();
    mostrarNotificacionProducto(productoActual, cantidad);
  };
  openModal(modal);
}

cerrarModal.addEventListener('click', () => closeModal(modal));
window.addEventListener('click', (e) => {
  if (e.target === modal) closeModal(modal);
});

function actualizarCarritoCantidad() {
  carritoCantidad.textContent = carrito.reduce((sum, item) => sum + item.cantidad, 0);
}

function mostrarCarrito() {
  if (carrito.length === 0) {
    carritoListado.innerHTML = '<p>El carrito está vacío.</p>';
  } else {
    let tabla = `<div class="carrito-table-responsive"><table class="carrito-table"><thead><tr><th>Producto</th><th>Marca</th><th>Propósito</th><th>Cantidad</th><th>Eliminar</th></tr></thead><tbody>`;
    tabla += carrito.map((item, idx) => `
      <tr>
        <td class="carrito-td-producto">${item.nombre_producto || item.nombre}</td>
        <td class="carrito-td-marca">${item.marca}</td>
        <td class="carrito-td-proposito">${item.proposito}</td>
        <td class="carrito-td-cantidad">
          <div class="carrito-cantidad-control">
            <button class="restar-cantidad" data-idx="${idx}">-</button>
            <input type="number" class="input-cantidad" data-idx="${idx}" min="1" max="${item.existencias || 99}" value="${item.cantidad}" />
            <button class="sumar-cantidad" data-idx="${idx}">+</button>
          </div>
        </td>
        <td class="carrito-td-eliminar"><button class="eliminar-producto" data-idx="${idx}">🗑️</button></td>
      </tr>
    `).join('');
    tabla += '</tbody></table></div>';
    carritoListado.innerHTML = tabla;
    
    // Event listeners for cart actions
    carritoListado.querySelectorAll('.restar-cantidad').forEach(btn => {
      btn.onclick = () => {
        const idx = btn.dataset.idx;
        if (carrito[idx].cantidad > 1) {
          carrito[idx].cantidad--;
          guardarCarrito();
          mostrarCarrito();
          actualizarCarritoCantidad();
        }
      };
    });
    carritoListado.querySelectorAll('.sumar-cantidad').forEach(btn => {
      btn.onclick = () => {
        const idx = btn.dataset.idx;
        if (carrito[idx].cantidad < (carrito[idx].existencias || 99)) {
          carrito[idx].cantidad++;
          guardarCarrito();
          mostrarCarrito();
          actualizarCarritoCantidad();
        }
      };
    });
    carritoListado.querySelectorAll('.input-cantidad').forEach(input => {
      input.onchange = () => {
        const idx = input.dataset.idx;
        let val = parseInt(input.value, 10);
        if (isNaN(val) || val < 1) val = 1;
        if (val > (carrito[idx].existencias || 99)) val = carrito[idx].existencias || 99;
        carrito[idx].cantidad = val;
        guardarCarrito();
        mostrarCarrito();
        actualizarCarritoCantidad();
      };
    });
    carritoListado.querySelectorAll('.eliminar-producto').forEach(btn => {
      btn.onclick = () => {
        carrito.splice(btn.dataset.idx, 1);
        actualizarCarritoCantidad();
        guardarCarrito();
        mostrarCarrito();
      };
    });
  }
  actualizarBotonCotizar();
  validarCamposCotizacion();
  openModal(modalCarrito);
}

function actualizarBotonCotizar() {
  const btn = document.getElementById('cotizar-pdf');
  btn.disabled = carrito.length === 0;
  btn.style.opacity = carrito.length === 0 ? '0.6' : '1';
  btn.style.cursor = carrito.length === 0 ? 'not-allowed' : 'pointer';
}

btnVerCarrito.addEventListener('click', mostrarCarrito);
cerrarModalCarrito.addEventListener('click', () => closeModal(modalCarrito));
window.addEventListener('click', (e) => {
  if (e.target === modalCarrito) closeModal(modalCarrito);
});

function guardarCarrito() {
  localStorage.setItem('carrito', JSON.stringify(carrito));
}

function cargarCarrito() {
  const data = localStorage.getItem('carrito');
  if (data) {
    try {
      carrito = JSON.parse(data);
    } catch (e) {
      carrito = [];
    }
  }
}

function filtrarYGuardar(productos) {
  const marca = filtroMarca.value;
  const proposito = filtroProposito.value;

  localStorage.setItem('filtroMarca', marca);
  localStorage.setItem('filtroProposito', proposito);

  const filtrados = productos.filter(p =>
    (marca === '' || p.marca === marca) &&
    (proposito === '' || p.proposito === proposito)
  );

  mostrarProductos(filtrados);
}

document.addEventListener('DOMContentLoaded', async () => {
  loader.style.display = 'block';
  grid.style.display = 'none';
  
  cargarCarrito();
  actualizarCarritoCantidad();
  
  const productos = await obtenerProductos();
  llenarFiltros(productos);

  const savedMarca = localStorage.getItem('filtroMarca');
  const savedProposito = localStorage.getItem('filtroProposito');

  if (savedMarca) {
    filtroMarca.value = savedMarca;
    actualizarFiltroProposito(); // Actualizar propósitos según la marca guardada
  }
  if (savedProposito) {
    filtroProposito.value = savedProposito;
  }

  filtrarYGuardar(productos);
  
  loader.style.display = 'none';
  grid.style.display = '';

  filtroMarca.addEventListener('change', () => {
    actualizarFiltroProposito();
    filtrarYGuardar(productos);
  });
  filtroProposito.addEventListener('change', () => filtrarYGuardar(productos));
});

function showToast(msg, duration = 3000) {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = msg;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(-30px) scale(0.95)';
    setTimeout(() => container.removeChild(toast), 400);
  }, duration);
}

function mostrarNotificacionProducto(producto, cantidad) {
  let notificacion = document.querySelector('.notificacion-carrito');
  if (!notificacion) {
    notificacion = document.createElement('div');
    notificacion.className = 'notificacion-carrito';
    document.body.appendChild(notificacion);
  }
  notificacion.innerHTML = `
    <div class="icono">✅</div>
    <div class="texto">¡${cantidad} ${cantidad === 1 ? 'unidad' : 'unidades'} de "${producto.nombre_producto || producto.nombre}" agregada${cantidad === 1 ? '' : 's'} al carrito!</div>
  `;
  notificacion.classList.add('mostrar');
  setTimeout(() => notificacion.classList.remove('mostrar'), 3000);
}

// Resto de la lógica de cotización...
const telefonoInput = document.getElementById('telefono-cliente');
const codigoPais = document.getElementById('codigo-pais');
const longitudesTelefono = { '52': 10, '1': 10, '54': 10, '57': 10, '34': 9, '55': 11, '56': 9, '591': 8, '507': 8, '593': 9 };

function actualizarMaxlength() {
  if(codigoPais && telefonoInput) {
    telefonoInput.maxLength = longitudesTelefono[codigoPais.value] || 15;
  }
}

if(telefonoInput) {
  telefonoInput.addEventListener('input', () => {
    telefonoInput.value = telefonoInput.value.replace(/\D/g, '');
  });
}

if(codigoPais) {
  codigoPais.addEventListener('change', () => {
    if(telefonoInput) telefonoInput.value = '';
    actualizarMaxlength();
    validarCamposCotizacion();
  });
}

function validarCamposCotizacion() {
  const nombreInput = document.getElementById('nombre-cliente');
  const btn = document.getElementById('cotizar-pdf');
  if(!nombreInput || !btn || !codigoPais || !telefonoInput) return;

  const nombreValido = nombreInput.value.trim().length > 0;
  const telefono = telefonoInput.value.trim();
  const longitudRequerida = longitudesTelefono[codigoPais.value] || 10;
  const telefonoValido = telefono.length === longitudRequerida;

  if (nombreValido && telefonoValido && carrito.length > 0) {
    btn.disabled = false;
    btn.style.opacity = '1';
    btn.style.cursor = 'pointer';
  } else {
    btn.disabled = true;
    btn.style.opacity = '0.6';
    btn.style.cursor = 'not-allowed';
  }
}

['input', 'change'].forEach(evt => {
  const nombreCliente = document.getElementById('nombre-cliente');
  const telefonoCliente = document.getElementById('telefono-cliente');
  if(nombreCliente) nombreCliente.addEventListener(evt, validarCamposCotizacion);
  if(telefonoCliente) telefonoCliente.addEventListener(evt, validarCamposCotizacion);
  if(codigoPais) codigoPais.addEventListener(evt, validarCamposCotizacion);
});

btnCotizarPDF.addEventListener('click', async (e) => {
  // ... (lógica de cotización existente)
});

// Actualización automática del catálogo
setInterval(async () => {
  const productos = await obtenerProductos();
  llenarFiltros(productos);
  filtrarYGuardar(productos);
}, 30000);
