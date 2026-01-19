/**
 * @fileoverview Contiene la lógica para la página de catálogo de productos.
 * Maneja la obtención, filtrado y visualización de productos, así como el carrito de compras y generación de cotizaciones.
 * @author Neumatics Tool
 */

// Forzar URLs de producción en Vercel
const API_URL = 'https://nt-backapis.onrender.com/routes/productos';
const API_PDF_URL = 'https://nt-backapis.onrender.com/routes/quote';
const grid = document.getElementById('productos-grid');
const filtroMarca = document.getElementById('marca');
const filtroProposito = document.getElementById('proposito');
const filtroTipo = document.getElementById('tipo');
const cantidadProductos = document.getElementById('cantidad');
const loader = document.getElementById('loader');
const btnVerCarrito = document.getElementById('ver-carrito');
const modalCarrito = document.getElementById('modal-carrito');
const cerrarModalCarrito = document.getElementById('cerrar-modal-carrito');
const carritoListado = document.getElementById('carrito-listado');
const btnCotizarPDF = document.getElementById('cotizar-pdf');
const carritoCantidad = document.getElementById('carrito-cantidad');

// Guard clause: If we are not on the catalog page (grid is missing), stop specific catalog logic.
// However, we must allow some shared logic if needed, but for now we wrap the page-specific parts.
const isCatalogPage = !!grid;

// Inicializa AOS para animaciones
import AOS from 'aos';
import 'aos/dist/aos.css';
AOS.init({ duration: 600, once: false });

// Configuración de EmailJS (rellenar valores en src/js/emailjs-config.js)
// El envío de correo electrónico desde el frontend fue eliminado. Los correos son enviados exclusivamente por el backend.

/**
 * Valida si una URL es válida y pertenece a Cloudinary.
 * @param {string} url - La URL a validar.
 * @returns {boolean} - True si es una URL válida de Cloudinary, false en caso contrario.
 */
function isValidCloudinaryUrl(url) {
  if (!url) return false;

  const cloudinaryPattern = /^https:\/\/res\.cloudinary\.com\/[^\/]+\/image\/upload\/.*$/;
  return cloudinaryPattern.test(url);
}

/**
 * Obtiene la URL de la imagen para un producto, con fallback a una imagen por defecto.
 * @param {object} producto - El objeto producto con sus detalles.
 * @returns {string} - La URL de la imagen procesada o el fallback.
 */
function getImageUrl(producto) {
  if (producto.imagen_url && isValidCloudinaryUrl(producto.imagen_url)) {
    return producto.imagen_url;
  } else {
    return '/assets/img/logo3.png';
  }
}

/**
 * Abre un modal con animación de desvanecimiento (fade-in).
 * @param {HTMLElement} modal - El elemento del modal a abrir.
 */
function openModal(modal) {
  modal.style.display = 'flex';
  modal.classList.remove('fade-out');
  modal.classList.add('fade-in');
  if (window.AOS) setTimeout(() => AOS.refreshHard(), 10);
}

/**
 * Cierra un modal con animación de desvanecimiento (fade-out).
 * @param {HTMLElement} modal - El elemento del modal a cerrar.
 */
function closeModal(modal) {
  modal.classList.remove('fade-in');
  modal.classList.add('fade-out');
  setTimeout(() => { modal.style.display = 'none'; if (window.AOS) AOS.refreshHard(); }, 350);
}

/**
 * Obtiene el listado de productos desde la API.
 * @returns {Promise<Array>} - Promesa que resuelve en un arreglo de objetos de productos.
 */
async function obtenerProductos() {
  try {
    const res = await fetch(API_URL, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      mode: 'cors',
      credentials: 'omit'
    });
    if (!res.ok) throw new Error('No se pudo obtener productos');
    return await res.json();
  } catch (e) {
    console.error('Error al obtener productos:', e);
    showToast('Error al obtener productos');
    return [];
  }
}

/**
 * Pobla los selectores de filtros con las marcas y propósitos disponibles en los productos.
 * @param {Array} productos - Arreglo de productos para extraer los filtros únicos.
 */
function llenarFiltros(productos) {
  const marcas = new Set();
  const propositos = new Set();

  // Si el backend incluye el campo 'tipo', lo usamos para llenar las opciones dinámicamente
  const tipos = new Set();

  productos.forEach(p => {
    marcas.add(p.marca);
    propositos.add(p.proposito);
    if (p.tipo) tipos.add(p.tipo);
  });

  // Función interna para limpiar las opciones dinámicas manteniendo la primera opción (por defecto)
  function resetSelectKeepFirst(selectEl) {
    if (!selectEl) return;
    const first = selectEl.querySelector('option');
    selectEl.innerHTML = '';
    if (first) selectEl.appendChild(first.cloneNode(true));
  }

  resetSelectKeepFirst(filtroMarca);
  resetSelectKeepFirst(filtroProposito);
  if (filtroTipo) resetSelectKeepFirst(filtroTipo);

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

  // Llenar filtro tipo dinámicamente solo si hay valores distintos en los datos.
  // Mantiene las opciones estáticas añadidas en HTML pero asegura no duplicar.
  if (tipos.size > 0) {
    const existing = filtroTipo ? Array.from(filtroTipo.querySelectorAll('option')).map(o => o.value) : [];
    tipos.forEach(t => {
      if (!existing.includes(t) && filtroTipo) {
        const opt = document.createElement('option');
        opt.value = t;
        opt.textContent = t;
        filtroTipo.appendChild(opt);
      }
    });
  }
}

/**
 * Renderiza las tarjetas de productos en el grid del catálogo.
 * Crea elementos DOM para nuevos productos y elimina los que ya no existen, optimizando el redibujado.
 * @param {Array} productos - Arreglo de productos a mostrar.
 */
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
      // Asegurarse de que el event listener siga funcionando
      card.onclick = () => mostrarModalProducto(p);
    } else {
      // Crear nueva tarjeta si no existe
      card = document.createElement('div');
      card.className = 'producto';
      card.dataset.productId = p.id; // Añadir un atributo de datos para identificar el producto
      card.setAttribute('data-aos', 'fade-up');
      card.setAttribute('data-aos-delay', '50');
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
  // Después de manipular el DOM de productos, refrescar AOS para recalcular posiciones
  try {
    if (window.AOS && typeof window.AOS.refresh === 'function') {
      window.AOS.refresh();
    }
  } catch (e) {
    console.warn('AOS refresh falló:', e);
  }
}

// Variables para modal y carrito
const modal = document.getElementById('modal-producto');
const modalInfo = document.getElementById('modal-info');
const cerrarModal = document.getElementById('cerrar-modal');
const inputCantidad = document.getElementById('modal-cantidad');
const btnAgregarCarrito = document.getElementById('agregar-carrito');

let productoActual = null;
let carrito = [];

/**
 * Muestra el modal con la información detallada del producto seleccionado.
 * @param {object} producto - El objeto producto a mostrar.
 */
function mostrarModalProducto(producto) {
  productoActual = producto;

  console.log('Producto en modal:', {
    nombre: producto.nombre_producto || producto.nombre,
    imagen_url: producto.imagen_url,
    tiene_imagen: !!producto.imagen_url,
    es_url_valida: isValidCloudinaryUrl(producto.imagen_url)
  });

  const imagen = getImageUrl(producto);
  modalInfo.innerHTML = `
    <h3 class="modal-producto-titulo">${producto.nombre_producto || producto.nombre}</h3>
    <div class="modal-producto-layout">
      <div class="modal-producto-imagen">
        <img src="${imagen}" alt="${producto.nombre_producto || producto.nombre}"
             onerror="this.src='/assets/img/logo3.png'; console.log('Error cargando imagen en modal:', this.src);" />
      </div>
      <div class="modal-producto-info">

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

  const acciones = modalInfo.parentElement.querySelector('.modal-acciones');
  acciones.innerHTML = `
    <div class="cantidad-control" id="cantidad-control">
      <button type="button" class="cantidad-btn" id="btn-restar">-</button>
      <input type="number" id="modal-cantidad" min="1" value="1"/>
      <button type="button" class="cantidad-btn" id="btn-sumar">+</button>
    </div>
    <button id="agregar-carrito">Agregar al carrito</button>
  `;

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
  openModal(modal);
}

cerrarModal.addEventListener('click', () => {
  closeModal(modal);
});

window.addEventListener('click', (e) => {
  if (e.target === modal) closeModal(modal);
});

btnAgregarCarrito.addEventListener('click', () => {
  const cantidad = parseInt(inputCantidad.value, 10);
  if (!productoActual || isNaN(cantidad) || cantidad < 1) return;
  if (cantidad > (productoActual.existencias || productoActual.cantidad)) {
    showToast('No hay suficientes unidades disponibles.');
    return;
  }

  const idx = carrito.findIndex(item => item.id === productoActual.id);
  if (idx > -1) {
    carrito[idx].cantidad += cantidad;
  } else {
    const nuevoItem = {
      ...productoActual,
      cantidad,
      stock_disponible: productoActual.existencias || productoActual.cantidad || productoActual.cantidad_disponible || 0
    };

    carrito.push(nuevoItem);
  }
  modal.style.display = 'none';
  actualizarCarritoCantidad();
  guardarCarrito();
  mostrarNotificacionProducto(productoActual, cantidad);
});

/**
 * Actualiza el indicador numérico de cantidad total de productos en el carrito.
 */
function actualizarCarritoCantidad() {
  const total = carrito.reduce((sum, item) => sum + item.cantidad, 0);
  carritoCantidad.textContent = total;
}

/**
 * Renderiza y muestra el modal del carrito de compras con la tabla de productos.
 * Agrega oyentes de eventos para modificar cantidades o eliminar productos.
 */
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

/**
 * Habilita o deshabilita el botón de cotizar basándose en si el carrito tiene productos.
 */
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

btnVerCarrito.addEventListener('click', () => {
  mostrarCarrito();

  // Restablecer campos del formulario
  const codigoPais = document.getElementById('codigo-pais');
  const telefonoInput = document.getElementById('telefono-cliente');
  const emailInput = document.getElementById('email-cliente');
  const tipoCotizacion = document.getElementById('tipo-cotizacion');
  const descripcionServicio = document.getElementById('grupo-descripcion-servicio');

  // Limpiar todos los campos
  if (codigoPais) codigoPais.value = '52';
  if (telefonoInput) telefonoInput.value = '';
  if (emailInput) emailInput.value = '';
  // Auto-rellenar tipo basado en el contenido del carrito
  if (tipoCotizacion) {
    // Comprobar si algún item es para 'Renta'
    const hayRenta = carrito && carrito.some(i => i.proposito && i.proposito.toLowerCase().includes('renta'));
    // Por defecto 'Compra' a menos que se detecte 'Renta'
    tipoCotizacion.value = hayRenta ? 'Renta' : 'Compra';
  }
  const aceptaDatos = document.getElementById('acepta-datos');
  if (aceptaDatos) {
    // Restaurar consentimiento de la sesión si existe y los campos están completos
    try {
      const stored = sessionStorage.getItem('consent_given');
      if (stored === '1' && camposObligatoriosLlenos()) {
        aceptaDatos.checked = true;
      } else {
        aceptaDatos.checked = false;
        if (stored === '1') sessionStorage.removeItem('consent_given');
      }
    } catch (e) {
      aceptaDatos.checked = false;
    }
  }

  // Ocultar descripción inicialmente
  if (descripcionServicio) {
    descripcionServicio.classList.remove('visible');
    descripcionServicio.style.display = 'none';
    const inputDesc = document.getElementById('descripcion-servicio');
    if (inputDesc) {
      inputDesc.value = '';
      inputDesc.required = false;
    }
  }
  // Asegurar estado inicial correcto según el valor actual del select
  if (tipoCotizacion) actualizarCampoDescripcion(tipoCotizacion.value);

  // Asegurar que el modal se abre con los estilos compartidos
  openModal(modalCarrito);
});

// Manejar cambios en tipo de cotización y mostrar/ocultar campo de descripción
function actualizarCampoDescripcion(tipoCotizacion) {
  const descripcionServicio = document.getElementById('grupo-descripcion-servicio');
  const inputDescripcion = document.getElementById('descripcion-servicio');

  if (descripcionServicio && inputDescripcion) {
    const mostrar = tipoCotizacion === 'Servicio de mantenimiento';

    // Remover clase visible primero si existe
    descripcionServicio.classList.remove('visible');

    if (mostrar) {
      // Mostrar con animación
      setTimeout(() => {
        descripcionServicio.classList.add('visible');
      }, 50);
    } else {
      // Limpiar el valor al ocultar
      inputDescripcion.value = '';
    }

    // Actualizar requerido según visibilidad
    inputDescripcion.required = mostrar;
  }
}

/**
 * Devuelve una lista de nombres de campos obligatorios que faltan o son inválidos.
 * Usado para feedback al usuario.
 * @returns {string[]} Lista de etiquetas de campos faltantes.
 */
function camposFaltantes() {
  const faltan = [];
  const nombreInput = document.getElementById('nombre-cliente');
  const telefonoInputLocal = document.getElementById('telefono-cliente');
  const codigoPaisLocal = document.getElementById('codigo-pais');
  const tipoCotizacion = document.getElementById('tipo-cotizacion');
  const descripcionServicioLocal = document.getElementById('descripcion-servicio');

  if (!nombreInput || !nombreInput.value.trim()) faltan.push('Nombre');
  if (!telefonoInputLocal || !codigoPaisLocal) faltan.push('Teléfono');
  else {
    const codigo = codigoPaisLocal.value;
    const telefono = telefonoInputLocal.value.trim().replace(/\D/g, '');
    const longitud = longitudesTelefono[codigo] || 10;
    if (telefono.length !== longitud) faltan.push('Teléfono (longitud incorrecta)');
  }
  if (!tipoCotizacion || !tipoCotizacion.value) faltan.push('Tipo de cotización');
  if (tipoCotizacion && tipoCotizacion.value === 'Servicio de mantenimiento') {
    if (!descripcionServicioLocal || descripcionServicioLocal.value.trim().length < 10) faltan.push('Descripción del servicio (mín. 10 caracteres)');
  }
  return faltan;
}

// Event listener para cambios en tipo de cotización
document.getElementById('tipo-cotizacion')?.addEventListener('change', (e) => {
  actualizarCampoDescripcion(e.target.value);
});
cerrarModalCarrito.addEventListener('click', () => {
  closeModal(modalCarrito);
});
window.addEventListener('click', (e) => {
  if (e.target === modalCarrito) closeModal(modalCarrito);
});

btnAgregarCarrito.addEventListener('click', () => {
  actualizarCarritoCantidad();
});

/**
 * Guarda el carrito actual en localStorage.
 */
function guardarCarrito() {
  localStorage.setItem('carrito', JSON.stringify(carrito));
}

/**
 * Carga el carrito desde localStorage, si existe.
 */
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

cargarCarrito();
actualizarCarritoCantidad();
actualizarBotonCotizar();

const telefonoInput = document.getElementById('telefono-cliente');
const codigoPais = document.getElementById('codigo-pais');

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

/**
 * Actualiza el atributo maxlength del input de teléfono según el código de país seleccionado.
 */
function actualizarMaxlength() {
  const codigo = codigoPais.value;
  telefonoInput.maxLength = longitudesTelefono[codigo] || 15; // 15 como fallback
}

telefonoInput.addEventListener('input', () => {
  telefonoInput.value = telefonoInput.value.replace(/\D/g, '');
});

codigoPais.addEventListener('change', () => {
  telefonoInput.value = '';
  actualizarMaxlength();
  validarCamposCotizacion();
});

actualizarMaxlength();

/**
 * Valida todos los campos del formulario de cotización y habilita o deshabilita el botón de envío.
 */
function validarCamposCotizacion() {
  const nombreInput = document.getElementById('nombre-cliente');
  const emailInput = document.getElementById('email-cliente');
  const tipoCotizacion = document.getElementById('tipo-cotizacion');
  const descripcionServicio = document.getElementById('descripcion-servicio');
  const btn = document.getElementById('cotizar-pdf');
  const aceptaDatos = document.getElementById('acepta-datos');

  // Validar nombre
  const nombreValido = nombreInput.value.trim().length > 0;

  // Validar email (opcional pero chequea formato si existe)
  const emailValue = emailInput.value.trim();
  const emailValido = !emailValue || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailValue);

  // Validar teléfono
  const codigo = codigoPais.value;
  const telefono = telefonoInput.value.trim();
  const longitudRequerida = longitudesTelefono[codigo] || 10;
  const telefonoValido = telefono.length === longitudRequerida;

  // Validar tipo de cotización
  const tipoValido = tipoCotizacion.value !== '';

  // Validar consentimiento (checkbox)
  const aceptaValido = aceptaDatos ? aceptaDatos.checked : false;

  // Validar descripción cuando es servicio de mantenimiento
  const descripcionValida = tipoCotizacion.value !== 'Servicio de mantenimiento' ||
    (descripcionServicio && descripcionServicio.value.trim().length >= 10);

  // Habilitar/deshabilitar botón según validación
  const todosLosCamposValidos = nombreValido && emailValido && telefonoValido &&
    tipoValido && descripcionValida && aceptaValido;

  if (todosLosCamposValidos) {
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
  // Adjuntar validarCamposCotizacion a todos los campos relevantes si existen.
  // Evitar lanzar errores si algún elemento no está presente en el DOM.
  [
    'nombre-cliente',
    'telefono-cliente',
    'email-cliente',
    'codigo-pais',
    'tipo-cotizacion',
    'descripcion-servicio',
    'servicio-solicitado'
  ].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener(evt, validarCamposCotizacion);
  });
});

/**
 * Verifica si los campos obligatorios (excluyendo el consentimiento) están completos y válidos.
 * Controla si el checkbox de consentimiento debe habilitarse.
 * @returns {boolean} True si los campos requeridos están llenos y válidos.
 */
function camposObligatoriosLlenos() {
  const nombreInput = document.getElementById('nombre-cliente');
  const telefonoInputLocal = document.getElementById('telefono-cliente');
  const codigoPaisLocal = document.getElementById('codigo-pais');
  const tipoCotizacion = document.getElementById('tipo-cotizacion');
  const descripcionServicioLocal = document.getElementById('descripcion-servicio');

  if (!nombreInput || !telefonoInputLocal || !codigoPaisLocal || !tipoCotizacion) return false;

  const nombreValido = nombreInput.value.trim().length > 0;
  const codigo = codigoPaisLocal.value;
  const telefono = telefonoInputLocal.value.trim().replace(/\D/g, '');
  const longitudRequerida = longitudesTelefono[codigo] || 10;
  const telefonoValido = telefono.length === longitudRequerida;
  const tipoValido = tipoCotizacion.value !== '';
  const descripcionValida = tipoCotizacion.value !== 'Servicio de mantenimiento' ||
    (descripcionServicioLocal && descripcionServicioLocal.value.trim().length >= 10);

  return nombreValido && telefonoValido && tipoValido && descripcionValida;
}

/**
 * Actualiza el estado del checkbox de consentimiento (habilitado/deshabilitado)
 * y muestra mensajes de ayuda si faltan campos.
 */
function actualizarEstadoConsentimiento() {
  const acepta = document.getElementById('acepta-datos');
  const tipEl = document.getElementById('consent-tip');
  if (!acepta) return;
  try {
    const ok = camposObligatoriosLlenos();
    acepta.disabled = !ok;
    // Si quedó deshabilitado, asegurarnos de desmarcarlo
    if (!ok) acepta.checked = false;
    // Mostrar mensaje de ayuda con campos faltantes
    if (tipEl) {
      if (ok) {
        tipEl.textContent = 'Puede marcar la casilla de consentimiento.';
        tipEl.style.color = '#3a3a3a';
      } else {
        const falta = camposFaltantes();
        tipEl.textContent = falta.length ? `Faltan: ${falta.join(', ')}` : 'Complete los campos obligatorios para habilitar el consentimiento.';
        tipEl.style.color = '#b14a00';
      }
    }
  } catch (e) {
    console.warn('Error actualizando estado de consentimiento:', e);
    acepta.disabled = true;
    acepta.checked = false;
  }
  // Re-evaluar el botón también
  validarCamposCotizacion();
}

// Escuchar cambios en campos relevantes para actualizar si el checkbox puede activarse
['nombre-cliente', 'telefono-cliente', 'codigo-pais', 'tipo-cotizacion', 'descripcion-servicio', 'email-cliente'].forEach(id => {
  const el = document.getElementById(id);
  if (el) el.addEventListener('input', actualizarEstadoConsentimiento);
  if (el) el.addEventListener('change', actualizarEstadoConsentimiento);
});

// Adjuntar validación al checkbox de consentimiento por separado
const aceptaEl = document.getElementById('acepta-datos');
if (aceptaEl) {
  aceptaEl.addEventListener('change', (e) => {
    try {
      if (e.target.checked) sessionStorage.setItem('consent_given', '1');
      else sessionStorage.removeItem('consent_given');
    } catch (err) { /* ignorar errores de almacenamiento */ }
    validarCamposCotizacion();
  });
}

let isSubmitting = false;

btnCotizarPDF.addEventListener('click', async (e) => {
  if (isSubmitting) return; // Prevenir doble envío
  isSubmitting = true;
  btnCotizarPDF.disabled = true;
  btnCotizarPDF.textContent = 'Generando cotización...';

  const nombreInput = document.getElementById('nombre-cliente');
  const telefonoInput = document.getElementById('telefono-cliente');
  const codigoPais = document.getElementById('codigo-pais');
  const servicioSelect = document.getElementById('servicio-solicitado');
  const descripcionServicio = document.getElementById('descripcion-servicio');
  const servicio = servicioSelect ? servicioSelect.value : 'venta';
  let telefono = telefonoInput.value.trim().replace(/\D/g, '');
  let codigo = codigoPais ? codigoPais.value : '52';

  const emailInput = document.getElementById('email-cliente');
  const emailValue = emailInput.value.trim();
  if (!nombreInput.value.trim() ||
    (emailValue && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailValue)) ||
    (codigo === '52' ? telefono.length !== 10 : (telefono.length < 7 || telefono.length > 15))) {
    e.preventDefault();
    validarCamposCotizacion();
    return;
  }

  // Ya no requerimos productos en el carrito para cotizaciones de servicios puros,
  // pero el botón probablemente estaría deshabilitado si el carrito está vacío en la lógica actual.
  // Suponemos que la validación anterior del botón cubre esto.
  const tipoCotizacion = document.getElementById('tipo-cotizacion');
  if (!tipoCotizacion.value) {
    showToast('Por favor seleccione el tipo de cotización.');
    return;
  }

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

  let destinoCorreo = [];
  if (servicio === 'compra') destinoCorreo = ['cesar_urrutia_dev4383@proton.me'];
  else if (servicio === 'renta') destinoCorreo = ['cesar_urrutia_dev4383@proton.me'];
  else if (servicio === 'servicio de mantenimiento') destinoCorreo = ['cesar_urrutia_dev4383@proton.me'];

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

  let disponibilidadOk = true;
  console.log('Verificando disponibilidad del carrito:', carrito);
  for (const item of carrito) {
    const stockDisponible = item.stock_disponible || item.existencias || item.cantidad_disponible || item.cantidad || 0;
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

  try {
    // Paso 1: Generar el PDF primero
    console.log('Iniciando generación de PDF...');
    const carritoParaEnviar = carrito.map(item => ({
      id: item.id,
      nombre: item.nombre_producto || item.nombre,
      marca: item.marca,
      proposito: item.proposito,
      cantidad: item.cantidad
    }));

    // Usar la URL del backend según el entorno
    const BACKEND_QUOTE_URL = import.meta.env.VITE_API_URL?.replace('/routes/productos', '/routes/quote') || 'http://localhost:4000/routes/quote';

    const emailCliente = document.getElementById('email-cliente').value.trim();
    // Re-leer tipo por si cambió
    const tipoCotizacionValor = document.getElementById('tipo-cotizacion').value;

    const requestData = {
      carrito: carritoParaEnviar,
      nombre: nombreCliente,
      telefono: telefonoCliente,
      email: emailCliente,
      tipo_cotizacion: tipoCotizacionValor,
      servicio,
      destinoCorreo,
      descripcion
    };

    const pdfResponse = await fetch(BACKEND_QUOTE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      mode: 'cors',
      cache: 'no-cache',
      credentials: 'omit',
      redirect: 'follow',
      body: JSON.stringify(requestData)
    });

    if (!pdfResponse.ok) {
      const errorData = await pdfResponse.text();
      throw new Error('No se pudo generar el PDF');
    }

    const responseData = await pdfResponse.json();

    if (!responseData.pdfBase64) {
      throw new Error('No se recibió el PDF en base64 del servidor');
    }

    // Convertir base64 a Blob
    const byteCharacters = atob(responseData.pdfBase64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const pdfBlob = new Blob([byteArray], { type: 'application/pdf' });
    const url = URL.createObjectURL(pdfBlob);

    // Mostrar el PDF en el modal
    const modalPDF = document.getElementById('modal-pdf');
    const iframePDF = document.getElementById('iframe-pdf');
    const btnDescargarPDF = document.getElementById('descargar-pdf');

    iframePDF.src = url;
    openModal(modalPDF);

    // Preparar nombre de archivo y blob para compartir
    const fileName = `NT_Cotizacion_${(nombreCliente || 'cotizacion').replace(/\s+/g, '_')}.pdf`;

    // Manejador de descarga
    btnDescargarPDF.onclick = () => {
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      a.click();
      // Después de la descarga, revocar el URL y recargar para reiniciar la interfaz y limpiar carrito
      setTimeout(() => {
        try { URL.revokeObjectURL(url); } catch (e) { /* ignore */ }
        window.location.reload();
      }, 700);
    };

    // Nuevo: Enviar vía cliente o Servidor.
    const btnEnviarPorCorreo = document.getElementById('enviar-por-correo');
    btnEnviarPorCorreo.onclick = async () => {
      // Fallback: enviar automáticamente desde el servidor usando la función
      // centralizada `enviarCotizacionBackend` que delega al endpoint `/send`.
      try {
        btnEnviarPorCorreo.disabled = true;
        btnEnviarPorCorreo.textContent = 'Enviando...';
        showToast('Intentando envío automático desde el servidor...');

        const sendRes = await enviarCotizacionBackend({
          carrito: carritoParaEnviar,
          nombre: nombreCliente,
          telefono: telefonoCliente,
          email: emailCliente,
          servicio,
          destinoCorreo: destinoCorreo,
          descripcion
        });

        // const sendJson = await sendRes.json().catch(() => null); // No usado actualmente
        if (!sendRes.ok) {
          showToast('No se pudo enviar desde el servidor. Intente descargar y enviar manualmente.');
          // fallback: permitir al usuario descargar
          const a = document.createElement('a');
          a.href = url;
          a.download = fileName;
          a.click();
        } else {
          showToast('Correo enviado correctamente desde el servidor.', 10000);
          closeModal(modalPDF);
          // Reiniciar carrito en memoria y en localStorage antes de recargar
          try {
            carrito = [];
            localStorage.removeItem('carrito'); // Eliminar explícitamente el carrito
            guardarCarrito(); // Guardar carrito vacío
            actualizarCarritoCantidad();
            actualizarBotonCotizar();
          } catch (e) { /* ignore */ }
          // Después de un envío exitoso, revocar el URL y recargar para reiniciar la interfaz
          setTimeout(() => {
            try { URL.revokeObjectURL(url); } catch (e) { /* ignore */ }
            window.location.reload();
          }, 1500); // Retardo aumentado para asegurar que el usuario vea el toast
        }
      } catch (err) {
        showToast('Error en envío automático. Descargue el PDF y envíe manualmente.');
      } finally {
        btnEnviarPorCorreo.disabled = false;
        btnEnviarPorCorreo.textContent = 'Enviar por correo';
      }
    };

    document.getElementById('cerrar-modal-pdf').onclick = () => {
      closeModal(modalPDF);
      iframePDF.src = '';
      URL.revokeObjectURL(url);
    };

    // Nota: no recargamos ni cerramos la interfaz aquí. La recarga se realiza
    // únicamente después de que el usuario descargue el PDF o el servidor
    // confirme el envío del correo.
  } catch (err) {
    showToast('No se pudo generar la previsualización del PDF.');
    isSubmitting = false;
    btnCotizarPDF.disabled = false;
    btnCotizarPDF.textContent = 'Cotizar';
  }
});

/**
 * Filtra los productos según la marca, propósito y tipo seleccionados.
 * @param {Array} productos - Array de productos.
 * @param {boolean} [actualizarURL=true] - Indica si se debe actualizar la URL con los parámetros de filtro.
 */
function filtrar(productos, actualizarURL = true) {
  const marca = filtroMarca.value;
  const proposito = filtroProposito.value;
  const tipo = filtroTipo ? filtroTipo.value : '';

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
    if (tipo) {
      params.set('tipo', tipo);
    } else {
      params.delete('tipo');
    }
    history.pushState({}, '', `${window.location.pathname}?${params.toString()}`);
  }

  const filtrados = productos.filter(p =>
    (marca === '' || p.marca === marca) &&
    (proposito === '' || p.proposito === proposito) &&
    (tipo === '' || (p.tipo && p.tipo === tipo))
  );

  // Actualizar opciones de filtros dependientes
  actualizarFiltrosDependientes(productos);

  mostrarProductos(filtrados);
}

/**
 * Lee los parámetros de la URL y aplica los filtros correspondientes al cargar la página.
 */
function aplicarFiltrosDesdeURL() {
  const params = new URLSearchParams(window.location.search);
  const marca = params.get('marca');
  const proposito = params.get('proposito');
  const tipo = params.get('tipo');

  if (marca) {
    filtroMarca.value = marca;
  }
  if (proposito) {
    filtroProposito.value = proposito;
  }
  if (tipo && filtroTipo) {
    filtroTipo.value = tipo;
  }
}

/**
 * Actualiza la visibilidad de las opciones de los filtros basándose en la selección actual
 * para asegurar que solo se muestren combinaciones válidas.
 * @param {Array} productos - La lista completa de productos.
 */
function actualizarFiltrosDependientes(productos) {
  // Tomar selecciones actuales
  const selMarca = filtroMarca ? filtroMarca.value : '';
  const selProposito = filtroProposito ? filtroProposito.value : '';
  const selTipo = filtroTipo ? filtroTipo.value : '';

  const marcasValidos = new Set();
  const propositosValidos = new Set();
  const tiposValidos = new Set();

  productos.forEach(p => {
    // Validar marca
    if ((selProposito === '' || p.proposito === selProposito) && (selTipo === '' || p.tipo === selTipo)) {
      if (p.marca) marcasValidos.add(p.marca);
    }
    // Validar propósito
    if ((selMarca === '' || p.marca === selMarca) && (selTipo === '' || p.tipo === selTipo)) {
      if (p.proposito) propositosValidos.add(p.proposito);
    }
    // Validar tipo
    if ((selMarca === '' || p.marca === selMarca) && (selProposito === '' || p.proposito === selProposito)) {
      if (p.tipo) tiposValidos.add(p.tipo);
    }
  });

  // Función auxiliar para filtrar opciones de un elemento select
  function filtrarSelect(selectEl, validSet) {
    if (!selectEl) return;
    const options = Array.from(selectEl.options);
    options.forEach((opt, idx) => {
      if (idx === 0) return; // mantener la opción 'Todos' / vacía
      if (!validSet.has(opt.value)) {
        opt.style.display = 'none';
      } else {
        opt.style.display = '';
      }
    });
    // Si la opción seleccionada quedó oculta, resetear.
    const currentOption = selectEl.querySelector(`option[value="${selectEl.value}"]`);
    if (selectEl.value && currentOption && currentOption.style.display === 'none') {
      selectEl.value = '';
      if (selectEl === filtroTipo) {
        try { localStorage.removeItem('filtro_tipo'); } catch (e) { /* ignore */ }
      }
    }
  }

  filtrarSelect(filtroMarca, marcasValidos);
  filtrarSelect(filtroProposito, propositosValidos);
  if (filtroTipo) filtrarSelect(filtroTipo, tiposValidos);
}

window.addEventListener('DOMContentLoaded', () => {
  document.body.classList.add('fade-in');
});

/**
 * Envía la solicitud de cotización al endpoint del backend.
 * @param {object} data - Datos de la cotización a enviar.
 * @returns {Promise<Response>} - Promesa con la respuesta del servidor.
 */
async function enviarCotizacionBackend({ carrito, nombre, telefono, email, servicio, destinoCorreo, descripcion }) {
  // Delegar completamente al backend: el servidor se encargará de generar el PDF
  // y de enviar el correo.
  const carritoSimplificado = carrito.map(item => ({
    id: item.id,
    nombre: item.nombre_producto || item.nombre,
    marca: item.marca,
    proposito: item.proposito,
    cantidad: item.cantidad
  }));

  const payload = {
    carrito: carritoSimplificado,
    nombre,
    telefono,
    email,
    servicio,
    destinoCorreo,
    descripcion: descripcion || ''
  };

  const BACKEND_QUOTE_URL = import.meta.env.VITE_API_URL?.replace('/routes/productos', '/routes/quote') || 'http://localhost:4000/routes/quote';
  const sendUrl = BACKEND_QUOTE_URL + '/send';

  try {
    const res = await fetch(sendUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      mode: 'cors'
    });
    return res;
  } catch (err) {
    throw err;
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  if (!isCatalogPage) return; // Exit if not on catalog page

  loader.style.display = 'block';
  grid.style.display = 'none';
  const productos = await obtenerProductos();
  llenarFiltros(productos);
  aplicarFiltrosDesdeURL();
  // Restaurar selección previa de 'tipo' desde localStorage si la URL no la sobrescribe
  try {
    const params = new URLSearchParams(window.location.search);
    const savedTipo = localStorage.getItem('filtro_tipo');
    if (!params.get('tipo') && savedTipo && filtroTipo) {
      // Solo asignar si la opción existe
      if (Array.from(filtroTipo.options).some(o => o.value === savedTipo)) {
        filtroTipo.value = savedTipo;
      }
    }
  } catch (err) {
    /* ignore */
  }

  filtrar(productos, false);
  // Asegurar que el estado inicial del campo descripción coincida con el valor actual del select
  actualizarCampoDescripcion(document.getElementById('tipo-cotizacion')?.value || '');
  loader.style.display = 'none';
  grid.style.display = '';

  filtroMarca.addEventListener('change', () => filtrar(productos));
  filtroProposito.addEventListener('change', () => filtrar(productos));
  if (filtroTipo) filtroTipo.addEventListener('change', () => {
    try { localStorage.setItem('filtro_tipo', filtroTipo.value); } catch (e) { /* ignore */ }
    filtrar(productos);
  });
});

/**
 * Muestra una notificación emergente (toast) en la interfaz.
 * @param {string} msg - El mensaje a mostrar.
 * @param {number} [duration=5500] - Duración en milisegundos antes de desaparecer.
 */
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

/**
 * Actualiza el catálogo de productos periódicamente.
 */
if (isCatalogPage) {
  setInterval(() => {
    actualizarCatalogo();
  }, 30000); // 30,000 ms = 30 segundos
}

/**
 * Obtiene nuevamente los productos del servidor y actualiza la interfaz, preservando filtros.
 */
async function actualizarCatalogo() {
  const marcaActual = filtroMarca.value;
  const propositoActual = filtroProposito.value;
  const tipoActual = filtroTipo ? filtroTipo.value : '';

  const productos = await obtenerProductos();

  filtroMarca.innerHTML = '<option value="">Todas</option>';
  filtroProposito.innerHTML = '<option value="">Todos</option>';
  if (filtroTipo) {
    // preservar las opciones estáticas (primera opción) y reiniciar las demás
    const primera = filtroTipo.querySelector('option');
    filtroTipo.innerHTML = primera ? primera.outerHTML : '<option value="">Todos</option>';
  }
  llenarFiltros(productos);

  filtroMarca.value = marcaActual;
  filtroProposito.value = propositoActual;
  // Restaurar selección de 'tipo'
  if (filtroTipo) {
    const tipoToRestore = tipoActual || localStorage.getItem('filtro_tipo') || '';
    if (tipoToRestore && Array.from(filtroTipo.options).some(o => o.value === tipoToRestore)) {
      filtroTipo.value = tipoToRestore;
    }
  }

  filtrar(productos, false);
  // Refrescar AOS luego de actualizar el listado dinámico
  if (window.AOS && typeof window.AOS.refresh === 'function') window.AOS.refresh();
}

const servicioSelect = document.getElementById('servicio-solicitado');
const grupoDescripcionServicio = document.getElementById('grupo-descripcion-servicio');
const descripcionServicio = document.getElementById('descripcion-servicio');
if (servicioSelect) {
  servicioSelect.addEventListener('change', () => {
    // Reutilizar la función central que controla visibilidad y required
    if (servicioSelect.value === 'servicio') {
      actualizarCampoDescripcion('Servicio de mantenimiento');
    } else {
      actualizarCampoDescripcion('');
    }
  });
}

cerrarModalCarrito.addEventListener('click', () => {
  modalCarrito.style.display = 'none';
  if (descripcionServicio) descripcionServicio.value = '';
});

/**
 * Muestra una notificación visual en la esquina cuando se agrega un producto al carrito.
 * @param {object} producto - El producto agregado.
 * @param {number} cantidad - La cantidad agregada.
 */
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

  setTimeout(() => {
    notificacion.classList.add('mostrar');
  }, 100);

  setTimeout(() => {
    notificacion.classList.remove('mostrar');
  }, 3000);
}
