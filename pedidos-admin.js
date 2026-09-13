// ============================================
// PANEL DE ADMINISTRACIÓN DE PEDIDOS
// RINCÓN & CAFÉ
// ============================================

import {
  auth,
  db,
  onAuthStateChanged,
  collection,
  onSnapshot,
  updateDoc,
  deleteDoc,
  doc
} from "./firebase-init.js";


// ============================================
// VARIABLES
// ============================================

let pedidos = [];


// ============================================
// ELEMENTOS DEL HTML
// ============================================

const bloqueSinAcceso =
  document.getElementById("bloque-sin-acceso");

const bloqueAdmin =
  document.getElementById("bloque-admin");

const listaPedidos =
  document.getElementById("lista-pedidos");

const resumenTotal =
  document.getElementById("resumen-total");

const resumenPendientes =
  document.getElementById("resumen-pendientes");

const resumenPreparando =
  document.getElementById("resumen-preparando");

const resumenListos =
  document.getElementById("resumen-listos");


// ============================================
// CONTROL DE ACCESO
// ============================================

onAuthStateChanged(
  auth,
  function (user) {

    // ----------------------------------------
    // NO HAY USUARIO INICIADO
    // ----------------------------------------

    if (!user) {

      bloqueSinAcceso.classList.remove(
        "oculto"
      );

      bloqueAdmin.classList.add(
        "oculto"
      );

      return;
    }


    // ----------------------------------------
    // USUARIO AUTENTICADO
    // ----------------------------------------

    bloqueSinAcceso.classList.add(
      "oculto"
    );

    bloqueAdmin.classList.remove(
      "oculto"
    );


    // Empezar a escuchar pedidos
    escucharPedidos();
  }
);


// ============================================
// ESCUCHAR PEDIDOS EN TIEMPO REAL
// ============================================

function escucharPedidos() {

  const referenciaPedidos =
    collection(
      db,
      "pedidos"
    );


  onSnapshot(
    referenciaPedidos,

    function (snapshot) {

      pedidos = [];


      snapshot.forEach(
        function (documento) {

          pedidos.push({
            id: documento.id,
            ...documento.data()
          });

        }
      );


      // --------------------------------------
      // ORDENAR DEL MÁS NUEVO AL MÁS VIEJO
      // --------------------------------------

      pedidos.sort(
        function (a, b) {

          const fechaA =
            obtenerFecha(a.fecha);

          const fechaB =
            obtenerFecha(b.fecha);

          return fechaB - fechaA;
        }
      );


      // --------------------------------------
      // ACTUALIZAR PANTALLA
      // --------------------------------------

      mostrarPedidos();

      actualizarResumen();
    },


    function (error) {

      console.error(
        "Error al escuchar pedidos:",
        error
      );


      listaPedidos.innerHTML = `
        <div class="sin-pedidos">

          <h3>
            ⚠️ No se pudieron cargar los pedidos
          </h3>

          <p>
            Ocurrió un error al conectar con
            la colección "pedidos" de Firebase.
          </p>

          <p>
            Revisá la consola del navegador
            para ver más información.
          </p>

        </div>
      `;
    }
  );
}


// ============================================
// OBTENER FECHA
// ============================================

function obtenerFecha(fecha) {

  if (!fecha) {
    return 0;
  }


  // Timestamp de Firebase

  if (
    typeof fecha.toDate === "function"
  ) {

    return fecha.toDate().getTime();
  }


  // Date normal

  if (
    fecha instanceof Date
  ) {

    return fecha.getTime();
  }


  // Texto / ISO

  const fechaConvertida =
    new Date(fecha);


  if (
    isNaN(
      fechaConvertida.getTime()
    )
  ) {

    return 0;
  }


  return fechaConvertida.getTime();
}


// ============================================
// FORMATEAR FECHA
// ============================================

function formatearFecha(fecha) {

  const numeroFecha =
    obtenerFecha(fecha);


  if (!numeroFecha) {
    return "Fecha desconocida";
  }


  return new Intl.DateTimeFormat(
    "es-AR",
    {
      dateStyle: "short",
      timeStyle: "short"
    }
  ).format(
    new Date(numeroFecha)
  );
}


// ============================================
// FORMATEAR PRECIO
// ============================================

function formatearPrecio(valor) {

  const numero =
    Number(valor) || 0;


  return new Intl.NumberFormat(
    "es-AR",
    {
      style: "currency",
      currency: "ARS",
      maximumFractionDigits: 0
    }
  ).format(numero);
}


// ============================================
// ESCAPAR HTML
// ============================================

function escaparHTML(texto) {

  if (
    texto === null ||
    texto === undefined
  ) {

    return "";
  }


  return String(texto)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}


// ============================================
// OBTENER CLASE DEL ESTADO
// ============================================

function obtenerClaseEstado(estado) {

  switch (estado) {

    case "Pendiente":
      return "estado-pendiente";

    case "Preparando":
      return "estado-preparando";

    case "Listo":
      return "estado-listo";

    case "Entregado":
      return "estado-entregado";

    case "Cancelado":
      return "estado-cancelado";

    default:
      return "estado-pendiente";
  }
}


// ============================================
// MOSTRAR PEDIDOS
// ============================================

function mostrarPedidos() {

  // ----------------------------------------
  // NO HAY PEDIDOS
  // ----------------------------------------

  if (
    pedidos.length === 0
  ) {

    listaPedidos.innerHTML = `
      <div class="sin-pedidos">

        <h3>
          📭 No hay pedidos todavía
        </h3>

        <p>
          Cuando un cliente haga un pedido,
          aparecerá automáticamente aquí.
        </p>

      </div>
    `;

    return;
  }


  // ----------------------------------------
  // CREAR LAS TARJETAS
  // ----------------------------------------

  listaPedidos.innerHTML =
    pedidos
      .map(
        function (pedido) {

          return crearPedidoHTML(
            pedido
          );
        }
      )
      .join("");


  // Activar botones

  agregarEventosPedidos();
}


// ============================================
// CREAR HTML DE UN PEDIDO
// ============================================

function crearPedidoHTML(pedido) {

  const estado =
    pedido.estado || "Pendiente";


  const claseEstado =
    obtenerClaseEstado(estado);


  const nombreCliente =
    escaparHTML(
      pedido.nombre ||
      "Sin nombre"
    );


  const whatsapp =
    escaparHTML(
      pedido.whatsapp ||
      "Sin teléfono"
    );


  const sector =
    escaparHTML(
      pedido.sector ||
      "Sin sector"
    );


  const observaciones =
    pedido.observaciones || "";


  // ========================================
  // PRODUCTOS
  // ========================================

  let productosHTML = "";


  if (
    Array.isArray(pedido.productos) &&
    pedido.productos.length > 0
  ) {

    productosHTML =
      pedido.productos
        .map(
          function (producto) {

            const nombreProducto =
              escaparHTML(
                producto.nombre ||
                "Producto"
              );


            const cantidad =
              Number(
                producto.cantidad
              ) || 1;


            const precio =
              Number(
                producto.precio
              ) || 0;


            const subtotal =
              Number(
                producto.subtotal
              ) ||
              precio * cantidad;


            return `
              <div class="producto-linea">

                <div>

                  <div class="producto-nombre">
                    ${nombreProducto}
                  </div>

                  <div class="producto-detalle">
                    ${cantidad} ×
                    ${formatearPrecio(precio)}
                  </div>

                </div>

                <div class="producto-subtotal">
                  ${formatearPrecio(subtotal)}
                </div>

              </div>
            `;
          }
        )
        .join("");

  } else {

    productosHTML = `
      <div class="producto-linea">

        <div>
          No se encontraron productos.
        </div>

      </div>
    `;
  }


  // ========================================
  // OBSERVACIONES
  // ========================================

  const observacionesHTML =
    observaciones.trim()
      ? `
        <div class="pedido-observaciones">

          <strong>
            📝 Observaciones
          </strong>

          <p>
            ${escaparHTML(observaciones)}
          </p>

        </div>
      `
      : "";


  // ========================================
  // ID CORTO DEL PEDIDO
  // ========================================

  const idCorto =
    pedido.id
      ? pedido.id.substring(0, 6)
      : "------";


  // ========================================
  // HTML COMPLETO
  // ========================================

  return `
    <article
      class="pedido-card"
      data-id="${escaparHTML(pedido.id)}"
    >

      <!-- CABECERA -->

      <div class="pedido-cabecera">

        <div>

          <h3 class="pedido-numero">
            Pedido #${escaparHTML(idCorto)}
          </h3>

          <div class="pedido-fecha">
            ${formatearFecha(pedido.fecha)}
          </div>

        </div>


        <span
          class="estado-badge ${claseEstado}"
        >
          ${escaparHTML(estado)}
        </span>

      </div>


      <!-- DATOS DEL CLIENTE -->

      <div class="pedido-datos">

        <div class="dato">

          <span class="dato-label">
            Cliente
          </span>

          <span class="dato-valor">
            ${nombreCliente}
          </span>

        </div>


        <div class="dato">

          <span class="dato-label">
            WhatsApp / Teléfono
          </span>

          <span class="dato-valor">
            ${whatsapp}
          </span>

        </div>


        <div class="dato">

          <span class="dato-label">
            Sector
          </span>

          <span class="dato-valor">
            ${sector}
          </span>

        </div>

      </div>


      <!-- PRODUCTOS -->

      <div class="pedido-productos">

        <h3>
          ☕ Productos
        </h3>

        ${productosHTML}

      </div>


      <!-- OBSERVACIONES -->

      ${observacionesHTML}


      <!-- TOTAL -->

      <div class="pedido-total">

        <span>
          Total
        </span>

        <strong>
          ${formatearPrecio(pedido.total)}
        </strong>

      </div>


      <!-- ACCIONES -->

      <div class="pedido-acciones">

        <button
          type="button"
          class="btn-estado btn-pendiente"
          data-accion="estado"
          data-estado="Pendiente"
          data-id="${escaparHTML(pedido.id)}"
        >
          🟡 Pendiente
        </button>


        <button
          type="button"
          class="btn-estado btn-preparando"
          data-accion="estado"
          data-estado="Preparando"
          data-id="${escaparHTML(pedido.id)}"
        >
          🟠 Preparando
        </button>


        <button
          type="button"
          class="btn-estado btn-listo"
          data-accion="estado"
          data-estado="Listo"
          data-id="${escaparHTML(pedido.id)}"
        >
          🟢 Listo
        </button>


        <button
          type="button"
          class="btn-estado btn-entregado"
          data-accion="estado"
          data-estado="Entregado"
          data-id="${escaparHTML(pedido.id)}"
        >
          ✅ Entregado
        </button>


        <button
          type="button"
          class="btn-eliminar"
          data-accion="eliminar"
          data-id="${escaparHTML(pedido.id)}"
        >
          🗑️ Eliminar
        </button>

      </div>

    </article>
  `;
}


// ============================================
// ACTIVAR BOTONES
// ============================================

function agregarEventosPedidos() {

  // ----------------------------------------
  // BOTONES DE ESTADO
  // ----------------------------------------

  const botonesEstado =
    document.querySelectorAll(
      '[data-accion="estado"]'
    );


  botonesEstado.forEach(
    function (boton) {

      boton.addEventListener(
        "click",
        function () {

          const id =
            boton.dataset.id;

          const estado =
            boton.dataset.estado;

          cambiarEstado(
            id,
            estado
          );
        }
      );
    }
  );


  // ----------------------------------------
  // BOTONES ELIMINAR
  // ----------------------------------------

  const botonesEliminar =
    document.querySelectorAll(
      '[data-accion="eliminar"]'
    );


  botonesEliminar.forEach(
    function (boton) {

      boton.addEventListener(
        "click",
        function () {

          const id =
            boton.dataset.id;

          eliminarPedido(id);
        }
      );
    }
  );
}


// ============================================
// CAMBIAR ESTADO
// ============================================

async function cambiarEstado(
  id,
  nuevoEstado
) {

  const pedido =
    pedidos.find(
      function (item) {

        return item.id === id;

      }
    );


  if (!pedido) {
    return;
  }


  // Si ya tiene ese estado,
  // no hacemos nada.

  if (
    pedido.estado === nuevoEstado
  ) {

    return;
  }


  try {

    await updateDoc(
      doc(
        db,
        "pedidos",
        id
      ),
      {
        estado: nuevoEstado
      }
    );


    console.log(
      "Pedido actualizado:",
      id,
      nuevoEstado
    );

  } catch (error) {

    console.error(
      "Error al cambiar el estado:",
      error
    );


    alert(
      "No se pudo cambiar el estado del pedido."
    );
  }
}


// ============================================
// ELIMINAR PEDIDO
// ============================================

async function eliminarPedido(id) {

  const pedido =
    pedidos.find(
      function (item) {

        return item.id === id;

      }
    );


  if (!pedido) {
    return;
  }


  const nombre =
    pedido.nombre ||
    "este cliente";


  const confirmar =
    confirm(
      "¿Seguro que querés eliminar este pedido?\n\n" +
      "Cliente: " +
      nombre +
      "\n\n" +
      "Esta acción no se puede deshacer."
    );


  if (!confirmar) {
    return;
  }


  try {

    await deleteDoc(
      doc(
        db,
        "pedidos",
        id
      )
    );


    console.log(
      "Pedido eliminado:",
      id
    );

  } catch (error) {

    console.error(
      "Error al eliminar el pedido:",
      error
    );


    alert(
      "No se pudo eliminar el pedido."
    );
  }
}


// ============================================
// ACTUALIZAR RESUMEN
// ============================================

function actualizarResumen() {

  const total =
    pedidos.length;


  const pendientes =
    pedidos.filter(
      function (pedido) {

        return (
          (pedido.estado || "Pendiente") ===
          "Pendiente"
        );

      }
    ).length;


  const preparando =
    pedidos.filter(
      function (pedido) {

        return (
          pedido.estado ===
          "Preparando"
        );

      }
    ).length;


  const listos =
    pedidos.filter(
      function (pedido) {

        return (
          pedido.estado ===
          "Listo"
        );

      }
    ).length;


  resumenTotal.textContent =
    total;


  resumenPendientes.textContent =
    pendientes;


  resumenPreparando.textContent =
    preparando;


  resumenListos.textContent =
    listos;
}
