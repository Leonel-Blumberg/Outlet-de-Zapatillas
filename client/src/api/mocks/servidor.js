// Backend simulado: responde los mismos endpoints de docs/contrato-api.md usando los datos de
// prueba de datos.js. Cada función hace en JavaScript lo que el backend hace con SQL, así que
// también sirve para comparar resultados con la API real.
import * as db from "./datos.js";

const LATENCIA_MS = 180;
const DIA_MS = 86_400_000;
const USUARIOS_KEY = "outlet.mock.usuarios";

class ErrorApi extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

// ---- Índices y utilidades ----

const porId = (lista) => new Map(lista.map((item) => [item.id, item]));
const sucursalPorId = porId(db.sucursales);
const marcaPorId = porId(db.marcas);
const categoriaPorId = porId(db.categorias);
const productoPorId = porId(db.productos);
const clientePorId = porId(db.clientes);

const suma = (lista, campo) => lista.reduce((total, item) => total + item[campo], 0);
const redondear1 = (n) => Math.round(n * 10) / 10;
const nombreCompleto = (c) => `${c.nombre} ${c.apellido}`;
const minusculas = (texto) => (texto ?? "").toLocaleLowerCase("es");
const diasEntre = (desde, hasta) =>
  Math.round((Date.parse(hasta) - Date.parse(desde)) / DIA_MS);

const ventasPorMes = new Map();
for (const v of db.ventas) {
  const clave = `${v.anio}-${v.mes}`;
  if (!ventasPorMes.has(clave)) ventasPorMes.set(clave, []);
  ventasPorMes.get(clave).push(v);
}
const ventasDelMes = ({ anio, mes }, idSucursal) =>
  (ventasPorMes.get(`${anio}-${mes}`) ?? []).filter(
    (v) => !idSucursal || v.idSucursal === idSucursal,
  );

const mesAnterior = ({ anio, mes }) =>
  mes === 1 ? { anio: anio - 1, mes: 12 } : { anio, mes: mes - 1 };

const objetivoDe = (idSucursal, { anio, mes }) =>
  db.objetivos.find((o) => o.idSucursal === idSucursal && o.anio === anio && o.mes === mes)
    ?.montoObjetivo ?? null;

// ---- Semáforos: mismas reglas que los CASE del contrato ----

function estadoObjetivo(ventas, objetivo) {
  if (!objetivo) return null;
  if (ventas >= objetivo) return "cumple";
  if (ventas >= objetivo * 0.8) return "atencion";
  return "critico";
}

function estadoStock(cantidad, minimo) {
  if (cantidad <= minimo) return "critico";
  if (cantidad <= minimo * 2) return "atencion";
  return "normal";
}

function estadoCliente(dias) {
  if (dias === null || dias > 90) return "inactivo";
  if (dias > 30) return "en_riesgo";
  return "activo";
}

const SEVERIDAD_STOCK = { critico: 0, atencion: 1, normal: 2 };

// ---- Datos derivados de cada cliente (lo que el backend calcula con GROUP BY) ----

const hace12Meses = (() => {
  const [anio, mes, dia] = db.FECHA_REFERENCIA.split("-").map(Number);
  return `${anio - 1}-${String(mes).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;
})();

const clientesConActividad = (() => {
  const ventasPorCliente = new Map();
  for (const v of db.ventas) {
    if (!ventasPorCliente.has(v.idCliente)) ventasPorCliente.set(v.idCliente, []);
    ventasPorCliente.get(v.idCliente).push(v);
  }

  return db.clientes.map((c) => {
    const compras = ventasPorCliente.get(c.id) ?? [];
    const ultima = compras.reduce((max, v) => (v.fecha > max ? v.fecha : max), "");

    // Sucursal habitual: la de más compras; si empatan, la de la compra más reciente
    const porSucursal = new Map();
    for (const v of compras) {
      const actual = porSucursal.get(v.idSucursal) ?? { cantidad: 0, ultima: "" };
      porSucursal.set(v.idSucursal, {
        cantidad: actual.cantidad + 1,
        ultima: v.fecha > actual.ultima ? v.fecha : actual.ultima,
      });
    }
    const [idHabitual] =
      [...porSucursal.entries()].sort(
        ([, a], [, b]) => b.cantidad - a.cantidad || b.ultima.localeCompare(a.ultima),
      )[0] ?? [];

    const ultimaCompra = ultima ? ultima.slice(0, 10) : null;
    const dias = ultimaCompra ? diasEntre(ultimaCompra, db.FECHA_REFERENCIA) : null;
    return {
      id: c.id,
      nombre: c.nombre,
      apellido: c.apellido,
      dni: c.dni,
      email: c.email,
      idSucursalHabitual: idHabitual ?? null,
      sucursalHabitual: idHabitual ? sucursalPorId.get(idHabitual).nombre : null,
      compras12Meses: compras.filter((v) => v.fecha >= hace12Meses).length,
      totalGastado: suma(compras, "total"),
      ultimaCompra,
      dias,
      estado: estadoCliente(dias),
    };
  });
})();

// ---- Parámetros ----

function leerPeriodo(q) {
  const anio = Number(q.anio);
  const mes = Number(q.mes);
  if (!Number.isInteger(anio) || !Number.isInteger(mes) || mes < 1 || mes > 12)
    throw new ErrorApi(400, "Indicá un año y un mes válidos.");
  return { anio, mes };
}

const leerId = (valor) => (valor ? Number(valor) : null);

function buscarSucursal(id) {
  const sucursal = sucursalPorId.get(Number(id));
  if (!sucursal) throw new ErrorApi(404, "No existe la sucursal.");
  return sucursal;
}

function paginar(lista, q, porDefecto = 10) {
  const porPagina = Math.min(100, Math.max(1, Number(q.porPagina) || porDefecto));
  const pagina = Math.max(1, Number(q.pagina) || 1);
  return {
    items: lista.slice((pagina - 1) * porPagina, pagina * porPagina),
    total: lista.length,
    pagina,
    porPagina,
  };
}

// Ventas, tickets, pares y cumplimiento de una sucursal en un mes
function filaSucursal(s, periodo) {
  const ventasMes = ventasDelMes(periodo, s.id);
  const ventas = suma(ventasMes, "total");
  const objetivo = objetivoDe(s.id, periodo);
  return {
    id: s.id,
    nombre: s.nombre,
    ciudad: s.ciudad,
    provincia: s.provincia,
    ventas,
    tickets: ventasMes.length,
    pares: suma(ventasMes, "pares"),
    objetivo,
    cumplimiento: objetivo ? redondear1((ventas * 100) / objetivo) : null,
    estado: estadoObjetivo(ventas, objetivo),
  };
}

function totalizar(filas) {
  const ventas = suma(filas, "ventas");
  const conObjetivo = filas.filter((f) => f.objetivo !== null);
  const objetivo = conObjetivo.length ? suma(conObjetivo, "objetivo") : null;
  return {
    ventas,
    tickets: suma(filas, "tickets"),
    pares: suma(filas, "pares"),
    objetivo,
    cumplimiento: objetivo ? redondear1((ventas * 100) / objetivo) : null,
    estado: estadoObjetivo(ventas, objetivo),
  };
}

const lineasDelMes = (periodo, idSucursal) =>
  ventasDelMes(periodo, idSucursal).flatMap((v) => v.lineas.map((l) => ({ ...l, venta: v })));

function stockDeProducto(idSucursal, idProducto) {
  const filas = db.stock.filter((st) => st.idSucursal === idSucursal && st.idProducto === idProducto);
  const estados = filas.map((st) => estadoStock(st.cantidad, st.stockMinimo));
  const peor = estados.sort((a, b) => SEVERIDAD_STOCK[a] - SEVERIDAD_STOCK[b])[0];
  return { stock: suma(filas, "cantidad"), estadoStock: peor ?? "critico" };
}

// ---- Endpoints del tablero ----

function catalogos() {
  return {
    fechaReferencia: db.FECHA_REFERENCIA,
    periodos: [...ventasPorMes.keys()]
      .map((clave) => {
        const [anio, mes] = clave.split("-").map(Number);
        return { anio, mes };
      })
      .sort((a, b) => b.anio - a.anio || b.mes - a.mes),
    sucursales: db.sucursales
      .map(({ id, nombre, ciudad, provincia }) => ({ id, nombre, ciudad, provincia }))
      .sort((a, b) => a.nombre.localeCompare(b.nombre, "es")),
    marcas: [...db.marcas].sort((a, b) => a.nombre.localeCompare(b.nombre, "es")),
  };
}

function resumen(q) {
  const periodo = leerPeriodo(q);
  const idSucursal = leerId(q.idSucursal);
  const incluidas = idSucursal ? [buscarSucursal(idSucursal)] : db.sucursales;

  const actual = incluidas.map((s) => filaSucursal(s, periodo));
  const anterior = incluidas.map((s) => filaSucursal(s, mesAnterior(periodo)));
  const total = totalizar(actual);
  const totalAnterior = totalizar(anterior);

  const stockIncluido = db.stock.filter((st) => !idSucursal || st.idSucursal === idSucursal);
  const conteoStock = { critico: 0, atencion: 0, normal: 0 };
  for (const st of stockIncluido) conteoStock[estadoStock(st.cantidad, st.stockMinimo)] += 1;

  const conteoClientes = { activo: 0, enRiesgo: 0, inactivo: 0 };
  for (const c of clientesConActividad) {
    if (idSucursal && c.idSucursalHabitual !== idSucursal) continue;
    conteoClientes[c.estado === "en_riesgo" ? "enRiesgo" : c.estado] += 1;
  }

  const porDia = new Map();
  for (const v of ventasDelMes(periodo, idSucursal)) {
    const fecha = v.fecha.slice(0, 10);
    const dia = porDia.get(fecha) ?? { fecha, ventas: 0, tickets: 0 };
    dia.ventas += v.total;
    dia.tickets += 1;
    porDia.set(fecha, dia);
  }

  return {
    kpis: {
      ventas: total.ventas,
      ventasAnterior: totalAnterior.ventas,
      pares: total.pares,
      paresAnterior: totalAnterior.pares,
      tickets: total.tickets,
      ticketsAnterior: totalAnterior.tickets,
      objetivo: total.objetivo,
      cumplimiento: total.cumplimiento,
      estado: total.estado,
    },
    sucursales: actual
      .map(({ id, nombre, ciudad, provincia, ventas, objetivo, cumplimiento, estado }) => ({
        id, nombre, ciudad, provincia, ventas, objetivo, cumplimiento, estado,
      }))
      .sort((a, b) => b.ventas - a.ventas),
    stock: conteoStock,
    clientes: conteoClientes,
    ventasPorDia: [...porDia.values()].sort((a, b) => a.fecha.localeCompare(b.fecha)),
  };
}

function ventasPorSucursal(q) {
  const periodo = leerPeriodo(q);
  const items = db.sucursales.map((s) => filaSucursal(s, periodo)).sort((a, b) => b.ventas - a.ventas);
  return { items, totales: totalizar(items) };
}

function ventasPorMarca(idSucursal, q) {
  const periodo = leerPeriodo(q);
  const sucursal = buscarSucursal(idSucursal);

  const agrupar = (lineas) => {
    const grupos = new Map();
    for (const l of lineas) {
      const idMarca = productoPorId.get(l.idProducto).idMarca;
      const grupo = grupos.get(idMarca) ?? { ventas: 0, pares: 0 };
      grupo.ventas += l.subtotal;
      grupo.pares += l.cantidad;
      grupos.set(idMarca, grupo);
    }
    return grupos;
  };
  const actual = agrupar(lineasDelMes(periodo, sucursal.id));
  const anterior = agrupar(lineasDelMes(mesAnterior(periodo), sucursal.id));

  return {
    sucursal: filaSucursal(sucursal, periodo),
    items: [...actual.entries()]
      .map(([idMarca, g]) => ({
        id: idMarca,
        nombre: marcaPorId.get(idMarca).nombre,
        ventas: g.ventas,
        pares: g.pares,
        ventasAnterior: anterior.get(idMarca)?.ventas ?? 0,
      }))
      .sort((a, b) => b.ventas - a.ventas),
  };
}

function ventasPorModelo(idSucursal, idMarca, q) {
  const periodo = leerPeriodo(q);
  const sucursal = buscarSucursal(idSucursal);
  const marca = marcaPorId.get(Number(idMarca));
  if (!marca) throw new ErrorApi(404, "No existe la marca.");

  const grupos = new Map();
  for (const l of lineasDelMes(periodo, sucursal.id)) {
    if (productoPorId.get(l.idProducto).idMarca !== marca.id) continue;
    const grupo = grupos.get(l.idProducto) ?? { ventas: 0, pares: 0 };
    grupo.ventas += l.subtotal;
    grupo.pares += l.cantidad;
    grupos.set(l.idProducto, grupo);
  }

  return {
    sucursal: { id: sucursal.id, nombre: sucursal.nombre },
    marca: { id: marca.id, nombre: marca.nombre },
    items: [...grupos.entries()]
      .map(([idProducto, g]) => {
        const p = productoPorId.get(idProducto);
        return {
          id: p.id,
          modelo: p.modelo,
          sku: p.sku,
          categoria: categoriaPorId.get(p.idCategoria).nombre,
          precioOutlet: p.precioOutlet,
          pares: g.pares,
          ventas: g.ventas,
          ...stockDeProducto(sucursal.id, p.id),
        };
      })
      .sort((a, b) => b.ventas - a.ventas),
  };
}

function detalleDeModelo(idSucursal, idProducto, q) {
  const periodo = leerPeriodo(q);
  const sucursal = buscarSucursal(idSucursal);
  const producto = productoPorId.get(Number(idProducto));
  if (!producto) throw new ErrorApi(404, "No existe el producto.");
  const marca = marcaPorId.get(producto.idMarca);

  const lineas = lineasDelMes(periodo, sucursal.id)
    .filter((l) => l.idProducto === producto.id)
    .sort((a, b) => b.venta.fecha.localeCompare(a.venta.fecha) || b.id - a.id);

  const porTalle = new Map();
  for (const l of lineas) porTalle.set(l.talle, (porTalle.get(l.talle) ?? 0) + l.cantidad);

  return {
    sucursal: { id: sucursal.id, nombre: sucursal.nombre },
    marca: { id: marca.id, nombre: marca.nombre },
    producto: {
      id: producto.id,
      modelo: producto.modelo,
      sku: producto.sku,
      precioLista: producto.precioLista,
      precioOutlet: producto.precioOutlet,
    },
    resumen: { lineas: lineas.length, pares: suma(lineas, "cantidad"), ventas: suma(lineas, "subtotal") },
    paresPorTalle: [...porTalle.entries()]
      .map(([talle, pares]) => ({ talle, pares }))
      .sort((a, b) => a.talle - b.talle),
    lineas: paginar(
      lineas.map((l) => ({
        idDetalle: l.id,
        fecha: l.venta.fecha,
        numero: l.venta.numero,
        cliente: nombreCompleto(clientePorId.get(l.venta.idCliente)),
        talle: l.talle,
        cantidad: l.cantidad,
        precioUnitario: l.precioUnitario,
        subtotal: l.subtotal,
        medioPago: l.venta.medioPago,
      })),
      q,
      8,
    ),
  };
}

function listarStock(q) {
  const busqueda = minusculas(q.busqueda);
  const idSucursal = leerId(q.idSucursal);
  const idMarca = leerId(q.idMarca);

  const filas = db.stock
    .map((st) => ({ st, p: productoPorId.get(st.idProducto) }))
    .filter(({ st, p }) =>
      p.activo &&
      (!idSucursal || st.idSucursal === idSucursal) &&
      (!idMarca || p.idMarca === idMarca) &&
      (!busqueda || minusculas(p.modelo).includes(busqueda) || minusculas(p.sku).includes(busqueda)),
    )
    .map(({ st, p }) => ({
      idStock: st.id,
      idProducto: p.id,
      sku: p.sku,
      modelo: p.modelo,
      marca: marcaPorId.get(p.idMarca).nombre,
      sucursal: sucursalPorId.get(st.idSucursal).nombre,
      talle: st.talle,
      cantidad: st.cantidad,
      stockMinimo: st.stockMinimo,
      estado: estadoStock(st.cantidad, st.stockMinimo),
    }));

  const conteos = { critico: 0, atencion: 0, normal: 0 };
  for (const f of filas) conteos[f.estado] += 1;

  const filtradas = filas
    .filter((f) => !q.estado || f.estado === q.estado)
    .sort(
      (a, b) =>
        SEVERIDAD_STOCK[a.estado] - SEVERIDAD_STOCK[b.estado] ||
        a.cantidad - b.cantidad ||
        a.modelo.localeCompare(b.modelo, "es") ||
        a.sucursal.localeCompare(b.sucursal, "es") ||
        a.talle - b.talle,
    );

  return { ...paginar(filtradas, q), conteos };
}

function listarClientes(q) {
  const busqueda = minusculas(q.busqueda);
  const idSucursal = leerId(q.idSucursal);

  const filas = clientesConActividad.filter(
    (c) =>
      (!idSucursal || c.idSucursalHabitual === idSucursal) &&
      (!busqueda ||
        [c.nombre, c.apellido, nombreCompleto(c), c.dni, c.email].some((campo) =>
          minusculas(campo).includes(busqueda),
        )),
  );

  const conteos = { activo: 0, enRiesgo: 0, inactivo: 0 };
  for (const c of filas) conteos[c.estado === "en_riesgo" ? "enRiesgo" : c.estado] += 1;

  const filtradas = filas
    .filter((c) => !q.estado || c.estado === q.estado)
    .sort(
      (a, b) =>
        (b.ultimaCompra ?? "").localeCompare(a.ultimaCompra ?? "") ||
        a.apellido.localeCompare(b.apellido, "es") ||
        a.nombre.localeCompare(b.nombre, "es"),
    )
    .map(({ idSucursalHabitual: _omitido, ...cliente }) => cliente);

  return { ...paginar(filtradas, q), conteos };
}

const ORDENES_VENTAS = {
  fecha_desc: (a, b) => b.fecha.localeCompare(a.fecha) || b.id - a.id,
  fecha_asc: (a, b) => a.fecha.localeCompare(b.fecha) || a.id - b.id,
  total_desc: (a, b) => b.total - a.total || b.fecha.localeCompare(a.fecha),
  total_asc: (a, b) => a.total - b.total || b.fecha.localeCompare(a.fecha),
};

function listarVentas(q) {
  const busqueda = minusculas(q.busqueda);
  const idSucursal = leerId(q.idSucursal);
  const orden = ORDENES_VENTAS[q.orden] ?? ORDENES_VENTAS.fecha_desc;

  const filtradas = db.ventas
    .filter(
      (v) =>
        (!q.desde || v.fecha.slice(0, 10) >= q.desde) &&
        (!q.hasta || v.fecha.slice(0, 10) <= q.hasta) &&
        (!idSucursal || v.idSucursal === idSucursal) &&
        (!q.medioPago || v.medioPago === q.medioPago) &&
        (!busqueda ||
          minusculas(v.numero).includes(busqueda) ||
          minusculas(nombreCompleto(clientePorId.get(v.idCliente))).includes(busqueda)),
    )
    .sort(orden);

  const pagina = paginar(filtradas, q);
  return {
    ...pagina,
    items: pagina.items.map((v) => {
      const primera = productoPorId.get(v.lineas[0].idProducto);
      return {
        id: v.id,
        numero: v.numero,
        fecha: v.fecha,
        sucursal: sucursalPorId.get(v.idSucursal).nombre,
        cliente: nombreCompleto(clientePorId.get(v.idCliente)),
        producto: `${marcaPorId.get(primera.idMarca).nombre} ${primera.modelo}`,
        otrosProductos: v.lineas.length - 1,
        pares: v.pares,
        medioPago: v.medioPago,
        total: v.total,
      };
    }),
    totales: {
      ventas: filtradas.length,
      pares: suma(filtradas, "pares"),
      importe: suma(filtradas, "total"),
    },
  };
}

// ---- Autenticación simulada (mismas cuentas de prueba que el backend) ----

function usuariosRegistrados() {
  try {
    return JSON.parse(sessionStorage.getItem(USUARIOS_KEY)) ?? [];
  } catch {
    return [];
  }
}

const todosLosUsuarios = () => [...db.usuarios, ...usuariosRegistrados()];
const datosPublicos = ({ id, nombre, apellido, email, rol }) => ({ id, nombre, apellido, email, rol });
const usuarioDelToken = (token) =>
  todosLosUsuarios().find((u) => token === `mock-${u.id}`) ?? null;

function login(body) {
  const email = minusculas(body?.email).trim();
  if (!email || !body?.password) throw new ErrorApi(400, "Ingresá tu email y tu contraseña.");
  const usuario = todosLosUsuarios().find((u) => u.email === email);
  if (!usuario || usuario.password !== body.password)
    throw new ErrorApi(401, "Email o contraseña incorrectos.");
  return { token: `mock-${usuario.id}`, usuario: datosPublicos(usuario) };
}

function registrar(body) {
  const email = minusculas(body?.email).trim();
  if (todosLosUsuarios().some((u) => u.email === email))
    throw new ErrorApi(409, "Ya existe una cuenta con ese email.");
  const nuevo = {
    id: 100 + usuariosRegistrados().length,
    nombre: body.nombre,
    apellido: body.apellido,
    email,
    password: body.password,
    rol: "consulta",
  };
  sessionStorage.setItem(USUARIOS_KEY, JSON.stringify([...usuariosRegistrados(), nuevo]));
  return { token: `mock-${nuevo.id}`, usuario: datosPublicos(nuevo) };
}

// ---- Ruteo ----

const RUTAS = [
  ["POST", /^\/auth\/login$/, (_, __, body) => login(body), { publica: true }],
  ["POST", /^\/auth\/register$/, (_, __, body) => registrar(body), { publica: true, status: 201 }],
  ["GET", /^\/auth\/me$/, (_, __, ___, usuario) => datosPublicos(usuario)],
  ["GET", /^\/tablero\/catalogos$/, () => catalogos()],
  ["GET", /^\/tablero\/resumen$/, (_, q) => resumen(q)],
  ["GET", /^\/ventas\/sucursales$/, (_, q) => ventasPorSucursal(q)],
  ["GET", /^\/ventas\/sucursales\/(\d+)\/marcas$/, ([, id], q) => ventasPorMarca(id, q)],
  ["GET", /^\/ventas\/sucursales\/(\d+)\/marcas\/(\d+)\/modelos$/, ([, id, idMarca], q) => ventasPorModelo(id, idMarca, q)],
  ["GET", /^\/ventas\/sucursales\/(\d+)\/productos\/(\d+)$/, ([, id, idProducto], q) => detalleDeModelo(id, idProducto, q)],
  ["GET", /^\/stock$/, (_, q) => listarStock(q)],
  ["GET", /^\/clientes$/, (_, q) => listarClientes(q)],
  ["GET", /^\/ventas$/, (_, q) => listarVentas(q)],
];

export async function responderMock({ url, method, body, token }) {
  await new Promise((resolve) => setTimeout(resolve, LATENCIA_MS));
  const { pathname, searchParams } = new URL(url, "http://mock");
  const q = Object.fromEntries(searchParams);

  for (const [metodo, patron, manejar, opciones = {}] of RUTAS) {
    const match = pathname.match(patron);
    if (!match || metodo !== method) continue;
    try {
      const usuario = usuarioDelToken(token);
      if (!opciones.publica && !usuario) throw new ErrorApi(401, "Sesión expirada.");
      return { status: opciones.status ?? 200, data: manejar(match, q, body, usuario) };
    } catch (error) {
      if (error instanceof ErrorApi) return { status: error.status, data: { message: error.message } };
      throw error;
    }
  }
  return { status: 404, data: { message: "No existe el endpoint." } };
}
