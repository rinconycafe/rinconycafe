// ============================================
// SISTEMA DE PEDIDOS
// RINCÓN & CAFÉ
// ============================================

import {
  db,
  collection,
  addDoc
} from "./firebase-init.js";

// ============================================
// VARIABLES
// ============================================

let productoActual = null;
let precioActual = 0;

// ============================================
// CREAR MODAL
// ============================================

function crearModalPedido() {

  // Si ya existe, no lo volvemos a crear
  if (document.getElementById("modal-pedido")) {
    return;
  }

  const overlay = document.createElement("div");

  overlay.id = "modal-pedido";

  overlay.innerHTML = `
    <div class="pedido-modal">

      <div class="pedido-modal-header">

        <h3>
          <i class="fa-solid fa-cart-shopping"></i>
          Hacer pedido
        </h3>

        <button
          type="button"
          id="pedido-cerrar"
          class="pedido-cerrar"
          aria-label="Cerrar"
        >
          ×
        </button>

      </div>


      <div class="pedido-contenido">

        <!-- PRODUCTO -->

        <div class="pedido-producto">

          <h4 id="pedido-producto-nombre">
            Producto
          </h4>

          <p id="pedido-producto-precio">
            $0
          </p>

        </div>


        <!-- CANTIDAD -->

        <div class="pedido-campo">

          <label for="pedido-cantidad">
            Cantidad
          </label>

          <input
            type="number"
            id="pedido-cantidad"
            min="1"
            value="1"
          >

        </div>


        <!-- NOMBRE -->

        <div class="pedido-campo">

          <label for="pedido-nombre">
            Nombre
          </label>

          <input
            type="text"
            id="pedido-nombre"
            placeholder="Tu nombre"
            autocomplete="name"
          >

        </div>


        <!-- WHATSAPP -->

        <div class="pedido-campo">

          <label for="pedido-whatsapp">
            WhatsApp / Teléfono
          </label>

          <input
            type="tel"
            id="pedido-whatsapp"
            placeholder="Ej: 11 1234-5678"
            autocomplete="tel"
          >

        </div>


        <!-- SECTOR -->

        <div class="pedido-campo">

          <label for="pedido-sector">
            ¿Dónde vas a estar?
          </label>

          <select id="pedido-sector">

            <option value="">
              Seleccioná un sector
            </option>

            <option value="Familia">
              Familia
            </option>

            <option value="Estudio / Trabajo — Mesa de 1 a 2">
              Estudio / Trabajo — Mesa de 1 a 2
            </option>

            <option value="Biblioteca / Lectura">
              Biblioteca / Lectura
            </option>

          </select>

        </div>


        <!-- OBSERVACIONES -->

        <div class="pedido-campo">

          <label for="pedido-observaciones">
            Observaciones
            <span>(opcional)</span>
          </label>

          <textarea
            id="pedido-observaciones"
            rows="3"
            placeholder="¿Querés agregar alguna indicación?"
          ></textarea>

        </div>


        <!-- TOTAL -->

        <div class="pedido-total">

          <span>
            Total
          </span>

          <strong id="pedido-total">
            $0
          </strong>

        </div>


        <!-- BOTONES -->

        <div class="pedido-botones">

          <button
            type="button"
            id="pedido-cancelar"
            class="pedido-btn pedido-btn-cancelar"
          >
            Cancelar
          </button>

          <button
            type="button"
            id="pedido-confirmar"
            class="pedido-btn pedido-btn-confirmar"
          >
            <i class="fa-solid fa-check"></i>
            Confirmar pedido
          </button>

        </div>

      </div>

    </div>
  `;

  document.body.appendChild(overlay);


  // ==========================================
  // VARIABLES DEL MODAL
  // ==========================================

  const inputCantidad =
    document.getElementById("pedido-cantidad");

  const inputNombre =
    document.getElementById("pedido-nombre");

  const inputWhatsapp =
    document.getElementById("pedido-whatsapp");

  const selectSector =
    document.getElementById("pedido-sector");

  const inputObservaciones =
    document.getElementById("pedido-observaciones");

  const totalElemento =
    document.getElementById("pedido-total");

  const botonConfirmar =
    document.getElementById("pedido-confirmar");


  // ==========================================
  // ACTUALIZAR TOTAL
  // ==========================================

  function actualizarTotal() {

    let cantidad = parseInt(
      inputCantidad.value,
      10
    );

    if (isNaN(cantidad) || cantidad < 1) {
      cantidad = 1;
      inputCantidad.value = 1;
    }

    const total = precioActual * cantidad;

    totalElemento.textContent =
      formatearPrecio(total);
  }


  inputCantidad.addEventListener(
    "input",
    actualizarTotal
  );


  // ==========================================
  // CERRAR MODAL
  // ==========================================

  function cerrarModal() {

    overlay.remove();

    const estilosModal =
      document.getElementById(
        "estilos-modal-pedido"
      );

    if (estilosModal) {
      estilosModal.remove();
    }

  }


  document
    .getElementById("pedido-cerrar")
    .addEventListener(
      "click",
      cerrarModal
    );


  document
    .getElementById("pedido-cancelar")
    .addEventListener(
      "click",
      cerrarModal
    );


  // Cerrar haciendo clic fuera del cuadro

  overlay.addEventListener(
    "click",
    function (event) {

      if (event.target === overlay) {
        cerrarModal();
      }

    }
  );


  // ==========================================
  // CONFIRMAR PEDIDO
  // ==========================================

  botonConfirmar.addEventListener(
    "click",
    async function () {

      const nombre =
        inputNombre.value.trim();

      const whatsapp =
        inputWhatsapp.value.trim();

      const sector =
        selectSector.value;

      const observaciones =
        inputObservaciones.value.trim();

      let cantidad =
        parseInt(
          inputCantidad.value,
          10
        );


      // ========================================
      // VALIDACIONES
      // ========================================

      if (!nombre) {

        alert(
          "Por favor, ingresá tu nombre."
        );

        inputNombre.focus();

        return;
      }


      if (!whatsapp) {

        alert(
          "Por favor, ingresá tu WhatsApp o teléfono."
        );

        inputWhatsapp.focus();

        return;
      }


      if (!sector) {

        alert(
          "Por favor, seleccioná el sector."
        );

        selectSector.focus();

        return;
      }


      if (
        isNaN(cantidad) ||
        cantidad < 1
      ) {

        cantidad = 1;

        inputCantidad.value = 1;

      }


      // ========================================
      // SUBTOTAL
      // ========================================

      const subtotal =
        precioActual * cantidad;


      // ========================================
      // OBJETO DEL PEDIDO
      // ========================================

      const pedido = {

        nombre: nombre,

        whatsapp: whatsapp,

        sector: sector,

        observaciones:
          observaciones || "",

        productos: [

          {

            nombre:
              productoActual,

            cantidad:
              cantidad,

            precio:
              precioActual,

            subtotal:
              subtotal

          }

        ],

        total:
          subtotal,

        estado:
          "Pendiente",

        fecha:
          new Date().toISOString()

      };


      // ========================================
      // DESACTIVAR BOTÓN
      // ========================================

      botonConfirmar.disabled = true;

      botonConfirmar.innerHTML = `
        <i class="fa-solid fa-spinner fa-spin"></i>
        Enviando...
      `;


      // ========================================
      // GUARDAR EN FIRESTORE
      // ========================================

      try {

        await addDoc(
          collection(db, "pedidos"),
          pedido
        );


        // ======================================
        // PEDIDO GUARDADO
        // ======================================

        alert(
          "¡Pedido enviado correctamente! ☕\n\n" +
          "Tu pedido quedó registrado como Pendiente."
        );


        cerrarModal();


      } catch (error) {

        console.error(
          "Error al guardar el pedido:",
          error
        );


        alert(
          "No se pudo enviar el pedido.\n\n" +
          "Por favor, intentá nuevamente."
        );


        botonConfirmar.disabled = false;

        botonConfirmar.innerHTML = `
          <i class="fa-solid fa-check"></i>
          Confirmar pedido
        `;

      }

    }
  );

}


// ============================================
// FORMATEAR PRECIO
// ============================================

function formatearPrecio(valor) {

  return new Intl.NumberFormat(
    "es-AR",
    {
      style: "currency",
      currency: "ARS",
      maximumFractionDigits: 0
    }
  ).format(valor);

}


// ============================================
// OBTENER PRECIO DESDE TEXTO
// ============================================

function obtenerPrecio(texto) {

  if (!texto) {
    return 0;
  }


  // Ejemplo:
  // "$2.500"
  // "$5.000"
  // "$16.000"

  const numero = texto
    .replace(/\$/g, "")
    .replace(/\./g, "")
    .replace(/,/g, ".")
    .replace(/[^\d.]/g, "")
    .trim();


  const precio =
    parseFloat(numero);


  return isNaN(precio)
    ? 0
    : precio;

}


// ============================================
// ABRIR PEDIDO
// ============================================

function abrirPedido(
  nombre,
  precio
) {

  productoActual = nombre;

  precioActual = precio;


  // Crear el modal

  crearModalPedido();


  // Obtener elementos

  const modal =
    document.getElementById(
      "modal-pedido"
    );


  const nombreProducto =
    document.getElementById(
      "pedido-producto-nombre"
    );


  const precioProducto =
    document.getElementById(
      "pedido-producto-precio"
    );


  const inputCantidad =
    document.getElementById(
      "pedido-cantidad"
    );


  const inputNombre =
    document.getElementById(
      "pedido-nombre"
    );


  const inputWhatsapp =
    document.getElementById(
      "pedido-whatsapp"
    );


  const selectSector =
    document.getElementById(
      "pedido-sector"
    );


  const inputObservaciones =
    document.getElementById(
      "pedido-observaciones"
    );


  // ==========================================
  // COMPROBACIÓN DE SEGURIDAD
  // ==========================================

  if (
    !modal ||
    !nombreProducto ||
    !precioProducto ||
    !inputCantidad ||
    !inputNombre ||
    !inputWhatsapp ||
    !selectSector ||
    !inputObservaciones
  ) {

    console.error(
      "No se pudieron encontrar todos los elementos del formulario de pedido."
    );

    return;

  }


  // ==========================================
  // CARGAR DATOS
  // ==========================================

  nombreProducto.textContent =
    nombre;


  precioProducto.textContent =
    formatearPrecio(precio);


  inputCantidad.value = 1;

  inputNombre.value = "";

  inputWhatsapp.value = "";

  selectSector.value = "";

  inputObservaciones.value = "";


  // ==========================================
  // ACTUALIZAR TOTAL
  // ==========================================

  const totalElemento =
    document.getElementById(
      "pedido-total"
    );


  totalElemento.textContent =
    formatearPrecio(precio);


  // ==========================================
  // MOSTRAR
  // ==========================================

  modal.style.display = "flex";


  // Evitar desplazamiento de la página

  document.body.style.overflow =
    "hidden";


  // Devolver scroll al cerrar

  const observer =
    new MutationObserver(
      function () {

        if (
          !document.body.contains(modal)
        ) {

          document.body.style.overflow =
            "";

          observer.disconnect();

        }

      }
    );


  observer.observe(
    document.body,
    {
      childList: true
    }
  );


  // ==========================================
  // ENFOCAR NOMBRE
  // ==========================================

  setTimeout(
    function () {

      inputNombre.focus();

    },
    100
  );

}


// ============================================
// ACTIVAR BOTONES DE PRODUCTOS
// ============================================

function activarBotonesPedido() {

  const productos =
    document.querySelectorAll(
      ".menu-item"
    );


  productos.forEach(
    function (producto) {

      // Evitar botones duplicados

      if (
        producto.querySelector(
          ".boton-hacer-pedido"
        )
      ) {

        return;

      }


      const elementoNombre =
        producto.querySelector(
          ".item-info h4"
        );


      const elementoPrecio =
        producto.querySelector(
          ".item-price"
        );


      if (
        !elementoNombre ||
        !elementoPrecio
      ) {

        return;

      }


      const nombre =
        elementoNombre.textContent.trim();


      const precio =
        obtenerPrecio(
          elementoPrecio.textContent
        );


      // Crear botón

      const boton =
        document.createElement("button");


      boton.type =
        "button";


      boton.className =
        "boton-hacer-pedido";


      boton.innerHTML = `
        <i class="fa-solid fa-cart-shopping"></i>
        Hacer pedido
      `;


      boton.addEventListener(
        "click",
        function () {

          abrirPedido(
            nombre,
            precio
          );

        }
      );


      producto.appendChild(
        boton
      );

    }
  );

}


// ============================================
// ACTIVAR BOTONES DE PROMOCIONES / COMBOS
// ============================================

function activarBotonesPromociones() {

  const promociones =
    document.querySelectorAll(
      ".promo-card"
    );


  promociones.forEach(
    function (promocion) {

      // Buscar nombre

      const elementoNombre =
        promocion.querySelector(
          ".promo-title"
        );


      // Buscar precio

      const elementoPrecio =
        promocion.querySelector(
          ".promo-price"
        );


      // Buscar botón existente

      const boton =
        promocion.querySelector(
          ".btn"
        );


      if (
        !elementoNombre ||
        !elementoPrecio ||
        !boton
      ) {

        return;

      }


      const nombre =
        elementoNombre.textContent.trim();


      const precio =
        obtenerPrecio(
          elementoPrecio.textContent
        );


      // El botón originalmente puede tener:
      // href="#contacto"

      boton.removeAttribute(
        "href"
      );


      boton.setAttribute(
        "type",
        "button"
      );


      boton.innerHTML = `
        <i class="fa-solid fa-cart-shopping"></i>
        Hacer pedido
      `;


      boton.addEventListener(
        "click",
        function (event) {

          event.preventDefault();


          abrirPedido(
            nombre,
            precio
          );

        }
      );

    }
  );

}


// ============================================
// INICIALIZAR
// ============================================

document.addEventListener(
  "DOMContentLoaded",
  function () {

    activarBotonesPedido();

    activarBotonesPromociones();

  }
);
