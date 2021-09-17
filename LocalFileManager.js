const FileManager = require("./FileManager");
const fs = require("fs");
const path = require("path");

class LocalFileManager extends FileManager {
  constructor({ rootPath }) {
    super();

    this.rootPath = rootPath;

    if (!fs.existsSync(this.rootPath)) {
      fs.mkdirSync(this.rootPath);
    }
  }

  async read(filePath) {
    return fs.readFileSync(this.rootPath + filePath).toString();
  }

  async write(filePath, data) {
    console.log("write path:", this.rootPath + filePath);
    if (!fs.existsSync(this.rootPath + path.dirname(filePath))) {
      fs.mkdirSync(this.rootPath + path.dirname(filePath));
    }
    return fs.writeFileSync(this.rootPath + filePath, data);
  }
}

module.exports = LocalFileManager;
