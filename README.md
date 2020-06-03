# Choose Chunks from Dependency Graph

## Problem Statement
In huge web apps consisting of large number of Dynamic and Static Imports, bundling takes a very long time even in development mode. Since developers may be working on a particular chunk and may not need the rest, choosing only particular chunks can significantly reduce the recompilation time. This project helps in choosing chunks in an efficient way.

## Setup
<ul>
  <li> Clone the repo <code>git clone https://github.com/kansalanmol0609/dependencyGraph.git</code></li>
  <li> In <code>getAndSaveData()</code> function in <code>index.js</code> file, you need to set Entry Path, Source Context Folder Path and Excluded Paths Array </li>
  <li> Example -  (Paths can be either absolute or relative) </li>
  <pre><code>
    const entryPath = path.resolve("./example-code/my-entry.js");
    const srcContext = path.resolve("./example-code");
    const excludedPaths = [
      path.resolve("./example-code/components/header").split(path.sep)
    ];
  </code></pre>
  <li> Start the server - <code>npm start</code> </li>
  <li> Visit <code>http://localhost:3000/</code></li>
</ul>
