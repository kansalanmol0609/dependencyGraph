const path = require("path");
const fs = require("fs");
const parser = require("@babel/parser");
const traverse = require("@babel/traverse").default;
const { getFilePath } = require("./pathResolver");
const { getChunkNameFromArgument, isJsFile } = require("./helperFunctions");
const { ExcludedPath } = require("./excludedPaths");

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
const getImportsFromFile = (filePath, srcContext, dynamicImportsList) => {
  console.log("FILE BEING PARSED: ", filePath);
  const dir = path.parse(filePath).dir;  
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
    CallExpression(astPath) {
      const callExpNode = astPath.node;
      // Dynamic Imports
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
          let chunkName = getChunkNameFromArgument(callExpNode.arguments[0]);
          if(!chunkName){
            chunkName = childFilePath;
          }
          dynamicImportsList.set( chunkName , resolvedChildPath );
          fileData["dynamicImports"].push({
            childFilePath: resolvedChildPath,
            chunkName,
          });
        }
      }
      // static imports for require statements
      else if (callExpNode.callee.name === "require") {
        const childFilePath = callExpNode.arguments[0].value;
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
      }
    },
  });
  return fileData;
};

const DFS = (filePath, dependencyGraph, isNodeDone, srcContext, dynamicImportsList, excludedPaths) => {
  isNodeDone[filePath] = true;
  if (ExcludedPath(filePath, excludedPaths)) {
    dependencyGraph[filePath] = {
      "staticImports": [],
      "dynamicImports": [],
    }
    return;
  }
  dependencyGraph[filePath] = getImportsFromFile(filePath, srcContext, dynamicImportsList);
  // Static Imports
  dependencyGraph[filePath]["staticImports"].forEach(childFile => {
    if(!isNodeDone.hasOwnProperty(childFile)){
      DFS(childFile, dependencyGraph, isNodeDone, srcContext, dynamicImportsList, excludedPaths);
    }
  })

  // Dynamic Imports
  dependencyGraph[filePath]["dynamicImports"].forEach(childFile => {
    if(!isNodeDone.hasOwnProperty(childFile.childFilePath)){
      DFS(childFile.childFilePath, dependencyGraph, isNodeDone, srcContext, dynamicImportsList, excludedPaths);
    }
  })
  return;
};

const buildCompleteDependencyGraph = (entryPath, srcContext, excludedPaths) => {
  // const entryPath = getEntryPath();
  const dependencyGraph = {};
  const dynamicImportsList = new Map();
  const isNodeDone = {};
  isNodeDone[entryPath] = true;
  DFS(entryPath, dependencyGraph, isNodeDone, srcContext, dynamicImportsList, excludedPaths);
  // console.log(dependencyGraph);
  return {
    dependencyGraph,
    dynamicImportsList
  };
};

exports.buildCompleteDependencyGraph = buildCompleteDependencyGraph;