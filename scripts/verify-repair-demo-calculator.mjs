import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import vm from "node:vm";

const require = createRequire(import.meta.url);
const typescript = require("typescript");
const calculatorPath = path.resolve("src/lib/artifacts/repair-moscow-demo/calculator.ts");
const source = readFileSync(calculatorPath, "utf8");
const compiled = typescript.transpileModule(source, {
  compilerOptions: {
    module: typescript.ModuleKind.CommonJS,
    target: typescript.ScriptTarget.ES2020,
  },
  fileName: calculatorPath,
});
const compiledModule = { exports: {} };

vm.runInNewContext(compiled.outputText, { module: compiledModule, exports: compiledModule.exports }, { filename: calculatorPath });

const { DEFAULT_REPAIR_ESTIMATE_INPUT, calculateRepairEstimate, clampRepairArea, formatPrice } = compiledModule.exports;

assert.equal(calculateRepairEstimate(DEFAULT_REPAIR_ESTIMATE_INPUT), 740_000, "default estimate");
assert.equal(
  calculateRepairEstimate({ area: 45, repairType: "cosmetic", bathroom: false, designProject: false }),
  410_000,
  "cosmetic without extras",
);
assert.equal(
  calculateRepairEstimate({ area: 45, repairType: "capital", bathroom: false, designProject: true }),
  770_000,
  "capital with design project",
);
assert.equal(
  calculateRepairEstimate({ area: 45, repairType: "design", bathroom: false, designProject: true }),
  990_000,
  "design repair does not add design project twice",
);
assert.equal(clampRepairArea(1), 20, "minimum area clamp");
assert.equal(clampRepairArea(999), 150, "maximum area clamp");
assert.equal(
  calculateRepairEstimate({ area: 21, repairType: "cosmetic", bathroom: false, designProject: false }),
  190_000,
  "nearest ten-thousand rounding",
);
assert.equal(formatPrice(740_000), "740 000 ₽", "price formatting");

process.stdout.write("repair demo calculator: OK\n");
