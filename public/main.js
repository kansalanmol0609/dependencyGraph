console.log("From JS file!");

const getData = async () => {
  const URL = `${window.location.href}getChunksdata`;
  const response = await fetch(URL);
  const jsonData = await response.json();
  console.log(jsonData);
  return jsonData;
};

const selectedNodes = new Set();

const selectDeselectNode = (node) => {
  if (selectedNodes.has(node.label)) {
    console.log("Deleting: ", node.label);
    selectedNodes.delete(node.label);
  } else {
    console.log("Adding: ", node.label);
    selectedNodes.add(node.label);
  }
  console.log(selectedNodes);
};

const plotGraph = async () => {
  const { nodes, links } = await getData();

  function getNeighbors(node) {
    return links.reduce(
      function (neighbors, link) {
        if (link.target.id === node.id) {
          neighbors.push(link.source.id);
        } else if (link.source.id === node.id) {
          neighbors.push(link.target.id);
        }
        return neighbors;
      },
      [node.id]
    );
  }

  function isNeighborLink(node, link) {
    return link.target.id === node.id || link.source.id === node.id;
  }

  function getNodeColor(node, neighbors) {
    if (Array.isArray(neighbors) && neighbors.indexOf(node.id) > -1) {
      return "green";
    }
    return "red";
  }

  function getLinkColor(node, link) {
    return isNeighborLink(node, link) ? "green" : "black";
  }

  function getTextColor(node, neighbors) {
    return Array.isArray(neighbors) && neighbors.indexOf(node.id) > -1
      ? "green"
      : "black";
  }

  // Getting Container to be ready
  // let width = window.innerWidth;
  // let height = window.innerHeight;
  let width = (nodes.length*100);
  let height = (nodes.length*100);

  let svg = d3.select("svg");
  svg.attr("width", width).attr("height", height);

  // simulation setup with all forces
  let linkForce = d3
    .forceLink()
    .id(function (link) {
      return link.id;
    })
    .distance(function (_) {
      return 150;
    })
    .strength(function (link) {
      return link.strength;
    });

  let simulation = d3
    .forceSimulation(nodes)
    .force("link", linkForce)
    .force("charge", d3.forceManyBody().strength(-2000))
    .force("center", d3.forceCenter(width / 2, height / 2))
    .force("x", d3.forceX())
    .force("y", d3.forceY());

  let dragDrop = d3
    .drag()
    .on("start", function (node) {
      node.fx = node.x;
      node.fy = node.y;
    })
    .on("drag", function (node) {
      simulation.alphaTarget(0.7).restart();
      node.fx = d3.event.x;
      node.fy = d3.event.y;
    })
    .on("end", function (node) {
      if (!d3.event.active) {
        simulation.alphaTarget(0);
      }
      node.fx = null;
      node.fy = null;
    });

  function selectNode(selectedNode) {
    // console.log(this);
    // console.log(selectedNode.label);
    let neighbors = getNeighbors(selectedNode);

    // we modify the styles to highlight selected nodes
    nodeElements.attr("fill", function (node) {
      return getNodeColor(node, neighbors);
    });
    textElements.attr("fill", function (node) {
      return getTextColor(node, neighbors);
    });
    linkElements.attr("stroke", function (link) {
      return getLinkColor(selectedNode, link);
    });
  }

  svg
    .append("svg:defs")
    .selectAll("marker")
    .data(["end"]) // Different link/path types can be defined here
    .enter()
    .append("svg:marker") // This section adds in the arrows
    .attr("id", String)
    .attr("viewBox", "0 -5 10 10")
    .attr("refX", 15)
    .attr("refY", -1.5)
    .attr("markerWidth", 6)
    .attr("markerHeight", 6)
    .attr("orient", "auto")
    .append("svg:path")
    .attr("d", "M0,-5L10,0L0,5");

  let linkElements = svg
    .append("g")
    .attr("class", "links")
    .selectAll("line")
    .data(links)
    .enter()
    .append("line")
    .attr("stroke-width", 2)
    .attr("stroke", "black")
    .attr("marker-end", "url(#end)");

  let nodeElements = svg
    .append("g")
    .attr("class", "nodes")
    .selectAll("circle")
    .data(nodes)
    .enter()
    .append("circle")
    .attr("r", 10)
    .attr("fill", getNodeColor)
    // .call(dragDrop)
    .on("dblclick", selectDeselectNode)
    .on("click", selectNode);

  let textElements = svg
    .append("g")
    .attr("class", "texts")
    .selectAll("text")
    .data(nodes)
    .enter()
    .append("text")
    .text(function (node) {
      return node.id;
    })
    .attr("font-size", 15)
    .attr("dx", 15)
    .attr("dy", 4);

  simulation.nodes(nodes).on("tick", () => {
    nodeElements
      .attr("cx", function (node) {
        return (node.x = Math.max(15, Math.min(width - 15, node.x)));
      })
      .attr("cy", function (node) {
        return (node.y = Math.max(15, Math.min(height - 15, node.y)));
      });
    textElements
      .attr("x", function (node) {
        return (node.x = Math.max(15, Math.min(width - 15, node.x)));
      })
      .attr("y", function (node) {
        return (node.y = Math.max(15, Math.min(height - 15, node.y)));
      });
    linkElements
      .attr("x1", function (link) {
        return link.source.x;
      })
      .attr("y1", function (link) {
        return link.source.y;
      })
      .attr("x2", function (link) {
        return link.target.x;
      })
      .attr("y2", function (link) {
        return link.target.y;
      });
  });

  simulation.force("link").links(links);
};

plotGraph();

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
