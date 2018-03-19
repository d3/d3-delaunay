import commonjs from "rollup-plugin-commonjs";
import noderesolve from "rollup-plugin-node-resolve";

const definition = require("./package.json");

export default {
  input: "src/index.js",
  plugins: [
    noderesolve(),
    commonjs()
  ],
  output: {
    banner: `// ${definition.homepage} v${definition.version} Copyright 2018 Observable, Inc.
// https://github.com/mapbox/delaunator v${require("delaunator/package.json").version} Copyright 2017, Mapbox, Inc.`,
    file: `dist/${definition.name}.js`,
    format: "umd",
    name: definition.name
  }
};
