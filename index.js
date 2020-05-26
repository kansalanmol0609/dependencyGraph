const path = require("path");
const fs = require("fs");
const parser = require("@babel/parser");
const traverse = require("@babel/traverse").default;
const { getFilePath, getChunkNameFromArgument, isJsFile } = require("./utils");

// Paths to exclude while building dependency graph
const excludedPaths = [
  path.resolve("../covidIndia/node_modules").split(path.sep),
];

const getEntryPath = () => {
  return path.resolve("../covidIndia/src/index.js");
};

// Function to read file
function readFileContent(filepath) {
  try {
    const fileContent = fs.readFileSync(filepath, { encoding: "utf-8" });
    return fileContent;
  } catch (e) {
    console.log(filepath);
    debugger;
  }
}

// Get both static and dynamic Imports from a given absolute path file
const getImportsFromFile = (filePath) => {
  console.log("FILE BEING PARSED: ", filePath);
  const dir = path.parse(filePath).dir;  
  const srcContext = path.resolve("../covidIndia/src");
  const fileContent = readFileContent(filePath);
  const fileAST = parser.parse(fileContent, {
    sourceType: "module",
    plugins: ["jsx", "typescript", "classProperties", "exportDefaultFrom"],
  });
  const fileData = {
    dynamicImports: [],
    staticImports: [],
  };

  // Traversing the ast to get static and dynamic imports
  traverse(fileAST, {
    // Static Imports
    ImportDeclaration(astPath) {
      const childFilePath = astPath.node.source.value;
      if (!isJsFile(childFilePath)) {
				return;
			}
			const resolvedChildPath = getFilePath(dir, srcContext, childFilePath);
			if (resolvedChildPath) {
				if (typeof resolvedChildPath !== "string") {
					debugger;
				}
        fileData["staticImports"].push(resolvedChildPath);
			}
    },
    // Dynamic Imports
    CallExpression(astPath) {
      const callExpNode = astPath.node;
      if (callExpNode.callee.type === "Import") {
        const childFilePath = callExpNode.arguments[0].value;
        if (!isJsFile(childFilePath)) {
          return;
        }
        const resolvedChildPath = getFilePath(dir, srcContext, childFilePath);
        if (resolvedChildPath) {
          if (typeof resolvedChildPath !== "string") {
            debugger;
          }
          const chunkName = getChunkNameFromArgument(callExpNode.arguments[0]);
          if(!chunkName){
            chunkName = childFilePath;
          }
          fileData["dynamicImports"].push({
            childFilePath: resolvedChildPath,
            chunkName,
          });
        }
      }
    },
  });
  return fileData;
};

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

const DFS = (filePath, dependencyGraph, isNodeDone) => {
  isNodeDone[filePath] = true;
  dependencyGraph[filePath] = getImportsFromFile(filePath);
  if (ExcludedPath(filePath)) {
    return;
  }
  // Static Imports
  dependencyGraph[filePath]["staticImports"].forEach(childFile => {
    if(!isNodeDone.hasOwnProperty(childFile)){
      DFS(childFile, dependencyGraph, isNodeDone);
    }
  })

  // Dynamic Imports
  dependencyGraph[filePath]["dynamicImports"].forEach(childFIle => {
    if(!isNodeDone.hasOwnProperty(childFile.childFilePath)){
      DFS(childFile.childFilePath, dependencyGraph, isNodeDone);
    }
  })
  return;
};

const buildCompleteDependencyGraph = () => {
  const EntryPath = getEntryPath();
  // key - string,  value - object having two keys - dynamicImports and staticImports
  // Final graph will be in this object
  const dependencyGraph = {};
  const isNodeDone = {};
  isNodeDone[EntryPath] = true;
  DFS(EntryPath, dependencyGraph, isNodeDone);
  console.log(dependencyGraph);
  return dependencyGraph;
};

buildCompleteDependencyGraph();
