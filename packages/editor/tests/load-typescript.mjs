import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { createRequire } from "node:module";
import ts from "typescript";

// Exercise production TypeScript without duplicating its implementation in tests.
export function loadTypeScript(filename, { mocks = {}, globals = {} } = {}) {
  const cache = new Map();
  const context = vm.createContext({ console, setTimeout, clearTimeout, queueMicrotask, structuredClone, ...globals });
  const load = (file) => {
    if (cache.has(file)) return cache.get(file).exports;
    const module = { exports: {} };
    cache.set(file, module);
    const nativeRequire = createRequire(file);
    const require = (specifier) => {
      if (Object.hasOwn(mocks, specifier)) return mocks[specifier];
      if (specifier.startsWith(".")) {
        const target = path.resolve(path.dirname(file), specifier);
        if (fs.existsSync(`${target}.ts`)) return load(`${target}.ts`);
      }
      return nativeRequire(specifier);
    };
    const { outputText } = ts.transpileModule(fs.readFileSync(file, "utf8"), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
      fileName: file,
    });
    const evaluate = vm.runInContext(`(function(require, module, exports) {\n${outputText}\n})`, context, { filename: file });
    evaluate(require, module, module.exports);
    return module.exports;
  };
  return load(path.resolve(filename));
}
