const definition = require("./package.json");

export default {
  input: "src/index.js",
  output: {
    banner: `// ${definition.homepage} Version ${definition.version}. Copyright 2018 Observable, Inc.`,
    file: `dist/${definition.name}.js`,
    format: "umd",
    name: definition.name
  }
};
