const path = require("path");
const { buildCompleteDependencyGraph }  = require("./utils/buildDependencyGraph");

// const entryPath = path.resolve("../covidIndia/src/index.js");
// const entryPath = path.resolve("../../WebD Projects/Expensify/src/app.js");
// const entryPath = path.resolve("../StaticAndDynamicImports/src/entry.jsx");
const entryPath = path.resolve("./example-code/my-entry.js");

  // const srcContext = path.resolve("../covidIndia/src");
  // const srcContext = path.resolve("../../WebD Projects/Expensify/src");
  // const srcContext = path.resolve("../StaticAndDynamicImports/src");
const srcContext = path.resolve("./example-code");

console.log(buildCompleteDependencyGraph(entryPath, srcContext));