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
// Eliminar importación de jsPDF y logoBase64
// import jsPDF from 'jspdf';
// const logoBase64 = undefined;

// Inicializar AOS
import AOS from 'aos';
import 'aos/dist/aos.css';
AOS.init({ duration: 600, once: false });

// Función para validar URLs de Cloudinary
function isValidCloudinaryUrl(url) {
  if (!url) return false;
  
  // Verificar si es una URL válida de Cloudinary
  const cloudinaryPattern = /^https:\/\/res\.cloudinary\.com\/[^\/]+\/image\/upload\/.*$/;
  return cloudinaryPattern.test(url);
}

// Función para obtener imagen con fallback
function getImageUrl(producto) {
  if (producto.imagen_url && isValidCloudinaryUrl(producto.imagen_url)) {
    console.log('Usando URL de Cloudinary:', producto.imagen_url);
    return producto.imagen_url;
  } else {
    console.log('Usando imagen por defecto para:', producto.nombre_producto || producto.nombre);
    return '/assets/img/logo3.png';
  }
}

// Refrescar AOS tras mostrar/ocultar modales
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
  const existingProductCards = Array.from(grid.children);
  const newProductIds = new Set(productos.map(p => p.id)); // Asume que cada producto tiene un 'id' único

  // Eliminar productos que ya no existen en la nueva lista
  existingProductCards.forEach(card => {
    const productId = card.dataset.productId;
    if (productId && !newProductIds.has(productId)) {
      grid.removeChild(card);
    }
  });

  // Crear o actualizar productos
  productos.forEach(p => {
    let card = grid.querySelector(`[data-product-id="${p.id}"]`);

    if (card) {
      // Actualizar contenido de la tarjeta existente
      const imagen = getImageUrl(p);
      const newInnerHTML = `
        <img src="${imagen}" alt="${p.nombre_producto || p.nombre}"
             onerror="this.src='/assets/img/logo3.png'; console.log('Error cargando imagen:', this.src);" />
        <h3>${p.nombre_producto || p.nombre}</h3>
        <p><b>Marca:</b> ${p.marca}</p>
      `;
      // Solo actualizar innerHTML si el contenido ha cambiado para evitar redibujados innecesarios
      if (card.innerHTML.trim() !== newInnerHTML.trim()) {
        card.innerHTML = newInnerHTML;
      }
      // Asegurarse de que el event listener siga funcionando (aunque ya debería estar)
      card.onclick = () => mostrarModalProducto(p);
    } else {
      // Crear nueva tarjeta si no existe
      card = document.createElement('div');
      card.className = 'producto';
      card.dataset.productId = p.id; // Añadir un data-attribute para identificar el producto
      const imagen = getImageUrl(p);
      card.innerHTML = `
        <img src="${imagen}" alt="${p.nombre_producto || p.nombre}"
             onerror="this.src='/assets/img/logo3.png'; console.log('Error cargando imagen:', this.src);" />
        <h3>${p.nombre_producto || p.nombre}</h3>
        <p><b>Marca:</b> ${p.marca}</p>
      `;
      card.addEventListener('click', () => mostrarModalProducto(p));
      grid.appendChild(card);
    }
  });
}

// Modal y carrito
const modal = document.getElementById('modal-producto');
const modalInfo = document.getElementById('modal-info');
const cerrarModal = document.getElementById('cerrar-modal');
const inputCantidad = document.getElementById('modal-cantidad');
const btnAgregarCarrito = document.getElementById('agregar-carrito');

let productoActual = null;
let carrito = [];

function mostrarModalProducto(producto) {
  productoActual = producto;
  
  // Debug log para el modal
  console.log('Producto en modal:', {
    nombre: producto.nombre_producto || producto.nombre,
    imagen_url: producto.imagen_url,
    tiene_imagen: !!producto.imagen_url,
    es_url_valida: isValidCloudinaryUrl(producto.imagen_url)
  });
  
  const imagen = getImageUrl(producto);
  modalInfo.innerHTML = `
    <div class="modal-producto-layout">
      <div class="modal-producto-imagen">
        <img src="${imagen}" alt="${producto.nombre_producto || producto.nombre}" 
             onerror="this.src='/assets/img/logo3.png'; console.log('Error cargando imagen en modal:', this.src);" />
      </div>
      <div class="modal-producto-info">
        <h3>${producto.nombre_producto || producto.nombre}</h3>
        
        <div class="info-item">
          <span class="info-label">Marca:</span>
          <span class="info-value">${producto.marca}</span>
        </div>
        
        <div class="info-item">
          <span class="info-label">Propósito:</span>
          <span class="info-value">${producto.proposito}</span>
        </div>
        
        ${producto.info ? `
        <div class="info-item info-descripcion">
          <span class="info-label">Descripción:</span>
          <span class="info-value">${producto.info}</span>
        </div>
        ` : ''}
      </div>
    </div>
  `;
  // Generar controles de cantidad y botón
  const acciones = modalInfo.parentElement.querySelector('.modal-acciones');
  acciones.innerHTML = `
    <div class="cantidad-control" id="cantidad-control">
      <button type="button" class="cantidad-btn" id="btn-restar">-</button>
      <input type="number" id="modal-cantidad" min="1" value="1" max="${producto.existencias || producto.cantidad}" />
      <button type="button" class="cantidad-btn" id="btn-sumar">+</button>
    </div>
    <button id="agregar-carrito">Agregar al carrito</button>
  `;
  // Asignar eventos a los controles
  document.getElementById('btn-restar').onclick = () => {
    const input = document.getElementById('modal-cantidad');
    let val = parseInt(input.value, 10) || 1;
    if (val > 1) input.value = val - 1;
  };
  document.getElementById('btn-sumar').onclick = () => {
    const input = document.getElementById('modal-cantidad');
    let val = parseInt(input.value, 10) || 1;
    if (val < (producto.existencias || producto.cantidad)) input.value = val + 1;
  };
  document.getElementById('agregar-carrito').onclick = () => {
    const cantidad = parseInt(document.getElementById('modal-cantidad').value, 10);
    if (!productoActual || isNaN(cantidad) || cantidad < 1) return;
    if (cantidad > (productoActual.existencias || productoActual.cantidad)) {
      showToast('No hay suficientes unidades disponibles.');
      return;
    }
    // Buscar si ya está en el carrito
    const idx = carrito.findIndex(item => item.id === productoActual.id);
    if (idx > -1) {
      carrito[idx].cantidad += cantidad;
    } else {
      const nuevoItem = { 
        ...productoActual, 
        cantidad,
        stock_disponible: productoActual.existencias || productoActual.cantidad || productoActual.cantidad_disponible || 0
      };
      console.log('Agregando producto al carrito:', nuevoItem);
      carrito.push(nuevoItem);
    }
    closeModal(modal);
    actualizarCarritoCantidad();
    guardarCarrito();
    mostrarNotificacionProducto(productoActual, cantidad);
  };
  modal.style.display = 'flex';
}

cerrarModal.addEventListener('click', () => {
  modal.style.display = 'none';
});

window.addEventListener('click', (e) => {
  if (e.target === modal) modal.style.display = 'none';
});

btnAgregarCarrito.addEventListener('click', () => {
  const cantidad = parseInt(inputCantidad.value, 10);
  if (!productoActual || isNaN(cantidad) || cantidad < 1) return;
      if (cantidad > (productoActual.existencias || productoActual.cantidad)) {
    showToast('No hay suficientes unidades disponibles.');
    return;
  }
  // Buscar si ya está en el carrito
  const idx = carrito.findIndex(item => item.id === productoActual.id);
  if (idx > -1) {
    carrito[idx].cantidad += cantidad;
  } else {
    const nuevoItem = { 
      ...productoActual, 
      cantidad,
      stock_disponible: productoActual.existencias || productoActual.cantidad || productoActual.cantidad_disponible || 0
    };
    console.log('Agregando producto al carrito (btn):', nuevoItem);
    carrito.push(nuevoItem);
  }
  modal.style.display = 'none';
  actualizarCarritoCantidad();
  guardarCarrito();
  mostrarNotificacionProducto(productoActual, cantidad);
});

function actualizarCarritoCantidad() {
  const total = carrito.reduce((sum, item) => sum + item.cantidad, 0);
  carritoCantidad.textContent = total;
}

function mostrarCarrito() {
  if (carrito.length === 0) {
    carritoListado.innerHTML = '<p>El carrito está vacío.</p>';
  } else {
    let tabla = `<div class="carrito-table-responsive"><table class="carrito-table"><thead><tr><th>Producto</th><th>Marca</th><th>Propósito</th><th>Cantidad</th><th>Eliminar</th></tr></thead><tbody>`;
    tabla += carrito.map((item, idx) => `
      <tr>
        <td class="carrito-td-producto">
          ${item.nombre_producto || item.nombre}
        </td>
        <td class="carrito-td-marca">${item.marca}</td>
        <td class="carrito-td-proposito">${item.proposito}</td>
        <td class="carrito-td-cantidad">
          <div class="carrito-cantidad-control">
            <button class="restar-cantidad" data-idx="${idx}" aria-label="Restar">-</button>
            <input type="number" class="input-cantidad" data-idx="${idx}" min="1" max="${item.existencias || item.cantidad}" value="${item.cantidad}" />
            <button class="sumar-cantidad" data-idx="${idx}" aria-label="Sumar">+</button>
          </div>
        </td>
        <td class="carrito-td-eliminar"><button class="eliminar-producto" data-idx="${idx}" aria-label="Eliminar">🗑️</button></td>
      </tr>
    `).join('');
    tabla += '</tbody></table></div>';
    carritoListado.innerHTML = tabla;
    // Eventos para editar cantidad y eliminar igual que antes...
    document.querySelectorAll('.restar-cantidad').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.getAttribute('data-idx'), 10);
        if (carrito[idx].cantidad > 1) {
          carrito[idx].cantidad--;
          guardarCarrito();
          mostrarCarrito();
          actualizarCarritoCantidad();
        }
      });
    });
    document.querySelectorAll('.sumar-cantidad').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.getAttribute('data-idx'), 10);
        const max = carrito[idx].stock_disponible || carrito[idx].existencias || carrito[idx].cantidad_disponible || 99;
        if (carrito[idx].cantidad < max) {
          carrito[idx].cantidad++;
          guardarCarrito();
          mostrarCarrito();
          actualizarCarritoCantidad();
        }
      });
    });
    document.querySelectorAll('.input-cantidad').forEach(input => {
      input.addEventListener('change', () => {
        const idx = parseInt(input.getAttribute('data-idx'), 10);
        let val = parseInt(input.value, 10);
        if (isNaN(val) || val < 1) val = 1;
        const max = carrito[idx].stock_disponible || carrito[idx].existencias || carrito[idx].cantidad_disponible || 99;
        if (val > max) val = max;
        carrito[idx].cantidad = val;
        guardarCarrito();
        mostrarCarrito();
        actualizarCarritoCantidad();
      });
    });
    document.querySelectorAll('.eliminar-producto').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.getAttribute('data-idx'), 10);
        carrito.splice(idx, 1);
        actualizarCarritoCantidad();
        guardarCarrito();
        mostrarCarrito();
      });
    });
  }
  actualizarBotonCotizar();
  validarCamposCotizacion();
  openModal(modalCarrito);
}

function actualizarBotonCotizar() {
  const btn = document.getElementById('cotizar-pdf');
  if (!carrito || carrito.length === 0) {
    btn.disabled = true;
    btn.style.opacity = '0.6';
    btn.style.cursor = 'not-allowed';
  } else {
    btn.disabled = false;
    btn.style.opacity = '1';
    btn.style.cursor = 'pointer';
  }
}

// Al abrir el modal del carrito, si el input de teléfono está vacío, poner el combo en México y el input vacío
btnVerCarrito.addEventListener('click', () => {
  mostrarCarrito();
  const codigoPais = document.getElementById('codigo-pais');
  const telefonoInput = document.getElementById('telefono-cliente');
  if (codigoPais) codigoPais.value = '52';
  if (telefonoInput) telefonoInput.value = '';
  modalCarrito.classList.add('fade-in');
  setTimeout(() => modalCarrito.classList.remove('fade-in'), 700);
});
cerrarModalCarrito.addEventListener('click', () => {
  modalCarrito.style.display = 'none';
});
window.addEventListener('click', (e) => {
  if (e.target === modalCarrito) modalCarrito.style.display = 'none';
});

// Actualizar contador cada vez que se agrega al carrito
btnAgregarCarrito.addEventListener('click', () => {
  actualizarCarritoCantidad();
});

// Inicializar contador al cargar
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
// Cargar carrito al iniciar
cargarCarrito();
actualizarCarritoCantidad();
actualizarBotonCotizar();

const telefonoInput = document.getElementById('telefono-cliente');
const codigoPais = document.getElementById('codigo-pais');

// Objeto con las longitudes de teléfono por país
const longitudesTelefono = {
  '52': 10, // México
  '1': 10,  // USA/Canadá
  '54': 10, // Argentina
  '57': 10, // Colombia
  '34': 9,  // España
  '55': 11, // Brasil
  '56': 9,  // Chile
  '591': 8, // Bolivia
  '507': 8, // Panamá
  '593': 9  // Ecuador
};

// Función para actualizar el maxlength del teléfono
function actualizarMaxlength() {
  const codigo = codigoPais.value;
  telefonoInput.maxLength = longitudesTelefono[codigo] || 15; // 15 como fallback
}

// Listener para limpiar el input de teléfono (solo números)
telefonoInput.addEventListener('input', () => {
  telefonoInput.value = telefonoInput.value.replace(/\D/g, '');
});

// Listener para cambiar el maxlength al cambiar de país
codigoPais.addEventListener('change', () => {
  telefonoInput.value = ''; // Limpiar el campo al cambiar de país
  actualizarMaxlength();
  validarCamposCotizacion();
});

// Inicializar maxlength al cargar la página
actualizarMaxlength();

function validarCamposCotizacion() {
  const nombreInput = document.getElementById('nombre-cliente');
  const btn = document.getElementById('cotizar-pdf');
  const nombreValido = nombreInput.value.trim().length > 0;
  
  const codigo = codigoPais.value;
  const telefono = telefonoInput.value.trim();
  const longitudRequerida = longitudesTelefono[codigo] || 10;

  const telefonoValido = telefono.length === longitudRequerida;

  if (nombreValido && telefonoValido) {
    btn.disabled = false;
    btn.style.opacity = '1';
    btn.style.cursor = 'pointer';
  } else {
    btn.disabled = true;
    btn.style.opacity = '0.6';
    btn.style.cursor = 'not-allowed';
  }
}

// Validar en tiempo real
['input', 'change'].forEach(evt => {
  document.getElementById('nombre-cliente').addEventListener(evt, validarCamposCotizacion);
  document.getElementById('telefono-cliente').addEventListener(evt, validarCamposCotizacion);
  const codigoPais = document.getElementById('codigo-pais');
  if (codigoPais) codigoPais.addEventListener(evt, validarCamposCotizacion);
});

// Preparar evento para cotizar PDF (implementación siguiente paso)
btnCotizarPDF.addEventListener('click', async (e) => {
  const nombreInput = document.getElementById('nombre-cliente');
  const telefonoInput = document.getElementById('telefono-cliente');
  const codigoPais = document.getElementById('codigo-pais');
  const servicioSelect = document.getElementById('servicio-solicitado');
  const descripcionServicio = document.getElementById('descripcion-servicio');
  const servicio = servicioSelect ? servicioSelect.value : 'venta';
  let telefono = telefonoInput.value.trim().replace(/\D/g, '');
  let codigo = codigoPais ? codigoPais.value : '52';
  
  if (!nombreInput.value.trim() || (codigo === '52' ? telefono.length !== 10 : (telefono.length < 7 || telefono.length > 15))) {
    e.preventDefault();
    validarCamposCotizacion();
    return;
  }
  
  if (!carrito || carrito.length === 0) {
    showToast('No hay productos en el carrito para cotizar.');
    return;
  }
  
  // Validar descripción si es orden de servicio
  let descripcion = '';
  if (servicio === 'servicio') {
    descripcion = descripcionServicio ? descripcionServicio.value.trim() : '';
    if (!descripcion) {
      if (descripcionServicio) {
        descripcionServicio.focus();
        descripcionServicio.style.borderColor = 'red';
        setTimeout(() => descripcionServicio.style.borderColor = '', 1200);
      }
      showToast('Por favor, describe brevemente el servicio que necesitas.');
      return;
    }
  }
  
  const nombreCliente = nombreInput.value.trim();
  const telefonoCliente = `+${codigo} ${telefono}`;
  
  // Definir el destino del correo según el servicio
  let destinoCorreo = [];
  if (servicio === 'venta') destinoCorreo = ['cesar_urrutia_dev4383@proton.me'];
  else if (servicio === 'renta') destinoCorreo = ['cesar_urrutia_dev4383@proton.me'];
  else if (servicio === 'servicio') destinoCorreo = ['cesar_urrutia_dev4383@proton.me'];

  let error = false;
  if (!nombreCliente) {
    nombreInput.focus();
    nombreInput.style.borderColor = 'red';
    setTimeout(() => nombreInput.style.borderColor = '', 1200);
    error = true;
  }
  if ((codigo === '52' && telefono.length !== 10) || (codigo !== '52' && (telefono.length < 7 || telefono.length > 15))) {
    telefonoInput.focus();
    telefonoInput.style.borderColor = 'red';
    setTimeout(() => telefonoInput.style.borderColor = '', 1200);
    error = true;
  }
  if (error) return;
  
  // Verificar disponibilidad de stock
  let disponibilidadOk = true;
  console.log('Verificando disponibilidad del carrito:', carrito);
  for (const item of carrito) {
    const stockDisponible = item.stock_disponible || item.existencias || item.cantidad_disponible || item.cantidad || 0;
    console.log(`Producto: ${item.nombre_producto || item.nombre}, Cantidad solicitada: ${item.cantidad}, Stock disponible: ${stockDisponible}`);
    if (item.cantidad > stockDisponible) {
      console.log('❌ Stock insuficiente');
      disponibilidadOk = false;
      break;
    }
  }
  console.log('Disponibilidad OK:', disponibilidadOk);
  if (!disponibilidadOk) {
    showToast('Uno o más productos no tienen suficiente disponibilidad.');
    return;
  }
  
  // Mostrar PDF generado por el backend en un modal
  try {
    const API_PDF_DOWNLOAD = import.meta.env.VITE_API_PDF_DOWNLOAD;
    const carritoParaEnviar = carrito.map(item => ({
      id: item.id,
      nombre: item.nombre_producto || item.nombre,
      marca: item.marca,
      proposito: item.proposito,
      cantidad: item.cantidad
    }));

    const response = await fetch(`${import.meta.env.VITE_API_PDF_DOWNLOAD}?descargar=1`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ carrito: carritoParaEnviar, nombre: nombreCliente, telefono: telefonoCliente, servicio, destinoCorreo, descripcion })
    });
    if (!response.ok) throw new Error('No se pudo generar el PDF');
    const pdfBlob = await response.blob();
    const url = URL.createObjectURL(pdfBlob);
    const modalPDF = document.getElementById('modal-pdf');
    const iframePDF = document.getElementById('iframe-pdf');
    const btnDescargarPDF = document.getElementById('descargar-pdf');
    iframePDF.src = url;
    openModal(modalPDF);
    btnDescargarPDF.onclick = () => {
      const a = document.createElement('a');
      a.href = url;
      a.download = 'cotizacion.pdf';
      a.click();
    };
    document.getElementById('cerrar-modal-pdf').onclick = () => {
      closeModal(modalPDF);
      iframePDF.src = '';
      URL.revokeObjectURL(url);
    };
    // Después de mostrar el PDF, enviar la cotización por correo
    enviarCotizacionBackend({ carrito: carritoParaEnviar, nombre: nombreCliente, telefono: telefonoCliente, servicio, destinoCorreo, descripcion })
      .then(() => {
        setTimeout(() => {
          showToast('Cotización generada y enviada. La empresa se pondrá en contacto contigo.', 5500);
          // Reiniciar carrito
          carrito = [];
          guardarCarrito();
          actualizarCarritoCantidad();
          mostrarCarrito();
          nombreInput.value = '';
          telefonoInput.value = '';
          if (descripcionServicio) descripcionServicio.value = '';
        }, 300);
      })
      .catch(() => {
        showToast('Error al enviar la cotización. Intenta de nuevo más tarde.');
      });
    closeModal(modalCarrito);
  } catch (err) {
    showToast('No se pudo generar la previsualización del PDF.');
  }
});

function filtrar(productos, actualizarURL = true) {
  const marca = filtroMarca.value;
  const proposito = filtroProposito.value;

  if (actualizarURL) {
    const params = new URLSearchParams(window.location.search);
    if (marca) {
      params.set('marca', marca);
    } else {
      params.delete('marca');
    }
    if (proposito) {
      params.set('proposito', proposito);
    } else {
      params.delete('proposito');
    }
    history.pushState({}, '', `${window.location.pathname}?${params.toString()}`);
  }

  const filtrados = productos.filter(p =>
    (marca === '' || p.marca === marca) &&
    (proposito === '' || p.proposito === proposito)
  );

  mostrarProductos(filtrados);
}

function aplicarFiltrosDesdeURL() {
  const params = new URLSearchParams(window.location.search);
  const marca = params.get('marca');
  const proposito = params.get('proposito');

  if (marca) {
    filtroMarca.value = marca;
  }
  if (proposito) {
    filtroProposito.value = proposito;
  }
}

// Animación fade-in para la página
window.addEventListener('DOMContentLoaded', () => {
  document.body.classList.add('fade-in');
});

function enviarCotizacionBackend({carrito, nombre, telefono, servicio, destinoCorreo, descripcion}) {
  const carritoSimplificado = carrito.map(item => ({ id: item.id, nombre: item.nombre, marca: item.marca, proposito: item.proposito, cantidad: item.cantidad }));
  return fetch(import.meta.env.VITE_API_PDF, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      carrito: carritoSimplificado,
      nombre,
      telefono,
      servicio,
      destinoCorreo,
      descripcion
    })
  });
}

document.addEventListener('DOMContentLoaded', async () => {
  loader.style.display = 'block';
  grid.style.display = 'none';
  const productos = await obtenerProductos();
  llenarFiltros(productos);
  aplicarFiltrosDesdeURL();
  filtrar(productos, false);
  loader.style.display = 'none';
  grid.style.display = '';

  filtroMarca.addEventListener('change', () => filtrar(productos));
  filtroProposito.addEventListener('change', () => filtrar(productos));
});

function showToast(msg, duration = 5500) {
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

// Eliminar todas las referencias y funciones relacionadas con login, logout y administración.
// Eliminar variables:
// const btnLogin, btnLogout, modalLogin, cerrarModalLogin, formLogin, loginError, usuarioAutenticado, verificarRedLocal, mostrarAdmin, ocultarAdmin, cargarUsuariosAdmin, cargarProductosAdmin
// Eliminar listeners y funciones asociadas.
// Eliminar comentarios de administración.
// Mantener solo la lógica de catálogo y cotización para el cliente.

// Actualización automática del catálogo cada 30 segundos
setInterval(() => {
  actualizarCatalogo();
}, 30000); // 30,000 ms = 30 segundos

// Función para actualizar el catálogo automáticamente
async function actualizarCatalogo() {
  const productos = await obtenerProductos();
  // Limpiar filtros antes de volver a llenarlos
  filtroMarca.innerHTML = '<option value="">Todas</option>';
  filtroProposito.innerHTML = '<option value="">Todos</option>';
  llenarFiltros(productos);
  mostrarProductos(productos);
}

// Mostrar/ocultar campo de descripción de servicio según selección
const servicioSelect = document.getElementById('servicio-solicitado');
const grupoDescripcionServicio = document.getElementById('grupo-descripcion-servicio');
const descripcionServicio = document.getElementById('descripcion-servicio');
if (servicioSelect) {
  servicioSelect.addEventListener('change', () => {
    if (servicioSelect.value === 'servicio') {
      grupoDescripcionServicio.style.display = '';
    } else {
      grupoDescripcionServicio.style.display = 'none';
      descripcionServicio.value = '';
    }
  });
}

// Limpiar campo de descripción al cerrar el modal del carrito
cerrarModalCarrito.addEventListener('click', () => {
  modalCarrito.style.display = 'none';
  if (descripcionServicio) descripcionServicio.value = '';
});

// Función para mostrar notificación de producto agregado al carrito
function mostrarNotificacionProducto(producto, cantidad) {
  // Crear la notificación si no existe
  let notificacion = document.querySelector('.notificacion-carrito');
  if (!notificacion) {
    notificacion = document.createElement('div');
    notificacion.className = 'notificacion-carrito';
    document.body.appendChild(notificacion);
  }

  // Configurar el contenido de la notificación
  notificacion.innerHTML = `
    <div class="icono">✅</div>
    <div class="texto">¡${cantidad} ${cantidad === 1 ? 'unidad' : 'unidades'} de "${producto.nombre_producto || producto.nombre}" agregada${cantidad === 1 ? '' : 's'} al carrito!</div>
  `;

  // Mostrar la notificación
  setTimeout(() => {
    notificacion.classList.add('mostrar');
  }, 100);

  // Ocultar la notificación después de 3 segundos
  setTimeout(() => {
    notificacion.classList.remove('mostrar');
  }, 3000);
}
