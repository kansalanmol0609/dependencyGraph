const path = require("path");

// Paths to exclude while building dependency graph
const excludedPaths = [
    // path.resolve("../covidIndia/node_modules").split(path.sep),
    // path.resolve("../../WebD Projects/Expensify/node_modules").split(path.sep),
    // path.resolve("../StaticAndDynamicImports/node_modules").split(path.sep),  
    path.resolve("../node_modules").split(path.sep),  
];

const ExcludedPath = (filePath) => {
    const filePathArray = filePath.split(path.sep);
    for (let i = 0; i < excludedPaths.length; i++) {
      let j = 0;
      while (
        j < filePathArray.length &&
        j < excludedPaths[i].length &&
        excludedPaths[i][j] == filePathArray[j]
      ) {
        j++;
      }
      if (j == excludedPaths[i].length) {
        return true;
      }
    }
    return false;
};

exports.ExcludedPath = ExcludedPath;