const { buildCompleteDependencyGraph }  = require("./buildDependencyGraph");

// Converting into d3.js format
const createNodes = (dynamicImportsList) => {
    const nodes = [];
    const dynamicImportsListArray = dynamicImportsList.entries();
    for(entry of dynamicImportsListArray){
        nodes.push({
            id: entry[0],
            path: entry[1],
            label: entry[0],
        })
    };
    return nodes;
}

const findAllChildChunks = (staticImportPath, dependencyGraph, isNodeDone, visitedNodes) => {
    //If this node is already visited
    if(visitedNodes.has(staticImportPath)){
        return [];
    }
    visitedNodes.add(staticImportPath);
    // If already key present
    if(isNodeDone.has(staticImportPath)){
        return isNodeDone.get(staticImportPath);
    }
    // Dynamic Imports
    let chunksArray = dependencyGraph[staticImportPath]["dynamicImports"];
    // Static Imports
    dependencyGraph[staticImportPath]["staticImports"].forEach(staticImport => {
        chunksArray = chunksArray.concat(findAllChildChunks(staticImport, dependencyGraph, isNodeDone, visitedNodes));
    })
    isNodeDone.set(staticImportPath, chunksArray);
    return chunksArray;
}

// nodes -- list of all dynamic imports
const createChunksGraph = (nodes, dependencyGraph, chunksGraph) => {
    const isNodeDone = new Map();
    const visitedNodes = new Set();
    // For every chunk
    nodes.forEach(node => {
        chunksGraph[node.id] = [];
        // Dynamic Imports
        dependencyGraph[node.path]["dynamicImports"].forEach(chunk => {
            chunksGraph[node.id].push({
                name: chunk.chunkName,
                path: chunk.childFilePath,
            });
        })
        // Static Imports
        dependencyGraph[node.path]["staticImports"].forEach(staticImportPath => {
            visitedNodes.clear();
            const chunksArray = findAllChildChunks(staticImportPath, dependencyGraph, isNodeDone, visitedNodes);
            chunksArray.forEach(chunk => {
                chunksGraph[node.id].push({
                    name: chunk.chunkName,
                    path: chunk.childFilePath,
                });
            });
        })
    })
}

const dynamicImportsGraph = (entryPath, srcContext) => {
    const { dynamicImportsList, dependencyGraph} = buildCompleteDependencyGraph(entryPath, srcContext);
    console.log(dependencyGraph);
    const nodes = createNodes(dynamicImportsList);
    const chunksGraph = {};
    createChunksGraph(nodes, dependencyGraph, chunksGraph);
    return {
        nodes,
        chunksGraph,
    }
}

exports.dynamicImportsGraph = dynamicImportsGraph;