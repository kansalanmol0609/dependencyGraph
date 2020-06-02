const path = require("path");

const ExcludedPath = (filePath, excludedPaths) => {
    const filePathArray = filePath.split(path.sep);
    for (let i = 0; i < excludedPaths.length; i++) {
      let j = 0;
      while (
        j < filePathArray.length &&
        j < excludedPaths[i].length &&
        excludedPaths[i][j] == filePathArray[j]
      ) {
        j++;
      }
      if (j == excludedPaths[i].length) {
        return true;
      }
    }
    return false;
};

exports.ExcludedPath = ExcludedPath;