import fs from "node:fs";
import path from "node:path";
import { registerHooks } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";

const LOCAL_SPECIFIER_PATTERN = /^(?:\.{0,2}\/|\/|file:)/;
const EXTENSION_FALLBACKS = new Map([
  [".js", ".ts"],
  [".mjs", ".mts"],
  [".cjs", ".cts"],
]);

registerHooks({
  resolve(specifier, context, nextResolve) {
    try {
      return nextResolve(specifier, context);
    } catch (error) {
      if (!shouldTryTypeScriptFallback(specifier, error)) {
        throw error;
      }

      const fallback_specifier = resolveTypeScriptFallbackSpecifier(
        specifier,
        context.parentURL,
      );

      if (!fallback_specifier) {
        throw error;
      }

      return nextResolve(fallback_specifier, context);
    }
  },
});

const shouldTryTypeScriptFallback = (specifier, error) =>
  LOCAL_SPECIFIER_PATTERN.test(specifier) &&
  error &&
  typeof error === "object" &&
  "code" in error &&
  error.code === "ERR_MODULE_NOT_FOUND";

const resolveTypeScriptFallbackSpecifier = (specifier, parent_url) => {
  const resolved_url = new URL(specifier, parent_url ?? pathToFileURL(process.cwd()));
  const resolved_path = fileURLToPath(resolved_url);
  const extension = path.extname(resolved_path);
  const fallback_extension = EXTENSION_FALLBACKS.get(extension);

  if (!fallback_extension) {
    return null;
  }

  const fallback_path = resolved_path.slice(0, -extension.length) + fallback_extension;
  if (!fs.existsSync(fallback_path)) {
    return null;
  }

  return pathToFileURL(fallback_path).href;
};
