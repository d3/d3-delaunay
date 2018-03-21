import commonjs from "rollup-plugin-commonjs";
import noderesolve from "rollup-plugin-node-resolve";
import uglify from "rollup-plugin-uglify";

const definition = require("./package.json");
const name = definition.name;
const banner = `// ${definition.homepage} Version ${definition.version}. Copyright 2018 Observable, Inc.
// https://github.com/mapbox/delaunator Version ${require("delaunator/package.json").version}. Copyright 2017, Mapbox, Inc.`;

const output = (file, plugins) => ({
  input: "src/index.js",
  plugins,
  output: {
    file,
    banner,
    format: "umd",
    name
  }
});

export default [
  output(`dist/${name}.js`, [noderesolve(), commonjs()]),
  output(`dist/${name}.min.js`, [noderesolve(), commonjs(), uglify({output: {preamble: banner}})])
];
