// Genera el PDF de la entrega final a partir de docs/entrega-2/documento.html.
//
// Uso: npm run pdf (antes, npm run capturas si cambiaron las pantallas).
// La primera vez hay que instalar el navegador: npx playwright install chromium
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { chromium } from "playwright";

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const HTML = path.join(RAIZ, "docs", "entrega-2", "documento.html");
const PDF = path.join(RAIZ, "docs", "Entrega 2 - Leonel Blumberg y Luciano Migoni.pdf");

const PIE = `
  <div style="width: 100%; padding: 0 20mm; text-align: right;
              font-family: Calibri, Carlito, Arial, sans-serif; font-size: 8pt; color: #8a91a1;">
    Página <span class="pageNumber"></span>
  </div>`;

const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto(pathToFileURL(HTML).href, { waitUntil: "load" });
await page.evaluate(() => document.fonts.ready);
await page.pdf({
  path: PDF,
  format: "A4",
  printBackground: true,
  displayHeaderFooter: true,
  headerTemplate: "<span></span>",
  footerTemplate: PIE,
  margin: { top: "20mm", right: "20mm", bottom: "20mm", left: "20mm" },
});
await browser.close();
console.log(`✓ ${path.relative(process.cwd(), PDF)}`);
