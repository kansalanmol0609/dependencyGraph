const path = require("path");
const fs = require("fs");
const babel = require("@babel/core");
const { CachedInputFileSystem, ResolverFactory } = require("enhanced-resolve");

// Paths to exclude while building dependency graph
const excludedPaths = [
    path.resolve("../covidIndia/node_modules").split(path.sep)
];

const getEntryPath = () => {
    return path.resolve("../covidIndia/src/index.js");
};

// Function for DFS traversal of AST and extracting static and dynamic imports
const visitAST = async (ast, fileData, filePath) => {
    if (!ast) {
        return;
    }
    //Static Import
    if (ast.hasOwnProperty("type") && ast.type === "ImportDeclaration") {
        fileData["staticImports"].push(ast.source.value);
    } 
    else {
        if (ast.hasOwnProperty("callee") && ast.callee.type === "Import") {
            fileData["dynamicImports"].push(ast.arguments[0].value);
        }
        const keys = Object.keys(ast);
        for (let i = 0; i < keys.length; i++) {
            const child = ast[keys[i]];
            // could be an array of nodes or just a node
            if (Array.isArray(child)) {
                for (let j = 0; j < child.length; j++) {
                    visitAST(child[j], fileData, filePath);
                }
            } else if (typeof child === "object") {
                visitAST(child, fileData, filePath);
            }
        }
    }
};

// Get both static and dynamic Imports from a given absolute path file
const getImportsFromFile = (filePath) => {
    const fileContent = fs.readFileSync(filePath, "utf-8");
    const fileAST = babel.parseSync(fileContent);
    const fileData = {
        dynamicImports: [],
        staticImports: [],
    };
    visitAST(fileAST.program.body, fileData, filePath);
    return fileData;
};

// create a resolver
const myResolver = ResolverFactory.createResolver({
  fileSystem: new CachedInputFileSystem(fs, 4000),
  extensions: [".js", ".json", ".jsx", ".ts", ".tsx"],
  modules: ["node_modules"],
});

const ExcludedPath = (filePath) => {
    const filePathArray = filePath.split(path.sep);
    for(let i=0; i<excludedPaths.length; i++){
        let j=0;
        while(j<filePathArray.length && j<excludedPaths[i].length && excludedPaths[i][j]==filePathArray[j]){
            j++;
        }
        if(j == excludedPaths[i].length){
            return true;
        }
    }
    return false;
}

const DFS = async (filePath, dependencyGraph, isNodeDone) => {
  isNodeDone[filePath] = true;
//   dependencyGraph[filePath]
  const tmpFilesPath = getImportsFromFile(filePath);
  const importTypes = ["staticImports", "dynamicImports"];
  if(ExcludedPath(filePath)){
      return;
  }
  console.log(filePath);
  const totalImports = tmpFilesPath["staticImports"].length + tmpFilesPath["dynamicImports"].length;
  dependencyGraph[filePath] = {
    dynamicImports: [],
    staticImports: [],
  }
  importTypes.forEach(importType => {
        tmpFilesPath[importType].forEach(async file => {
            await myResolver.resolve({}, path.dirname(filePath) , file, {}, (err, childFilePath) => {
              if (err) {
                console.log("Error: ", err);
                return;
              }
              console.log(childFilePath);
              dependencyGraph[filePath][importType].push(childFilePath);
              if (!isNodeDone.hasOwnProperty(childFilePath) && childFilePath.match(/\.jsx?/)) {
                DFS(childFilePath, dependencyGraph, isNodeDone);
              }
            });
        })
  });

//   while(totalImports != (dependencyGraph[filePath]["staticImports"].length + dependencyGraph[filePath]["dynamicImports"].length)){
//       console.log(dependencyGraph[filePath]["staticImports"].length + dependencyGraph[filePath]["dynamicImports"].length);
//   }
  return;
};

const buildCompleteDependencyGraph = async () => {
  const EntryPath = getEntryPath();
  // key - string,  value - object having two keys - dynamicImports and staticImports
  // Final graph will be in this object
  const dependencyGraph = {};
  const isNodeDone = {};
  isNodeDone[EntryPath] = true;
  DFS(EntryPath, dependencyGraph, isNodeDone);
  console.log(dependencyGraph);
  setTimeout(() => {
    console.log(dependencyGraph);
  }, 2000);
  // return dependencyGraph;
};

buildCompleteDependencyGraph();