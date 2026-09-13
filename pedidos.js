// ============================================
// SISTEMA DE PEDIDOS - RINCÓN & CAFÉ
// ============================================

import {
  db,
  collection,
  addDoc
} from "./firebase-init.js";

// ============================================
// ESTILOS DEL SISTEMA DE PEDIDOS
// ============================================

const estilos = document.createElement("style");

estilos.textContent = `
/* Fondo de la ventana */
.pedido-overlay {
  position: fixed;
  inset: 0;
  background: rgba(60, 36, 21, 0.75);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  z-index: 9999;
  opacity: 0;
  visibility: hidden;
  transition: opacity 0.25s ease, visibility 0.25s ease;
}

/* Ventana visible */
.pedido-overlay.activo {
  opacity: 1;
  visibility: visible;
}

/* Ventana del formulario */
.pedido-modal {
  width: 100%;
  max-width: 520px;
  max-height: 90vh;
  overflow-y: auto;
  background: #faf6f0;
  border-radius: 18px;
  padding: 28px;
  box-shadow: 0 20px 60px rgba(0,0,0,0.30);
  position: relative;
  transform: translateY(20px);
  transition: transform 0.25s ease;
}

.pedido-overlay.activo .pedido-modal {
  transform: translateY(0);
}

/* Botón cerrar */
.pedido-cerrar {
  position: absolute;
  top: 12px;
  right: 15px;
  width: 38px;
  height: 38px;
  border: none;
  border-radius: 50%;
  background: transparent;
  color: #6f4e37;
  font-size: 26px;
  cursor: pointer;
}

.pedido-cerrar:hover {
  background: #e8d0b5;
}

/* Título */
.pedido-titulo {
  margin: 0 40px 6px 0;
  color: #3c2415;
  font-size: 27px;
  font-family: "Playfair Display", serif;
}

.pedido-subtitulo {
  margin: 0 0 22px;
  color: #6f4e37;
  font-size: 14px;
}

/* Producto seleccionado */
.pedido-producto {
  background: #e8d0b5;
  border-radius: 12px;
  padding: 15px;
  margin-bottom: 20px;
}

.pedido-producto-nombre {
  font-weight: 700;
  color: #3c2415;
  margin-bottom: 5px;
}

.pedido-producto-precio {
  color: #6f4e37;
}

/* Campos */
.pedido-campo {
  margin-bottom: 16px;
}

.pedido-campo label {
  display: block;
  margin-bottom: 7px;
  color: #3c2415;
  font-weight: 600;
  font-size: 14px;
}

.pedido-campo input,
.pedido-campo textarea,
.pedido-campo select {
  width: 100%;
  box-sizing: border-box;
  padding: 12px 13px;
  border: 1px solid #d8c2aa;
  border-radius: 10px;
  background: white;
  color: #3c2415;
  font-family: inherit;
  font-size: 15px;
  outline: none;
}

.pedido-campo input:focus,
.pedido-campo textarea:focus,
.pedido-campo select:focus {
  border-color: #c86d51;
  box-shadow: 0 0 0 3px rgba(200, 109, 81, 0.12);
}

.pedido-campo textarea {
  min-height: 85px;
  resize: vertical;
}

/* Cantidad */
.pedido-cantidad {
  display: flex;
  align-items: center;
  gap: 12px;
}

.pedido-cantidad button {
  width: 38px;
  height: 38px;
  border: none;
  border-radius: 50%;
  background: #c86d51;
  color: white;
  font-size: 22px;
  cursor: pointer;
}

.pedido-cantidad button:hover {
  opacity: 0.85;
}

#pedido-cantidad-valor {
  min-width: 35px;
  text-align: center;
  font-size: 18px;
  font-weight: 700;
  color: #3c2415;
}

/* Total */
.pedido-total {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 22px;
  padding: 16px;
  border-radius: 12px;
  background: #3c2415;
  color: white;
  font-size: 18px;
  font-weight: 700;
}

#pedido-total-valor {
  color: #e8d0b5;
}

/* Botones */
.pedido-acciones {
  display: flex;
  gap: 10px;
  margin-top: 18px;
}

.pedido-btn {
  flex: 1;
  padding: 13px 16px;
  border-radius: 10px;
  border: none;
  cursor: pointer;
  font-weight: 700;
  font-family: inherit;
  font-size: 14px;
}

.pedido-btn-cancelar {
  background: #e8d0b5;
  color: #3c2415;
}

.pedido-btn-confirmar {
  background: #c86d51;
  color: white;
}

.pedido-btn-confirmar:hover {
  opacity: 0.9;
}

.pedido-btn-confirmar:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Mensajes */
.pedido-mensaje {
  margin-top: 15px;
  padding: 12px;
  border-radius: 10px;
  display: none;
  font-size: 14px;
}

.pedido-mensaje.visible {
  display: block;
}

.pedido-mensaje.exito {
  background: #dce8d8;
  color: #31552c;
}

.pedido-mensaje.error {
  background: #f3d6d0;
  color: #7a2f21;
}

/* Móvil */
@media (max-width: 600px) {
  .pedido-modal {
    padding: 22px;
    border-radius: 14px;
  }

  .pedido-titulo {
    font-size: 23px;
  }

  .pedido-acciones {
    flex-direction: column;
  }
}
`;

document.head.appendChild(estilos);


// ============================================
// CREAR LA VENTANA DEL PEDIDO
// ============================================

const overlay = document.createElement("div");

overlay.className = "pedido-overlay";

overlay.innerHTML = `
  <div class="pedido-modal">

    <button
      type="button"
      class="pedido-cerrar"
      id="pedido-cerrar"
      aria-label="Cerrar"
    >
      ×
    </button>

    <h2 class="pedido-titulo">Hacer pedido</h2>

    <p class="pedido-subtitulo">
      Completá tus datos para confirmar el pedido.
    </p>

    <div class="pedido-producto">
      <div
        class="pedido-producto-nombre"
        id="pedido-producto-nombre"
      ></div>

      <div
        class="pedido-producto-precio"
        id="pedido-producto-precio"
      ></div>
    </div>

    <div class="pedido-campo">

      <label>Cantidad</label>

      <div class="pedido-cantidad">

        <button
          type="button"
          id="pedido-cantidad-menos"
        >
          −
        </button>

        <span id="pedido-cantidad-valor">1</span>

        <button
          type="button"
          id="pedido-cantidad-mas"
        >
          +
        </button>

      </div>

    </div>

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

    <div class="pedido-campo">

      <label for="pedido-whatsapp">
        WhatsApp / teléfono
      </label>

      <input
        type="tel"
        id="pedido-whatsapp"
        placeholder="Ej.: 11 1234-5678"
        autocomplete="tel"
      >

    </div>

    <div class="pedido-campo">

      <label for="pedido-sector">
        Sector
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

    <div class="pedido-campo">

      <label for="pedido-observaciones">
        Observaciones
        <span style="font-weight:400;">
          (opcional)
        </span>
      </label>

      <textarea
        id="pedido-observaciones"
        placeholder="Ej.: sin azúcar, poca espuma, etc."
      ></textarea>

    </div>

    <div class="pedido-total">

      <span>Total</span>

      <span id="pedido-total-valor">
        $0
      </span>

    </div>

    <div class="pedido-acciones">

      <button
        type="button"
        class="pedido-btn pedido-btn-cancelar"
        id="pedido-cancelar"
      >
        Cancelar
      </button>

      <button
        type="button"
        class="pedido-btn pedido-btn-confirmar"
        id="pedido-confirmar"
      >
        Confirmar pedido
      </button>

    </div>

    <div
      class="pedido-mensaje"
      id="pedido-mensaje"
    ></div>

  </div>
`;

document.body.appendChild(overlay);


// ============================================
// VARIABLES
// ============================================

let productoSeleccionado = null;
let cantidad = 1;


// ============================================
// ELEMENTOS
// ============================================

const productoNombre =
  document.getElementById("pedido-producto-nombre");

const productoPrecio =
  document.getElementById("pedido-producto-precio");

const cantidadValor =
  document.getElementById("pedido-cantidad-valor");

const totalValor =
  document.getElementById("pedido-total-valor");

const inputNombre =
  document.getElementById("pedido-nombre");

const inputWhatsapp =
  document.getElementById("pedido-whatsapp");

const selectSector =
  document.getElementById("pedido-sector");

const inputObservaciones =
  document.getElementById("pedido-observaciones");

const mensaje =
  document.getElementById("pedido-mensaje");

const botonConfirmar =
  document.getElementById("pedido-confirmar");


// ============================================
// FORMATO DE PRECIO
// ============================================

function formatearPrecio(numero) {

  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0
  }).format(numero);

}


// ============================================
// ACTUALIZAR TOTAL
// ============================================

function actualizarTotal() {

  if (!productoSeleccionado) {
    return;
  }

  const total =
    productoSeleccionado.precio * cantidad;

  totalValor.textContent =
    formatearPrecio(total);

}


// ============================================
// ABRIR PEDIDO
// ============================================

function abrirPedido(nombre, precio) {

  productoSeleccionado = {
    nombre: nombre,
    precio: Number(precio)
  };

  cantidad = 1;

  productoNombre.textContent =
    productoSeleccionado.nombre;

  productoPrecio.textContent =
    formatearPrecio(productoSeleccionado.precio);

  cantidadValor.textContent =
    cantidad;

  inputNombre.value = "";
  inputWhatsapp.value = "";
  selectSector.value = "";
  inputObservaciones.value = "";

  mensaje.className = "pedido-mensaje";
  mensaje.textContent = "";

  botonConfirmar.disabled = false;

  actualizarTotal();

  overlay.classList.add("activo");

  setTimeout(() => {
    inputNombre.focus();
  }, 100);

}


// ============================================
// CERRAR PEDIDO
// ============================================

function cerrarPedido() {

  overlay.classList.remove("activo");

}


// ============================================
// BOTONES DE CANTIDAD
// ============================================

document
  .getElementById("pedido-cantidad-menos")
  .addEventListener("click", () => {

    if (cantidad > 1) {
      cantidad--;

      cantidadValor.textContent =
        cantidad;

      actualizarTotal();
    }

  });


document
  .getElementById("pedido-cantidad-mas")
  .addEventListener("click", () => {

    cantidad++;

    cantidadValor.textContent =
      cantidad;

    actualizarTotal();

  });


// ============================================
// CERRAR
// ============================================

document
  .getElementById("pedido-cerrar")
  .addEventListener("click", cerrarPedido);

document
  .getElementById("pedido-cancelar")
  .addEventListener("click", cerrarPedido);


// Cerrar tocando fuera de la ventana

overlay.addEventListener("click", (event) => {

  if (event.target === overlay) {
    cerrarPedido();
  }

});


// ============================================
// CONFIRMAR PEDIDO
// ============================================

botonConfirmar.addEventListener("click", async () => {

  const nombre =
    inputNombre.value.trim();

  const whatsapp =
    inputWhatsapp.value.trim();

  const sector =
    selectSector.value;

  const observaciones =
    inputObservaciones.value.trim();


  // Validaciones

  if (!nombre) {

    mostrarMensaje(
      "Por favor, ingresá tu nombre.",
      "error"
    );

    inputNombre.focus();

    return;
  }


  if (!whatsapp) {

    mostrarMensaje(
      "Por favor, ingresá tu WhatsApp o teléfono.",
      "error"
    );

    inputWhatsapp.focus();

    return;
  }


  if (!sector) {

    mostrarMensaje(
      "Por favor, seleccioná un sector.",
      "error"
    );

    selectSector.focus();

    return;
  }


  if (!productoSeleccionado) {

    mostrarMensaje(
      "No se pudo identificar el producto.",
      "error"
    );

    return;
  }


  // Desactivar botón para evitar
  // pedidos duplicados

  botonConfirmar.disabled = true;

  botonConfirmar.textContent =
    "Guardando pedido...";


  try {

    const total =
      productoSeleccionado.precio * cantidad;


    const pedido = {

      nombre: nombre,

      whatsapp: whatsapp,

      sector: sector,

      observaciones:
        observaciones || "",

      productos: [

        {

          nombre:
            productoSeleccionado.nombre,

          cantidad:
            cantidad,

          precio:
            productoSeleccionado.precio,

          subtotal:
            total

        }

      ],

      total: total,

      estado: "Pendiente",

      fecha:
        new Date().toISOString()

    };


    // Guardar en Firestore

    await addDoc(
      collection(db, "pedidos"),
      pedido
    );


    mostrarMensaje(
      "¡Pedido enviado correctamente! ☕",
      "exito"
    );


    botonConfirmar.textContent =
      "Pedido enviado ✓";


    setTimeout(() => {

      cerrarPedido();

      botonConfirmar.disabled = false;

      botonConfirmar.textContent =
        "Confirmar pedido";

    }, 2200);


  } catch (error) {

    console.error(
      "Error al guardar el pedido:",
      error
    );


    mostrarMensaje(
      "No se pudo enviar el pedido. Intentá nuevamente.",
      "error"
    );


    botonConfirmar.disabled = false;

    botonConfirmar.textContent =
      "Confirmar pedido";

  }

});


// ============================================
// MOSTRAR MENSAJE
// ============================================

function mostrarMensaje(texto, tipo) {

  mensaje.textContent = texto;

  mensaje.className =
    `pedido-mensaje visible ${tipo}`;

}


// ============================================
// BOTONES "HACER PEDIDO"
// ============================================
//
// Buscamos elementos que tengan:
// data-pedido-nombre
// data-pedido-precio
//
// Más adelante agregaremos estos atributos
// a los productos de index.html.
//

function activarBotonesPedido() {

  const botones =
    document.querySelectorAll(
      "[data-pedido-nombre][data-pedido-precio]"
    );


  botones.forEach((boton) => {

    // Evitar registrar el evento dos veces

    if (boton.dataset.pedidoActivado === "true") {
      return;
    }


    boton.dataset.pedidoActivado = "true";


    boton.addEventListener("click", () => {

      const nombre =
        boton.dataset.pedidoNombre;

      const precio =
        boton.dataset.pedidoPrecio;


      abrirPedido(
        nombre,
        precio
      );

    });

  });

}


// ============================================
// ACTIVAR BOTONES
// ============================================

activarBotonesPedido();


// ============================================
// EXPORTAR FUNCIÓN
// ============================================

export {
  abrirPedido,
  activarBotonesPedido
};
