import babel from "rollup-plugin-babel";
import resolve from "rollup-plugin-node-resolve";
import commonjs from "rollup-plugin-commonjs";
import json from "@rollup/plugin-json";
import { terser } from "rollup-plugin-terser";
import copy from "rollup-plugin-copy";

export default [
  {
    input: "src/index.js",
    output: [
      {
        file: "dist/index.js",
        format: "cjs",
      },
      {
        file: "dist/index.esm.js",
        format: "es",
      },
      {
        file: "dist/index.umd.js",
        format: "umd",
        name: "CashCaptcha",
        globals: {
          axios: "axios",
          bs58: "bs58",
        },
      },
    ],
    plugins: [
      resolve({
        browser: true,
      }),
      commonjs(),
      json(),
      babel({
        exclude: "node_modules/**",
      }),
      terser(),
      copy({
        targets: [
          { src: "src/index.d.ts", dest: "dist" },
          { src: "src/drillx/pkg/*", dest: "dist/drillx/pkg" },
        ],
      }),
    ],
    external: ["axios", "bs58"],
  },
];
