class FileManager {
  async read(path) {}
  async readJSON(path) {
    return JSON.parse(await this.read(path));
  }
  async write(path, data) {}
}

module.exports = FileManager;
