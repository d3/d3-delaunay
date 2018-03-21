import commonjs from "rollup-plugin-commonjs";
import noderesolve from "rollup-plugin-node-resolve";
import uglify from "rollup-plugin-uglify";

const definition = require("./package.json");
const name = definition.name;
const banner = `// ${definition.homepage} Version ${definition.version}. Copyright 2018 Observable, Inc.
// https://github.com/mapbox/delaunator Version ${require("delaunator/package.json").version}. Copyright 2017, Mapbox, Inc.`;

const config = (file, ...plugins) => ({
  input: "src/index.js",
  plugins: [
    commonjs(),
    noderesolve(),
    ...plugins
  ],
  output: {
    banner,
    extend: true,
    file: `dist/${file}`,
    format: "umd",
    name: "d3"
  }
});

export default [
  config(`${name}.js`),
  config(`${name}.min.js`, uglify({output: {preamble: banner}}))
];
