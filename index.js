var express = require("express");
var app = express();
const path = require("path");
const { dynamicImportsGraph } = require("./utils/dynamicImportsGraph");

const port = process.env.PORT || 3000;
const publicDirectoryPath = path.join(__dirname, "./public");

app.use(express.static(publicDirectoryPath));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname + "/public/index.html"));
});

app.get("/getChunksdata", (req, res) => {
  const entryPath = path.resolve("./example-code/my-entry.js");
  const srcContext = path.resolve("./example-code");
  //   const { nodes, links } = dynamicImportsGraph(entryPath, srcContext);
  //   console.log(nodes);
  //   console.log(links);
  const data = dynamicImportsGraph(entryPath, srcContext);
  res.json(data);
});

app.get("*", (req, res) => {
  res.send("Error 404");
});

app.listen(port, function () {
  console.log("server running on port 3000");
});
