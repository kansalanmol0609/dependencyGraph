const getData = async () => {
  const URL = `${window.location.href}getChunksdata`;
  const response = await fetch(URL);
  const jsonData = await response.json();
  console.log(jsonData);
  document.querySelector(".heading__load").style.display = "none";
  document.querySelector(".heading__options").style.display = "flex";
  return jsonData;
};

const selectedNodes = new Set();

const selectDeselectNode = (node) => {
  if (selectedNodes.has(node)) {
    console.log("Deleting: ", node);
    selectedNodes.delete(node);
  } else {
    console.log("Adding: ", node);
    selectedNodes.add(node);
  }
  console.log(selectedNodes);
};

const plotTree = (treeData) => {
  
  var levelWidth = [1];
  var childCount = function (level, n) {
    if (n.children && n.children.length > 0) {
      if (levelWidth.length <= level + 1) levelWidth.push(0);

      levelWidth[level + 1] += n.children.length;
      n.children.forEach(function (d) {
        childCount(level + 1, d);
      });
    }
  };
  childCount(0, treeData);
  let height = Math.max(500, d3.max(levelWidth) * 13); // 20 pixels per line
  let width = Math.max(900, levelWidth.length*150);

  // Clear Previous SVG
  document.getElementById("svgDiv").innerHTML = null;
  // Set the dimensions and margins of the diagram
  let margin = { top: 20, right: 90, bottom: 30, left: 90 };
    width = width - margin.left - margin.right;
    height = height - margin.top - margin.bottom;

  let svg = d3
    .select("#svgDiv")
    .append("svg")
    .attr("width", width + margin.right + margin.left)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  let i = 0,
    duration = 750,
    root;

  // declares a tree layout and assigns the size
  let treemap = d3.tree().size([height, width]);

  // Assigns parent, children, height, depth
  // Constructs a root node from the specified hierarchical data
  root = d3.hierarchy(treeData, function (d) {
    return d.children;
  });
  root.x0 = height / 2;
  root.y0 = 0;

  update(root);

  function update(source) {
    // Assigns the x and y position for the nodes
    let treeData = treemap(root);

    // Compute the new tree layout.
    let nodes = treeData.descendants(),
      links = treeData.descendants().slice(1);

    // Normalize for fixed-depth.
    nodes.forEach(function (d) {
      d.y = d.depth * 150;
    });

    // ****************** Nodes section ***************************

    // Update the nodes...
    let node = svg.selectAll("g.node").data(nodes, function (d) {
      return d.id || (d.id = ++i);
    });

    // Enter any new modes at the parent's previous position.
    let nodeEnter = node
      .enter()
      .append("g")
      .attr("class", "node")
      .attr("transform", function (d) {
        return "translate(" + source.y0 + "," + source.x0 + ")";
      })
      .on("click", click);

    // Add Circle for the nodes
    nodeEnter
      .append("circle")
      .attr("class", "node")
      .attr("r", 1e-9)
      .style("fill", function (d) {
        return d.children ? "lightsteelblue" : "white";
      });

    // Add labels for the nodes
    nodeEnter
      .append("text")
      .attr("dy", ".35em")
      .attr("x", function (d) {
        return d.children || d._children ? -13 : 13;
      })
      .attr("text-anchor", function (d) {
        return d.children || d._children ? "end" : "start";
      })
      .text(function (d) {
        return d.data.name;
      });

    // UPDATE
    let nodeUpdate = nodeEnter.merge(node);

    // Transition to the proper position for the node
    nodeUpdate
      .transition()
      .duration(duration)
      .attr("transform", function (d) {
        return "translate(" + d.y + "," + d.x + ")";
      });

    // Update the node attributes and style
    nodeUpdate
      .select("circle.node")
      .attr("r", 5)
      .style("fill", function (d) {
        return d.data.repeated ? "red" : "white";
      })
      .attr("cursor", "pointer");

    // ****************** links section ***************************

    // Update the links...
    let link = svg.selectAll("path.link").data(links, function (d) {
      return d.id;
    });

    // Enter any new links at the parent's previous position.
    let linkEnter = link
      .enter()
      .insert("path", "g")
      .attr("class", "link")
      .attr("d", function (d) {
        let o = { x: source.x0, y: source.y0 };
        return diagonal(o, o);
      });

    // UPDATE
    let linkUpdate = linkEnter.merge(link);

    // Transition back to the parent element position
    linkUpdate
      .transition()
      .duration(duration)
      .attr("d", function (d) {
        return diagonal(d, d.parent);
      });

    // Store the old positions for transition.
    nodes.forEach(function (d) {
      d.x0 = d.x;
      d.y0 = d.y;
    });

    // Creates a curved (diagonal) path from parent to the child nodes
    function diagonal(s, d) {
      path = `M ${s.y} ${s.x}
            C ${(s.y + d.y) / 2} ${s.x},
              ${(s.y + d.y) / 2} ${d.x},
              ${d.y} ${d.x}`;

      return path;
    }

    // Toggle children on click.
    function click(d) {
      selectDeselectNode(d.data.name);
    }
  }
};

let nodes = [];
let chunksGraph = {};

const initialize = async () => {
  if (nodes.length === 0) {
    let data = await getData();
    nodes = data.nodes;
    chunksGraph = data.chunksGraph;
    // Select Chunk
    let chunkSelectEl = document.getElementById("browsers");
    nodes.forEach((node) => {
      let option = document.createElement("option");
      option.setAttribute("value", node.label);
      chunkSelectEl.appendChild(option);
    });
  }
};

initialize();

const createTreeFormat = (rootChunk, isNodeDone) => {
  isNodeDone.set(rootChunk, true);
  let tmpObj = {};
  tmpObj["name"] = rootChunk;
  tmpObj["children"] = [];
  chunksGraph[rootChunk].forEach((child) => {
    if (!isNodeDone.has(child.name)) {
      tmpObj["children"].push(createTreeFormat(child.name, isNodeDone));
    } else {
      tmpObj["children"].push({
        name: child.name,
        children: [],
        repeated: true,
      });
    }
  });
  return tmpObj;
};

let a = document.getElementsByName("browser")[0];
a.addEventListener("change", function (e) {
  let rootChunk = this.value;
  e.preventDefault();
  if (chunksGraph.hasOwnProperty(rootChunk)) {
    let isNodeDone = new Map();
    let treeData = createTreeFormat(rootChunk, isNodeDone);
    plotTree(treeData);
  } else {
    console.log("Invalid Option!");
    document.getElementById("inputChunk").value = "";
  }
});

// Force Recompute Dependency Graph
document
  .getElementById("recomputeDepGraph")
  .addEventListener("click", async (_) => {
    const URL = `${window.location.href}deleteComputedGraph`;
    const response = await fetch(URL);
    if (response.status === 200) {
      location.reload();
    } else {
      console.log("Error Occurred!");
    }
  });
