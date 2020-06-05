const getData = async () => {
  const URL = `${window.location.href}getChunksdata`;
  const response = await fetch(URL);
  const jsonData = await response.json();
  document.querySelector(".heading__load").style.display = "none";
  document.querySelector(".heading__options").style.display = "flex";
  document.querySelector(".selectedChunks").style.display = "flex";
  return jsonData;
};

const createToastAlert = (content) => {
  const pEl = document.createElement("p");
  pEl.textContent = content;
  pEl.className = "toast__message";
  document.querySelector(".toaster").appendChild(pEl);
  setTimeout(function () {
    pEl.remove();
  }, 3000);
};

const selectedNodes = new Set();

const selectDeselectNode = (node) => {
  if (selectedNodes.has(node)) {
    createToastAlert(`Deleting: ${node}`);
    selectedNodes.delete(node);
    // update(root);
  } else {
    createToastAlert(`Adding: ${node}`);
    selectedNodes.add(node);
  }
  renderList();
  // console.log(selectedNodes);
};

const getSelectedChunkText = () => {
  let str = "";
  selectedNodes.forEach((node) => {
    str += `,${node}`;
  });
  if (str) {
    return str.substr(1);
  }
  return str;
};

const renderList = () => {
  const divEl = document.getElementById("selectedChunksList");
  divEl.innerHTML = null;
  if (selectedNodes.size) {
    Array.from(selectedNodes).forEach((node, index) => {
      const pEl = document.createElement("p");
      // if (index !== selectedNodes.size - 1) {
      //   pEl.textContent = `${node},`;
      // } else {
        pEl.textContent = `${node}`;
      // }
      pEl.className = "selectedChunks__list__item";
      divEl.appendChild(pEl);
    });
  } else {
    divEl.textContent = "No Chunk Selected!";
  }
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
  let width = Math.max(900, d3.max(levelWidth)*1.5); // 20 pixels per line
  let height = Math.max(500, levelWidth.length * 220);

  // Clear Previous SVG
  document.getElementById("svgDiv").innerHTML = null;
  // Set the dimensions and margins of the diagram
  let margin = { top: 30, right: 30, bottom: 30, left: 30 };
  width = width - margin.left - margin.right;
  height = height - margin.top - margin.bottom;

  let svg = d3
    .select("#svgDiv")
    .append("svg")
    .attr("width", width + margin.right + margin.left)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  var i = 0,
    duration = 300,
    root;
  
    document.querySelector("#svgDiv").scrollIntoView(true);

  // declares a tree layout and assigns the size
  let treemap = d3.tree().size([width, height]);

  // Assigns parent, children, height, depth
  // Constructs a root node from the specified hierarchical data
  root = d3.hierarchy(treeData, function (d) {
    return d.children;
  });
  root.x0 = height / 2; // centering root
  root.y0 = 0;

  // Collapse after the second level
  if (root.children) {
    root.children.forEach(collapse);
  }

  update(root);

  // Collapse the node and all it's children
  function collapse(d) {
    if (d.children) {
      d._children = d.children;
      d._children.forEach(collapse);
      d.children = null;
    }
  }

  function update(source) {
    // Assigns the x and y position for the nodes
    let treeData = treemap(root);
    // Compute the new tree layout
    let nodes = treeData.descendants(),
      links = treeData.descendants().slice(1);

    // Normalize for fixed-depth.
    nodes.forEach(function (d) {
      d.y = d.depth * 220;
    });

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
        return "translate(" + d.x + "," + d.y + ")";
      })
      .on("click", click)
      .on("contextmenu", mouseover);

    // Add Circle for the nodes
    nodeEnter
      .append("circle")
      .attr("class", "node")
      .attr("r", 1e-9)
      .style("fill", function (d) {
        return d._children ? "lightsteelblue" : "#fff";
      });

    // Add labels for the nodes
    nodeEnter
      .append("text")
      .attr("dy", ".35em")
      .attr("y", function (d) {
        return d.children || d._children ? -20 : 20;
      })
      .attr("text-anchor", function (d) {
        return "middle";
        // return d.children || d._children ? "end" : "start";
      })
      .attr("cursor", "pointer")
      .text(function (d) {
        return d.data.name;
      });

    // Merge Text wuth Node
    let nodeUpdate = nodeEnter.merge(node);

    // Transition to the proper position for the node
    nodeUpdate
      .transition()
      .duration(duration)
      .attr("transform", function (d) {
        return "translate(" + d.x + "," + d.y + ")";
      });

    // Update the node attributes and style
    nodeUpdate
      .select("circle.node")
      .attr("r", 7)
      .style("fill", function (d) {
        // console.log(d.data.name);
        if (selectedNodes.has(d.data.name)) {
          return "green";
        } else if (d.data.repeated) {
          return "red";
        } else {
          return d._children ? "lightsteelblue" : "#fff";
        }
      })
      .attr("cursor", "pointer");

    // Remove any exiting nodes
    var nodeExit = node
      .exit()
      .transition()
      .duration(duration)
      .attr("transform", function (d) {
        return "translate(" + source.x + "," + source.y + ")";
      })
      .remove();

    // On exit reduce the node circles size to 0
    nodeExit.select("circle").attr("r", 1e-6);

    // On exit reduce the opacity of text labels
    nodeExit.select("text").style("fill-opacity", 1e-6);

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

    // Remove any exiting links
    var linkExit = link
      .exit()
      .transition()
      .duration(duration)
      .attr("d", function (d) {
        var o = { x: source.x, y: source.y };
        return diagonal(o, o);
      })
      .remove();

    // Store the old positions for transition.
    nodes.forEach(function (d) {
      d.x0 = d.x;
      d.y0 = d.y;
    });

    // Creates a curved (diagonal) path from parent to the child nodes
    function diagonal(s, d) {
      path = `M ${d.x} ${d.y}
            C ${d.x} ${(d.y + s.y) / 2},
              ${s.x} ${(d.y + s.y) / 2},
              ${s.x} ${s.y}`;

      return path;
    }

    // Toggle children on click.
    function mouseover(d) {
      if (d.children) {
        d._children = d.children;
        d.children = null;
      } else if(d.children || d._children) {
        // If we have to show it's children, we do not show its sibling nodes' children
        if (d.ancestors().length > 1) {
          d.ancestors()[1].children.forEach((child) => {
            if (child.children) {
              child._children = child.children;
              child.children = null;
            }
          });
        }
        d.children = d._children;
        d._children = null;
      }
      update(d);
    }

    function click(d) {
      selectDeselectNode(d.data.name);
      update(root);
    }

    let old_element = document.getElementById("selectedChunksList");
    let new_element = old_element.cloneNode(true);
    old_element.parentNode.replaceChild(new_element, old_element);

    new_element.addEventListener("click", (event) => {
      if (event.target.className === "selectedChunks__list__item") {
        // console.log(event.target.innerText);
        let node = event.target.innerText;
        if (node.endsWith(",")) {
          node = node.substr(0, node.length - 1);
        }
        if (selectedNodes.has(node)) {
          createToastAlert(`Deleting: ${node}`);
          selectedNodes.delete(node);
          update(root);
          renderList();
        }
      }
    });
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
    let chunkMenuEl = document.getElementById("inputChunkMenu");
    nodes.forEach((node) => {
      let divEl = document.createElement("div");
      divEl.className = "item";
      divEl.setAttribute("data-value", node.label);
      divEl.setAttribute("title", node.label);
      divEl.textContent = node.label;
      chunkMenuEl.appendChild(divEl);
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

document.getElementById("inputChunk").addEventListener("change", function (e) {
  e.preventDefault();
  console.log(e.target.value);
  let rootChunk = e.target.value;
  if (chunksGraph.hasOwnProperty(rootChunk)) {
    let isNodeDone = new Map();
    let treeData = createTreeFormat(rootChunk, isNodeDone);
    plotTree(treeData);
  } else {
    console.log("Invalid Option!");
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

// Copy Button
document
  .getElementById("selectedChunksButton")
  .addEventListener("click", () => {
    // console.log("Copied!")
    let dummy = document.createElement("textarea");
    document.body.appendChild(dummy);
    dummy.value = getSelectedChunkText();
    dummy.select();
    document.execCommand("copy");
    document.body.removeChild(dummy);
    createToastAlert("Copied to Clipboard!");
  });

document.addEventListener("contextmenu", (event) => event.preventDefault());
$('.ui.dropdown').dropdown();