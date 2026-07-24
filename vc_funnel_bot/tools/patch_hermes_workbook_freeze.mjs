import fs from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

const dependencyRoot = process.env.WORKSPACE_NODE_MODULES;
if (!dependencyRoot) {
  throw new Error("WORKSPACE_NODE_MODULES must point to the bundled node_modules");
}
const { default: JSZip } = await import(
  pathToFileURL(path.join(dependencyRoot, "jszip/lib/index.js")).href
);

const defaultWorkbook = path.resolve(
  path.dirname(new URL(import.meta.url).pathname),
  "../material_packs/hermes_first_audit/Hermes_Audit_Workbook.xlsx",
);
const workbookPath = path.resolve(process.argv[2] || defaultWorkbook);
const zip = await JSZip.loadAsync(await fs.readFile(workbookPath));
const sheetPaths = [
  "xl/worksheets/sheet1.xml",
  "xl/worksheets/sheet2.xml",
];
const sheetViews = [
  "<x:sheetViews>",
  '<x:sheetView workbookViewId="0">',
  '<x:pane ySplit="3" topLeftCell="A4" activePane="bottomLeft" state="frozen" />',
  '<x:selection pane="bottomLeft" activeCell="A4" sqref="A4" />',
  "</x:sheetView>",
  "</x:sheetViews>",
].join("");

for (const sheetPath of sheetPaths) {
  const file = zip.file(sheetPath);
  if (!file) {
    throw new Error(`Workbook sheet is missing: ${sheetPath}`);
  }
  let xml = await file.async("string");
  xml = xml.replace(/<x:sheetViews>.*?<\/x:sheetViews>/s, "");
  const worksheetStart = xml.match(/<x:worksheet\b[^>]*>/)?.[0];
  if (!worksheetStart) {
    throw new Error(`Worksheet root is missing: ${sheetPath}`);
  }
  xml = xml.replace(worksheetStart, `${worksheetStart}${sheetViews}`);
  zip.file(sheetPath, xml);
}

const output = await zip.generateAsync({
  type: "nodebuffer",
  compression: "DEFLATE",
  compressionOptions: { level: 6 },
});
const tempPath = `${workbookPath}.freeze.tmp`;
await fs.writeFile(tempPath, output);
await fs.rename(tempPath, workbookPath);
console.log(`freeze_rows=3 sheets=${sheetPaths.length}`);
