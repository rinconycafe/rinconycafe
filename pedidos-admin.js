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
// ELEMENTOS DEL HTML
// ============================================

const bloqueSinAcceso = document.getElementById("bloque-sin-acceso");
const bloqueAdmin = document.getElementById("bloque-admin");

const resumenTotal = document.getElementById("resumen-total");
const resumenPendientes = document.getElementById("resumen-pendientes");
const resumenPreparando = document.getElementById("resumen-preparando");
const resumenListos = document.getElementById("resumen-listos");

const listaPedidos = document.getElementById("lista-pedidos");
const estadoConexion = document.getElementById("estado-conexion");

// ============================================
// PEDIDOS CARGADOS
// ============================================

let pedidos = [];

// ============================================
// COMPROBAR SESIÓN
// ============================================

onAuthStateChanged(auth, (usuario) => {

  if (!usuario) {

    bloqueSinAcceso.classList.remove("oculto");
    bloqueAdmin.classList.add("oculto");

    return;
  }

  // Usuario autenticado
  bloqueSinAcceso.classList.add("oculto");
  bloqueAdmin.classList.remove("oculto");

  escucharPedidos();
});

// ============================================
// ESCUCHAR PEDIDOS DE FIRESTORE
// ============================================

function escucharPedidos() {

  try {

    const referenciaPedidos = collection(db, "pedidos");

    onSnapshot(
      referenciaPedidos,

      (snapshot) => {

        pedidos = [];

        snapshot.forEach((documento) => {

          pedidos.push({
            id: documento.id,
            ...documento.data()
          });

        });

        // Ordenar del más nuevo al más antiguo
        pedidos.sort((a, b) => {

          const fechaA = a.fecha
            ? new Date(a.fecha).getTime()
            : 0;

          const fechaB = b.fecha
            ? new Date(b.fecha).getTime()
            : 0;

          return fechaB - fechaA;

        });

        estadoConexion.textContent = "● Conectado en tiempo real";

        renderizarResumen();
        renderizarPedidos();

      },

      (error) => {

        console.error("Error al escuchar pedidos:", error);

        estadoConexion.textContent =
          "● Error de conexión";

        listaPedidos.innerHTML = `
          <div class="sin-pedidos">
            <h3>⚠️ No se pudieron cargar los pedidos</h3>
            <p>
              Revisá la consola del navegador para ver el error.
            </p>
          </div>
        `;

      }
    );

  } catch (error) {

    console.error("Error iniciando pedidos:", error);

  }

}

// ============================================
// RESUMEN
// ============================================

function renderizarResumen() {

  const total = pedidos.length;

  const pendientes = pedidos.filter(
    (pedido) => pedido.estado === "Pendiente"
  ).length;

  const preparando = pedidos.filter(
    (pedido) => pedido.estado === "Preparando"
  ).length;

  const listos = pedidos.filter(
    (pedido) => pedido.estado === "Listo"
  ).length;

  resumenTotal.textContent = total;
  resumenPendientes.textContent = pendientes;
  resumenPreparando.textContent = preparando;
  resumenListos.textContent = listos;
}

// ============================================
// MOSTRAR PEDIDOS
// ============================================

function renderizarPedidos() {

  if (pedidos.length === 0) {

    listaPedidos.innerHTML = `
      <div class="sin-pedidos">

        <h3>☕ No hay pedidos todavía</h3>

        <p>
          Cuando un cliente realice un pedido,
          aparecerá aquí automáticamente.
        </p>

      </div>
    `;

    return;
  }

  listaPedidos.innerHTML = pedidos
    .map((pedido) => crearTarjetaPedido(pedido))
    .join("");
}

// ============================================
// CREAR TARJETA DE PEDIDO
// ============================================

function crearTarjetaPedido(pedido) {

  const estado = pedido.estado || "Pendiente";

  const claseEstado = obtenerClaseEstado(estado);

  const fecha = pedido.fecha
    ? formatearFecha(pedido.fecha)
    : "Fecha no disponible";

  const productos = Array.isArray(pedido.productos)
    ? pedido.productos
    : [];

  const productosHTML = productos
    .map((producto) => {

      const nombre = producto.nombre || "Producto";

      const cantidad = Number(producto.cantidad) || 0;

      const precio = Number(producto.precio) || 0;

      const subtotal =
        Number(producto.subtotal) ||
        cantidad * precio;

      return `
        <div class="producto-linea">

          <div>
            <div class="producto-nombre">
              ${escaparHTML(nombre)}
            </div>

            <div class="producto-detalle">
              ${cantidad} × ${formatearPrecio(precio)}
            </div>
          </div>

          <div class="producto-subtotal">
            ${formatearPrecio(subtotal)}
          </div>

        </div>
      `;

    })
    .join("");

  const observaciones = pedido.observaciones
    ? `
      <div class="pedido-observaciones">

        <strong>📝 Observaciones</strong>

        <p>
          ${escaparHTML(pedido.observaciones)}
        </p>

      </div>
    `
    : "";

  return `
    <article class="pedido-card">

      <div class="pedido-cabecera">

        <div>

          <h3 class="pedido-numero">
            Pedido #${pedido.id.substring(0, 6)}
          </h3>

          <div class="pedido-fecha">
            ${fecha}
          </div>

        </div>

        <span class="estado-badge ${claseEstado}">
          ${escaparHTML(estado)}
        </span>

      </div>


      <div class="pedido-datos">

        <div class="dato">

          <span class="dato-label">
            Cliente
          </span>

          <span class="dato-valor">
            ${escaparHTML(pedido.nombre || "Sin nombre")}
          </span>

        </div>


        <div class="dato">

          <span class="dato-label">
            WhatsApp
          </span>

          <span class="dato-valor">
            ${escaparHTML(pedido.whatsapp || "No indicado")}
          </span>

        </div>


        <div class="dato">

          <span class="dato-label">
            Sector
          </span>

          <span class="dato-valor">
            ${escaparHTML(pedido.sector || "No indicado")}
          </span>

        </div>

      </div>


      <div class="pedido-productos">

        <h3>
          🛒 Productos
        </h3>

        ${productosHTML}

      </div>


      ${observaciones}


      <div class="pedido-total">

        <span>
          Total
        </span>

        <strong>
          ${formatearPrecio(pedido.total)}
        </strong>

      </div>


      <div class="pedido-acciones">

        <button
          class="btn-estado btn-pendiente"
          onclick="cambiarEstadoPedido('${pedido.id}', 'Pendiente')"
        >
          Pendiente
        </button>

        <button
          class="btn-estado btn-preparando"
          onclick="cambiarEstadoPedido('${pedido.id}', 'Preparando')"
        >
          Preparando
        </button>

        <button
          class="btn-estado btn-listo"
          onclick="cambiarEstadoPedido('${pedido.id}', 'Listo')"
        >
          Listo
        </button>

        <button
          class="btn-estado btn-entregado"
          onclick="cambiarEstadoPedido('${pedido.id}', 'Entregado')"
        >
          Entregado
        </button>

        <button
          class="btn-eliminar"
          onclick="eliminarPedido('${pedido.id}')"
        >
          🗑️ Eliminar
        </button>

      </div>

    </article>
  `;
}

// ============================================
// CAMBIAR ESTADO
// ============================================

window.cambiarEstadoPedido = async function (id, nuevoEstado) {

  try {

    await updateDoc(
      doc(db, "pedidos", id),
      {
        estado: nuevoEstado
      }
    );

    console.log(
      `Pedido actualizado a: ${nuevoEstado}`
    );

  } catch (error) {

    console.error(
      "Error al cambiar estado:",
      error
    );

    alert(
      "No se pudo cambiar el estado del pedido."
    );

  }

};

// ============================================
// ELIMINAR PEDIDO
// ============================================

window.eliminarPedido = async function (id) {

  const confirmar = confirm(
    "¿Seguro que querés eliminar este pedido?\n\nEsta acción no se puede deshacer."
  );

  if (!confirmar) {
    return;
  }

  try {

    await deleteDoc(
      doc(db, "pedidos", id)
    );

  } catch (error) {

    console.error(
      "Error al eliminar pedido:",
      error
    );

    alert(
      "No se pudo eliminar el pedido."
    );

  }

};

// ============================================
// FORMATEAR FECHA
// ============================================

function formatearFecha(fecha) {

  const fechaObjeto = new Date(fecha);

  if (isNaN(fechaObjeto.getTime())) {
    return "Fecha no válida";
  }

  return fechaObjeto.toLocaleString(
    "es-AR",
    {
      dateStyle: "short",
      timeStyle: "short"
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
  ).format(Number(valor) || 0);

}

// ============================================
// CLASE DEL ESTADO
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
// EVITAR HTML INYECTADO
// ============================================

function escaparHTML(texto) {

  return String(texto)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

}
