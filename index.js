const path = require("path");
const { dynamicImportsGraph }  = require("./utils/dynamicImportsGraph");

// const entryPath = path.resolve("../covidIndia/src/index.js");
// const entryPath = path.resolve("../../WebD Projects/Expensify/src/app.js");
// const entryPath = path.resolve("../StaticAndDynamicImports/src/entry.jsx");
const entryPath = path.resolve("./example-code/my-entry.js");

  // const srcContext = path.resolve("../covidIndia/src");
  // const srcContext = path.resolve("../../WebD Projects/Expensify/src");
  // const srcContext = path.resolve("../StaticAndDynamicImports/src");
const srcContext = path.resolve("./example-code");

const { nodes, links} = dynamicImportsGraph(entryPath, srcContext);
console.log(nodes);
console.log(links);