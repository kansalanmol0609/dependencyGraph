const express = require("express");
const app = express();
const path = require("path");
const fs = require("fs");
const { dynamicImportsGraph } = require("./utils/dynamicImportsGraph");

const port = process.env.PORT || 3000;
const publicDirectoryPath = path.join(__dirname, "./public");

const getAndSaveData = () => {
  const entryPath = path.resolve("./example-code/my-entry.js");
  const srcContext = path.resolve("./example-code");
  const excludedPaths = [
    path.resolve("./example-code/components/header").split(path.sep)
    // path.resolve("../node_modules").split(path.sep),
  ];
  const data = dynamicImportsGraph(entryPath, srcContext, excludedPaths);
  const jsonContent = JSON.stringify(data);
  fs.writeFileSync("cache.json", jsonContent, "utf8", function (err) {
    if (err) {
      throw Error("An error occured while saving JSON File.");
    }
    console.log("JSON file has been saved.");
  });
  return data;
};

app.use(express.static(publicDirectoryPath));

app.get("/", (_, res) => {
  res.sendFile(path.join(__dirname + "/public/index.html"));
});

app.get("/getChunksdata", (_, res) => {
  try {
    const cachedFile = require("./cache.json");
    if (cachedFile) {
      console.log("Data Found from Cache");
      res.json(cachedFile);
    } else {
      throw "File Empty!";
    }
  } catch (err) {
    res.json(getAndSaveData());
  }
});

app.get("/deleteComputedGraph", (_, res) => {
  try {
    fs.unlinkSync("./cache.json");
    // Require stores this file in its cache
    delete require.cache[require.resolve("./cache.json")];
    console.log("Deleted!");
    res.send("Done Successfully!");
  } catch (err) {
    console.error("Error: ", err);
  }
});

app.get("*", (_, res) => {
  res.send("Error 404");
});

app.listen(port, function () {
  console.log("server running on port 3000");
});
