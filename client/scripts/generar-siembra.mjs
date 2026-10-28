// Genera server/base de datos/03_siembra_datos.sql a partir de los datos de prueba de
// src/api/mocks/datos.js. Así la base real tiene exactamente los mismos datos que el modo de
// prueba del front, y las respuestas de la API se pueden comparar con las del backend simulado.
//
// Uso: npm run generar-siembra (solo hace falta si cambian los datos de prueba)
import { writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as db from "../src/api/mocks/datos.js";

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const SALIDA = path.join(RAIZ, "server", "base de datos", "03_siembra_datos.sql");
const FILAS_POR_INSERT = 500;

// Valor SQL: texto entre comillas (con las comillas internas duplicadas), números tal cual
const sql = (valor) =>
  valor === null || valor === undefined
    ? "NULL"
    : typeof valor === "number"
      ? String(valor)
      : typeof valor === "boolean"
        ? String(valor)
        : `'${String(valor).replaceAll("'", "''")}'`;

// INSERT de varias filas por sentencia; ON CONFLICT DO NOTHING lo hace repetible
function insert(tabla, columnas, filas) {
  const bloques = [];
  for (let i = 0; i < filas.length; i += FILAS_POR_INSERT) {
    const valores = filas
      .slice(i, i + FILAS_POR_INSERT)
      .map((fila) => `    (${fila.map(sql).join(", ")})`)
      .join(",\n");
    bloques.push(
      `INSERT INTO ${tabla} (${columnas.join(", ")}) VALUES\n${valores}\nON CONFLICT DO NOTHING;`,
    );
  }
  return bloques.join("\n\n");
}

// Después de insertar con ids explícitos, las secuencias de los serial siguen desde el máximo
const ajustarSecuencia = (tabla, columna) =>
  `SELECT setval(pg_get_serial_sequence('${tabla}', '${columna}'), COALESCE((SELECT MAX(${columna}) FROM ${tabla}), 1));`;

const lineas = db.ventas.flatMap((v) => v.lineas.map((l) => ({ ...l, idVenta: v.id })));

const partes = [
  `-- Outlet de Zapatillas - Datos de prueba del tablero (PostgreSQL)
--
-- ARCHIVO GENERADO con: cd client && npm run generar-siembra
-- Sale de client/src/api/mocks/datos.js, así la base tiene los mismos datos que el modo de
-- prueba del front. Para cambiar los datos, modificar ese archivo y volver a generarlo.
--
-- Contenido: ${db.sucursales.length} sucursales, ${db.marcas.length} marcas, ${db.categorias.length} categorías, ${db.productos.length} productos,
-- ${db.stock.length} filas de stock, ${db.clientes.length} clientes, ${db.objetivos.length} objetivos mensuales,
-- ${db.ventas.length} ventas y ${lineas.length} líneas de detalle (del 01/04/2026 al 30/09/2026).
--
-- Se puede ejecutar varias veces: ON CONFLICT DO NOTHING evita duplicar las filas.
-- ventas.total es siempre la suma de los subtotales de su detalle.`,

  "-- Sucursales",
  insert(
    "sucursales",
    ["id_sucursal", "nombre", "direccion", "ciudad", "provincia", "telefono", "fecha_apertura"],
    db.sucursales.map((s) => [s.id, s.nombre, s.direccion, s.ciudad, s.provincia, s.telefono, s.fechaApertura]),
  ),

  "-- Marcas y categorías",
  insert("marcas", ["id_marca", "nombre"], db.marcas.map((m) => [m.id, m.nombre])),
  insert("categorias", ["id_categoria", "nombre"], db.categorias.map((c) => [c.id, c.nombre])),

  "-- Productos",
  insert(
    "productos",
    ["id_producto", "sku", "modelo", "id_marca", "id_categoria", "genero", "precio_lista", "precio_outlet", "activo"],
    db.productos.map((p) => [p.id, p.sku, p.modelo, p.idMarca, p.idCategoria, p.genero, p.precioLista, p.precioOutlet, p.activo]),
  ),

  "-- Stock por sucursal, producto y talle",
  insert(
    "stock",
    ["id_stock", "id_sucursal", "id_producto", "talle", "cantidad", "stock_minimo"],
    db.stock.map((st) => [st.id, st.idSucursal, st.idProducto, st.talle, st.cantidad, st.stockMinimo]),
  ),

  "-- Clientes",
  insert(
    "clientes",
    ["id_cliente", "nombre", "apellido", "dni", "email", "telefono", "fecha_alta"],
    db.clientes.map((c) => [c.id, c.nombre, c.apellido, c.dni, c.email, c.telefono, c.fechaAlta]),
  ),

  "-- Objetivos de venta mensuales",
  insert(
    "objetivos_venta",
    ["id_sucursal", "anio", "mes", "monto_objetivo"],
    db.objetivos.map((o) => [o.idSucursal, o.anio, o.mes, o.montoObjetivo]),
  ),

  "-- Ventas (cabecera)",
  insert(
    "ventas",
    ["id_venta", "numero", "id_sucursal", "id_cliente", "fecha", "medio_pago", "total"],
    db.ventas.map((v) => [v.id, v.numero, v.idSucursal, v.idCliente, v.fecha.replace("T", " "), v.medioPago, v.total]),
  ),

  "-- Detalle de las ventas",
  insert(
    "detalle_ventas",
    ["id_detalle", "id_venta", "id_producto", "talle", "cantidad", "precio_unitario", "subtotal"],
    lineas.map((l) => [l.id, l.idVenta, l.idProducto, l.talle, l.cantidad, l.precioUnitario, l.subtotal]),
  ),

  `-- El gerente de prueba (02_siembra_usuarios.sql) queda asignado a la sucursal Palermo
UPDATE usuarios SET id_sucursal = 1
WHERE email = 'gerente@outlet.com' AND id_sucursal IS NULL;`,

  "-- Secuencias de los serial",
  [
    ["sucursales", "id_sucursal"],
    ["marcas", "id_marca"],
    ["categorias", "id_categoria"],
    ["productos", "id_producto"],
    ["stock", "id_stock"],
    ["clientes", "id_cliente"],
    ["objetivos_venta", "id_objetivo"],
    ["ventas", "id_venta"],
    ["detalle_ventas", "id_detalle"],
  ]
    .map(([tabla, columna]) => ajustarSecuencia(tabla, columna))
    .join("\n"),
];

await writeFile(SALIDA, `${partes.join("\n\n")}\n`, "utf8");
console.log(`✓ ${path.relative(process.cwd(), SALIDA)} (${db.ventas.length} ventas, ${lineas.length} líneas)`);
