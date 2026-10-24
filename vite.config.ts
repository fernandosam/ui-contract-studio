import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath, URL } from "node:url";
import translatedText from "./src/ui-catalog/reui-preview-text.pt-BR.json";
import { isReuiExampleModule, transformReuiPreviewText } from "./src/ui-catalog/reui-preview-i18n";

function localizeReuiExamplePreviews(): Plugin {
  return {
    name: "reui-example-pt-br",
    enforce: "pre",
    transform(source, id) {
      if (!isReuiExampleModule(id)) return;
      const result = transformReuiPreviewText(source, id, translatedText, true);
      return result.replacements ? { code: result.code, map: null } : null;
    },
  };
}

export default defineConfig({
  plugins: [localizeReuiExamplePreviews(), react(), tailwindcss()],
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
});
