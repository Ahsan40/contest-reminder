// @ts-check
import { defineConfig } from "astro/config";

import icon from "astro-icon";

import tailwind from "@astrojs/tailwind";

import solidJs from "@astrojs/solid-js";

import vercel from "@astrojs/vercel/serverless";

// https://astro.build/config
export default defineConfig({
  integrations: [icon(), tailwind(), solidJs()],
  output: "hybrid",
  adapter: vercel(),
});