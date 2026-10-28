// Datos de prueba para desarrollar el front sin el backend (npm run dev:mocks).
// Se generan siempre iguales (generador pseudoaleatorio con semilla fija) y respetan el
// modelo de la base: sucursales, marcas, categorias, productos, stock, clientes, ventas,
// detalle_ventas y objetivos_venta. NO se usan cuando el front corre contra la API real.

// Generador pseudoaleatorio mulberry32: misma semilla, mismos datos
function crearAleatorio(semilla) {
  let estado = semilla;
  return () => {
    estado = (estado + 0x6d2b79f5) | 0;
    let t = Math.imul(estado ^ (estado >>> 15), 1 | estado);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const azar = crearAleatorio(20260930);
const entre = (min, max) => min + Math.floor(azar() * (max - min + 1));
const elegir = (lista) => lista[Math.floor(azar() * lista.length)];

function elegirPonderado(lista, peso) {
  const total = lista.reduce((suma, item) => suma + peso(item), 0);
  let r = azar() * total;
  for (const item of lista) {
    r -= peso(item);
    if (r <= 0) return item;
  }
  return lista[lista.length - 1];
}

// ---- Calendario: ventas del 01/04/2026 al 30/09/2026 ----

const INICIO = Date.UTC(2026, 3, 1);
const DIA_MS = 86_400_000;
export const CANTIDAD_DIAS = 183;

const fechaDelDia = (dia) => new Date(INICIO + dia * DIA_MS);
export const isoDelDia = (dia) => fechaDelDia(dia).toISOString().slice(0, 10);

// Día siguiente a la última venta (ver "Fecha de referencia" en docs/contrato-api.md)
export const FECHA_REFERENCIA = isoDelDia(CANTIDAD_DIAS);

// Peso de cada día de la semana (0 = domingo): los sábados se vende más
const PESO_DIA_SEMANA = [0.9, 0.7, 0.75, 0.8, 0.9, 1.15, 1.4];

// ---- Catálogos ----

export const sucursales = [
  { id: 1, nombre: "Palermo", direccion: "Av. Santa Fe 3253", ciudad: "CABA", provincia: "CABA", peso: 0.3 },
  { id: 2, nombre: "Unicenter", direccion: "Paraná 3745", ciudad: "Martínez", provincia: "Buenos Aires", peso: 0.255 },
  { id: 3, nombre: "Belgrano", direccion: "Av. Cabildo 2280", ciudad: "CABA", provincia: "CABA", peso: 0.2 },
  { id: 4, nombre: "Rosario Centro", direccion: "Córdoba 1452", ciudad: "Rosario", provincia: "Santa Fe", peso: 0.145 },
  { id: 5, nombre: "Córdoba Nuevocentro", direccion: "Duarte Quirós 1400", ciudad: "Córdoba", provincia: "Córdoba", peso: 0.1 },
];

export const marcas = [
  { id: 1, nombre: "Nike" },
  { id: 2, nombre: "Adidas" },
  { id: 3, nombre: "New Balance" },
  { id: 4, nombre: "Puma" },
  { id: 5, nombre: "Vans" },
  { id: 6, nombre: "Topper" },
];

export const categorias = [
  { id: 1, nombre: "Urbana" },
  { id: 2, nombre: "Running" },
  { id: 3, nombre: "Skate" },
];

// [sku, modelo, idMarca, idCategoria, genero, precioLista, precioOutlet, popularidad]
const PRODUCTOS = [
  ["NK-AM90", "Air Max 90", 1, 1, "unisex", 229900, 159900, 1.4],
  ["NK-AF1", "Air Force 1 '07", 1, 1, "unisex", 199900, 139900, 1.5],
  ["NK-PEG41", "Pegasus 41", 1, 2, "hombre", 269900, 189900, 0.7],
  ["NK-REV7", "Revolution 7", 1, 2, "mujer", 119900, 79900, 1.1],
  ["NK-CVL", "Court Vision Low", 1, 1, "hombre", 149900, 99900, 0.8],
  ["NK-DNK", "Dunk Low", 1, 1, "unisex", 239900, 169900, 0.9],
  ["AD-SAM", "Samba OG", 2, 1, "unisex", 209900, 149900, 1.4],
  ["AD-GAZ", "Gazelle", 2, 1, "mujer", 189900, 129900, 1.0],
  ["AD-ULB", "Ultraboost Light", 2, 2, "hombre", 299900, 209900, 0.5],
  ["AD-GC2", "Grand Court 2.0", 2, 1, "unisex", 119900, 84900, 1.0],
  ["AD-DSL", "Duramo SL", 2, 2, "mujer", 109900, 74900, 0.8],
  ["NB-574", "574 Core", 3, 1, "unisex", 189900, 134900, 0.9],
  ["NB-530", "530", 3, 1, "mujer", 219900, 154900, 0.7],
  ["NB-680", "Fresh Foam 680", 3, 2, "hombre", 199900, 139900, 0.5],
  ["NB-480", "480", 3, 1, "unisex", 169900, 119900, 0.5],
  ["PU-SUE", "Suede Classic", 4, 1, "unisex", 149900, 104900, 0.8],
  ["PU-RSX", "RS-X", 4, 1, "hombre", 179900, 124900, 0.5],
  ["PU-VN3", "Velocity Nitro 3", 4, 2, "hombre", 219900, 154900, 0.35],
  ["PU-SM3", "Smash 3.0", 4, 1, "mujer", 99900, 69900, 0.8],
  ["VN-OLD", "Old Skool", 5, 3, "unisex", 149900, 104900, 0.9],
  ["VN-AUT", "Authentic", 5, 3, "unisex", 119900, 84900, 0.6],
  ["VN-SK8", "Sk8-Hi", 5, 3, "unisex", 169900, 119900, 0.4],
  ["VN-KNU", "Knu Skool", 5, 3, "unisex", 159900, 114900, 0.4],
  ["TP-TIE", "Tie Break", 6, 1, "unisex", 99900, 69900, 0.6],
  ["TP-COS", "Costa", 6, 1, "hombre", 79900, 54900, 0.5],
  ["TP-FST", "Fast", 6, 2, "mujer", 89900, 62900, 0.4],
];

export const productos = PRODUCTOS.map(
  ([sku, modelo, idMarca, idCategoria, genero, precioLista, precioOutlet, popularidad], i) => ({
    id: i + 1,
    sku,
    modelo,
    idMarca,
    idCategoria,
    genero,
    precioLista,
    precioOutlet,
    popularidad,
    activo: true,
  }),
);

const TALLES = [35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45];
const PESO_TALLE = [2, 4, 7, 9, 10, 10, 9, 8, 6, 4, 2];
const pesoTalle = (talle) => PESO_TALLE[TALLES.indexOf(talle)];

// Cada sucursal vende algunas marcas más que otras
const preferenciaMarca = Object.fromEntries(
  sucursales.map((s) => [
    s.id,
    Object.fromEntries(marcas.map((m) => [m.id, 0.75 + azar() * 0.55])),
  ]),
);

// ---- Stock: una fila por sucursal, producto y talle ----

let idStock = 0;
export const stock = sucursales.flatMap((s) =>
  productos.flatMap((p) =>
    TALLES.map((talle) => {
      const minimo = entre(2, 5);
      const r = azar();
      // Aproximadamente 3% en estado crítico, 8% en atención y el resto normal
      const cantidad =
        r < 0.032
          ? entre(0, minimo)
          : r < 0.112
            ? entre(minimo + 1, minimo * 2)
            : minimo * 2 + entre(1, Math.round(3 + p.popularidad * pesoTalle(talle) * 0.6));
      idStock += 1;
      return { id: idStock, idSucursal: s.id, idProducto: p.id, talle, cantidad, stockMinimo: minimo };
    }),
  ),
);

// ---- Clientes ----

const NOMBRES = [
  "Martina", "Joaquín", "Sofía", "Tomás", "Valentina", "Lucas", "Camila", "Mateo",
  "Agustina", "Nicolás", "Lucía", "Martín", "Carla", "Diego", "Florencia", "Paula",
  "Bruno", "Ezequiel", "Julieta", "Federico", "Micaela", "Santiago", "Rocío", "Facundo",
  "Milagros", "Gonzalo", "Antonella", "Franco", "Belén", "Ignacio", "Victoria", "Lautaro",
  "Delfina", "Matías", "Abril", "Emiliano", "Catalina", "Bautista", "Josefina", "Thiago",
];
const APELLIDOS = [
  "López", "Fernández", "Romero", "Díaz", "Acosta", "Benítez", "Sosa", "Giménez",
  "Paz", "Castro", "Ríos", "Moreno", "Gómez", "Méndez", "Navarro", "Ruiz", "Vega",
  "Herrera", "González", "Rodríguez", "Pérez", "Martínez", "García", "Sánchez",
  "Álvarez", "Torres", "Ramírez", "Flores", "Medina", "Suárez", "Aguirre", "Molina",
  "Silva", "Rojas", "Ortiz", "Luna", "Juárez", "Cabrera", "Ponce", "Ledesma",
];

const sinAcentos = (texto) =>
  texto.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

// Perfil de actividad: hasta qué día compra cada cliente
const PERFILES = [
  { tipo: "activo", peso: 0.45, ultimoDia: () => CANTIDAD_DIAS - entre(1, 30) },
  { tipo: "en_riesgo", peso: 0.25, ultimoDia: () => CANTIDAD_DIAS - entre(31, 90) },
  { tipo: "inactivo", peso: 0.25, ultimoDia: () => CANTIDAD_DIAS - entre(91, CANTIDAD_DIAS) },
  { tipo: "nunca", peso: 0.05, ultimoDia: () => null },
];

const dnisUsados = new Set();
const emailsUsados = new Set();

export const clientes = Array.from({ length: 2800 }, (_, i) => {
  const nombre = elegir(NOMBRES);
  const apellido = elegir(APELLIDOS);
  let dni;
  do dni = String(entre(24_000_000, 46_999_999));
  while (dnisUsados.has(dni));
  dnisUsados.add(dni);

  let email = `${sinAcentos(nombre)}.${sinAcentos(apellido)}@mail.com`.replace(/\s/g, "");
  for (let n = 2; emailsUsados.has(email); n++)
    email = `${sinAcentos(nombre)}.${sinAcentos(apellido)}${n}@mail.com`;
  emailsUsados.add(email);

  const perfil = elegirPonderado(PERFILES, (p) => p.peso);
  return {
    id: i + 1,
    nombre,
    apellido,
    dni,
    email,
    telefono: `11 ${entre(4000, 6999)}-${entre(1000, 9999)}`,
    fechaAlta: isoDelDia(-entre(30, 900)),
    perfil,
    ultimoDia: perfil.ultimoDia(),
    idSucursalPreferida: elegirPonderado(sucursales, (s) => s.peso).id,
  };
});

// ---- Ventas y detalle_ventas ----

const MEDIOS_PAGO = [
  ["debito", 0.3],
  ["credito", 0.32],
  ["efectivo", 0.14],
  ["transferencia", 0.1],
  ["billetera", 0.14],
];

function lineasDeVenta(idSucursal) {
  const cantidadLineas = elegirPonderado([1, 2, 3], (n) => [0.72, 0.22, 0.06][n - 1]);
  const lineas = [];
  while (lineas.length < cantidadLineas) {
    const producto = elegirPonderado(
      productos,
      (p) => p.popularidad * preferenciaMarca[idSucursal][p.idMarca],
    );
    const talle = elegirPonderado(TALLES, pesoTalle);
    // Una línea por producto y talle en cada venta (uq_detalle_venta_producto_talle)
    if (lineas.some((l) => l.idProducto === producto.id && l.talle === talle)) continue;
    const cantidad = azar() < 0.9 ? 1 : 2;
    lineas.push({
      idProducto: producto.id,
      talle,
      cantidad,
      precioUnitario: producto.precioOutlet,
      subtotal: cantidad * producto.precioOutlet,
    });
  }
  return lineas;
}

// Tickets de cada mes (todas las sucursales): septiembre crece cerca de 10% contra agosto
const TICKETS_POR_MES = { 4: 1450, 5: 1480, 6: 1520, 7: 1600, 8: 1560, 9: 1720 };

const compradores = clientes.filter((c) => c.ultimoDia !== null);

// Cada cliente hace su última compra justo en su "ultimoDia", en su sucursal preferida
const comprasSinOrden = compradores.map((c) => ({
  dia: c.ultimoDia,
  idCliente: c.id,
  idSucursal: c.idSucursalPreferida,
}));

// El resto de las compras de un día solo puede hacerlas quien todavía compra ese día
// (ultimoDia >= dia): así la última compra de cada cliente queda donde se planeó.
// Ordenados de mayor a menor ultimoDia, los que compran un día son siempre un prefijo
const ordenados = [...compradores].sort((a, b) => b.ultimoDia - a.ultimoDia);
const ordenadosPorSucursal = new Map(
  sucursales.map((s) => [s.id, ordenados.filter((c) => c.idSucursalPreferida === s.id)]),
);

function cuantosCompranEseDia(lista, dia) {
  let desde = 0;
  let hasta = lista.length;
  while (desde < hasta) {
    const medio = (desde + hasta) >> 1;
    if (lista[medio].ultimoDia >= dia) desde = medio + 1;
    else hasta = medio;
  }
  return desde;
}

const diasPorMes = new Map();
for (let dia = 0; dia < CANTIDAD_DIAS; dia++) {
  const mes = fechaDelDia(dia).getUTCMonth() + 1;
  if (!diasPorMes.has(mes)) diasPorMes.set(mes, []);
  diasPorMes.get(mes).push(dia);
}

for (const [mes, dias] of diasPorMes) {
  const ultimasCompras = comprasSinOrden.filter((c) => dias.includes(c.dia)).length;
  const restantes = Math.max(0, TICKETS_POR_MES[mes] - ultimasCompras);
  const pesoMes = dias.reduce((s, dia) => s + PESO_DIA_SEMANA[fechaDelDia(dia).getUTCDay()], 0);

  for (const dia of dias) {
    const peso = PESO_DIA_SEMANA[fechaDelDia(dia).getUTCDay()];
    const cantidad = Math.round(((restantes * peso) / pesoMes) * (0.85 + azar() * 0.3));
    for (let k = 0; k < cantidad; k++) {
      const sucursal = elegirPonderado(sucursales, (s) => s.peso);
      let lista = azar() < 0.7 ? ordenadosPorSucursal.get(sucursal.id) : ordenados;
      let candidatos = cuantosCompranEseDia(lista, dia);
      if (candidatos === 0) {
        lista = ordenados;
        candidatos = cuantosCompranEseDia(lista, dia);
      }
      if (candidatos === 0) continue;
      const cliente = lista[Math.floor(azar() * candidatos)];
      comprasSinOrden.push({ dia, idCliente: cliente.id, idSucursal: sucursal.id });
    }
  }
}

for (const compra of comprasSinOrden) compra.minuto = entre(10 * 60, 21 * 60 + 30);

comprasSinOrden.sort((a, b) => a.dia - b.dia || a.minuto - b.minuto);

let idDetalle = 0;
export const ventas = comprasSinOrden.map((compra, i) => {
  const id = i + 1;
  const hora = String(Math.floor(compra.minuto / 60)).padStart(2, "0");
  const minuto = String(compra.minuto % 60).padStart(2, "0");
  const fecha = isoDelDia(compra.dia);
  const lineas = lineasDeVenta(compra.idSucursal).map((l) => ({ ...l, id: ++idDetalle }));
  return {
    id,
    numero: `V-${String(id).padStart(6, "0")}`,
    idSucursal: compra.idSucursal,
    idCliente: compra.idCliente,
    fecha: `${fecha}T${hora}:${minuto}:00`,
    anio: Number(fecha.slice(0, 4)),
    mes: Number(fecha.slice(5, 7)),
    medioPago: elegirPonderado(MEDIOS_PAGO, ([, peso]) => peso)[0],
    // ventas.total es la suma de los subtotales del detalle
    total: lineas.reduce((suma, l) => suma + l.subtotal, 0),
    pares: lineas.reduce((suma, l) => suma + l.cantidad, 0),
    lineas,
  };
});

// ---- Objetivos de venta: uno por sucursal y mes ----

// Cumplimiento buscado en septiembre para que aparezcan los tres colores del semáforo
const CUMPLIMIENTO_SEPTIEMBRE = { 1: 1.074, 2: 0.951, 3: 0.94, 4: 1.048, 5: 0.709 };

const ventasPorSucursalMes = new Map();
for (const v of ventas) {
  const clave = `${v.idSucursal}-${v.anio}-${v.mes}`;
  ventasPorSucursalMes.set(clave, (ventasPorSucursalMes.get(clave) ?? 0) + v.total);
}

export const objetivos = [];
for (const s of sucursales) {
  for (let mes = 4; mes <= 9; mes++) {
    const vendido = ventasPorSucursalMes.get(`${s.id}-2026-${mes}`) ?? 0;
    const cumplimiento = mes === 9 ? CUMPLIMIENTO_SEPTIEMBRE[s.id] : 0.86 + azar() * 0.26;
    objetivos.push({
      idSucursal: s.id,
      anio: 2026,
      mes,
      montoObjetivo: Math.max(1, Math.round(vendido / cumplimiento / 1_000_000)) * 1_000_000,
    });
  }
}

// ---- Usuarios de prueba (los mismos de 02_siembra_usuarios.sql) ----

export const usuarios = [
  { id: 1, nombre: "Admin", apellido: "Outlet", email: "admin@outlet.com", password: "Admin1234", rol: "admin" },
  { id: 2, nombre: "Gerente", apellido: "Centro", email: "gerente@outlet.com", password: "Gerente1234", rol: "gerente" },
];
