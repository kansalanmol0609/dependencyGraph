const { buildCompleteDependencyGraph }  = require("./buildDependencyGraph");

// Converting into d3.js format
const createNodes = (dynamicImportsList) => {
    const nodes = [];
    const dynamicImportsListArray = dynamicImportsList.entries();
    // console.log(dynamicImportsListArray);
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

// Converting into d3.js format
// nodes -- list of all dynamic imports
const createLinks = (nodes, dependencyGraph) => {
    const links = [];
    const isNodeDone = new Map();
    const visitedNodes = new Set();
    nodes.forEach(node => {
        // Dynamic Imports
        dependencyGraph[node.path]["dynamicImports"].forEach(chunk => {
            links.push({
                source: node.id,
                target: chunk.chunkName,
                strength: 1
            });
        })
        // Static Imports
        dependencyGraph[node.path]["staticImports"].forEach(staticImportPath => {
            visitedNodes.clear();
            const chunksArray = findAllChildChunks(staticImportPath, dependencyGraph, isNodeDone, visitedNodes);
            chunksArray.forEach(chunk => {
                links.push({
                    source: node.id,
                    target: chunk.chunkName,
                    strength: 0.5
                });
            });
        })
    })
    return links;
}

const dynamicImportsGraph = (entryPath, srcContext) => {
    const { dynamicImportsList, dependencyGraph} = buildCompleteDependencyGraph(entryPath, srcContext);
    console.log(dynamicImportsList);
    console.log(dependencyGraph);
    const nodes = createNodes(dynamicImportsList);
    const links = createLinks(nodes, dependencyGraph);
    return {
        nodes,
        links,
    }
}

exports.dynamicImportsGraph = dynamicImportsGraph;