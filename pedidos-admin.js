// ============================================
// PANEL DE ADMINISTRACIÓN DE PEDIDOS
// RINCÓN & CAFÉ
// ============================================

import {
  auth,
  db,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  collection,
  onSnapshot,
  updateDoc,
  deleteDoc,
  doc
} from "./firebase-init.js";

import { ADMIN_EMAIL } from "./firebase-config.js";

// ============================================
// ELEMENTOS DEL HTML
// ============================================

const bloqueSinAcceso = document.getElementById("bloque-sin-acceso");
const bloqueAdmin = document.getElementById("bloque-admin");

const formularioLogin = document.getElementById("formulario-login");
const inputPassword = document.getElementById("login-password");
const mensajeLogin = document.getElementById("mensaje-login");

const botonCerrarSesion = document.getElementById("btn-cerrar-sesion");

const resumenTotal = document.getElementById("resumen-total");
const resumenPendientes = document.getElementById("resumen-pendientes");
const resumenPreparando = document.getElementById("resumen-preparando");
const resumenListos = document.getElementById("resumen-listos");

const listaPedidos = document.getElementById("lista-pedidos");
const estadoConexion = document.getElementById("estado-conexion");

let pedidos = [];

// Esta variable permite detener el listener
// cuando el administrador cierra sesión.
let detenerEscuchaPedidos = null;

// ============================================
// COMPROBAR SESIÓN
// ============================================

onAuthStateChanged(auth, (usuario) => {

  // ------------------------------------------
  // NO HAY USUARIO
  // ------------------------------------------

  if (!usuario) {

    if (detenerEscuchaPedidos) {
      detenerEscuchaPedidos();
      detenerEscuchaPedidos = null;
    }

    mostrarLogin();

    return;
  }

  // ------------------------------------------
  // COMPROBAR QUE SEA EL ADMINISTRADOR
  // ------------------------------------------

  if (usuario.email !== ADMIN_EMAIL) {

    signOut(auth);

    mostrarLogin();

    if (mensajeLogin) {
      mensajeLogin.textContent =
        "Esta cuenta no tiene permiso para acceder al panel.";

      mensajeLogin.style.color = "#b94a48";
    }

    return;
  }

  // ------------------------------------------
  // ADMINISTRADOR CORRECTO
  // ------------------------------------------

  ocultarLogin();

  bloqueAdmin.classList.remove("oculto");

  // Evita crear varios listeners
  // si se inicia/cierra sesión varias veces.
  if (detenerEscuchaPedidos) {
    detenerEscuchaPedidos();
    detenerEscuchaPedidos = null;
  }

  escucharPedidos();
});

// ============================================
// MOSTRAR LOGIN
// ============================================

function mostrarLogin() {

  bloqueSinAcceso.classList.remove("oculto");
  bloqueAdmin.classList.add("oculto");

  if (formularioLogin) {
    formularioLogin.classList.remove("oculto");
  }
}

// ============================================
// OCULTAR LOGIN
// ============================================

function ocultarLogin() {

  bloqueSinAcceso.classList.add("oculto");

  if (formularioLogin) {
    formularioLogin.classList.add("oculto");
  }
}

// ============================================
// INICIAR SESIÓN
// ============================================

if (formularioLogin) {

  formularioLogin.addEventListener("submit", async (evento) => {

    evento.preventDefault();

    const password = inputPassword.value.trim();

    if (!password) {

      mensajeLogin.textContent =
        "Ingresá la contraseña.";

      mensajeLogin.style.color = "#b94a48";

      return;
    }

    try {

      mensajeLogin.textContent =
        "Iniciando sesión...";

      mensajeLogin.style.color = "#6f4e37";

      await signInWithEmailAndPassword(
        auth,
        ADMIN_EMAIL,
        password
      );

      inputPassword.value = "";
      mensajeLogin.textContent = "";

    } catch (error) {

      console.error(
        "Error al iniciar sesión:",
        error
      );

      mensajeLogin.textContent =
        "Contraseña incorrecta.";

      mensajeLogin.style.color = "#b94a48";
    }

  });

}

// ============================================
// CERRAR SESIÓN
// ============================================

if (botonCerrarSesion) {

  botonCerrarSesion.addEventListener(
    "click",
    async () => {

      try {

        await signOut(auth);

      } catch (error) {

        console.error(
          "Error al cerrar sesión:",
          error
        );

      }

    }
  );

}

// ============================================
// ESCUCHAR PEDIDOS
// ============================================

function escucharPedidos() {

  const referenciaPedidos =
    collection(db, "pedidos");

  detenerEscuchaPedidos = onSnapshot(
    referenciaPedidos,

    (snapshot) => {

      pedidos = [];

      snapshot.forEach((documento) => {

        pedidos.push({
          id: documento.id,
          ...documento.data()
        });

      });

      // Ordenar del más nuevo al más viejo
      pedidos.sort((a, b) => {

        const fechaA = a.fecha
          ? new Date(a.fecha).getTime()
          : 0;

        const fechaB = b.fecha
          ? new Date(b.fecha).getTime()
          : 0;

        return fechaB - fechaA;

      });

      if (estadoConexion) {
        estadoConexion.textContent =
          "● Conectado en tiempo real";
      }

      renderizarResumen();
      renderizarPedidos();

    },

    (error) => {

      console.error(
        "Error al escuchar pedidos:",
        error
      );

      if (estadoConexion) {
        estadoConexion.textContent =
          "● Error de conexión";
      }

    }
  );

}

// ============================================
// RESUMEN
// ============================================

function renderizarResumen() {

  if (resumenTotal) {
    resumenTotal.textContent =
      pedidos.length;
  }

  if (resumenPendientes) {
    resumenPendientes.textContent =
      pedidos.filter(
        pedido => pedido.estado === "Pendiente"
      ).length;
  }

  if (resumenPreparando) {
    resumenPreparando.textContent =
      pedidos.filter(
        pedido => pedido.estado === "Preparando"
      ).length;
  }

  if (resumenListos) {
    resumenListos.textContent =
      pedidos.filter(
        pedido => pedido.estado === "Listo"
      ).length;
  }

}

// ============================================
// MOSTRAR PEDIDOS
// ============================================

function renderizarPedidos() {

  if (!listaPedidos) {
    return;
  }

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
    .map(pedido => crearTarjetaPedido(pedido))
    .join("");

}

// ============================================
// CREAR TARJETA DE PEDIDO
// ============================================

function crearTarjetaPedido(pedido) {

  const estado =
    pedido.estado || "Pendiente";

  const claseEstado =
    obtenerClaseEstado(estado);

  const fecha =
    pedido.fecha
      ? formatearFecha(pedido.fecha)
      : "Fecha no disponible";

  const productos =
    Array.isArray(pedido.productos)
      ? pedido.productos
      : [];

  const productosHTML =
    productos
      .map(producto => {

        const nombre =
          producto.nombre || "Producto";

        const cantidad =
          Number(producto.cantidad) || 0;

        const precio =
          Number(producto.precio) || 0;

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

  const observaciones =
    pedido.observaciones
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
            Pedido #${escaparHTML(
              String(pedido.id).substring(0, 6)
            )}
          </h3>

          <div class="pedido-fecha">
            ${escaparHTML(fecha)}
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
            ${escaparHTML(
              pedido.nombre || "Sin nombre"
            )}
          </span>

        </div>

        <div class="dato">

          <span class="dato-label">
            WhatsApp
          </span>

          <span class="dato-valor">
            ${escaparHTML(
              pedido.whatsapp || "No indicado"
            )}
          </span>

        </div>

        <div class="dato">

          <span class="dato-label">
            Sector
          </span>

          <span class="dato-valor">
            ${escaparHTML(
              pedido.sector || "No indicado"
            )}
          </span>

        </div>

      </div>

      <div class="pedido-productos">

        <h3>🛒 Productos</h3>

        ${
          productosHTML ||
          "<p>No se encontraron productos.</p>"
        }

      </div>

      ${observaciones}

      <div class="pedido-total">

        <span>Total</span>

        <strong>
          ${formatearPrecio(pedido.total)}
        </strong>

      </div>

<div class="pedido-acciones">

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
    onclick="finalizarPedido('${pedido.id}', 'Entregado')"
  >
    Entregado
  </button>

  <button
    class="btn-estado btn-cancelado"
    onclick="finalizarPedido('${pedido.id}', 'Cancelado')"
  >
    Cancelado
  </button>

</div>

    </article>
  `;

}

// ============================================
// CAMBIAR ESTADO
// ============================================

window.cambiarEstadoPedido =
  async function (id, nuevoEstado) {

    try {

      await updateDoc(
        doc(db, "pedidos", id),
        {
          estado: nuevoEstado
        }
      );

    } catch (error) {

      console.error(
        "Error al cambiar estado:",
        error
      );

      alert(
        "No se pudo cambiar el estado."
      );

    }

  };

// ============================================
// ELIMINAR PEDIDO
// ============================================

window.eliminarPedido =
  async function (id) {

    if (
      !confirm(
        "¿Seguro que querés eliminar este pedido?"
      )
    ) {
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

  const fechaObjeto =
    new Date(fecha);

  if (
    isNaN(
      fechaObjeto.getTime()
    )
  ) {

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
  ).format(
    Number(valor) || 0
  );

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
// SEGURIDAD HTML
// ============================================

function escaparHTML(texto) {

  return String(texto)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

}
