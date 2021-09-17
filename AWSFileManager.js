const FileManager = require("./FileManager");
const AWS = require("aws-sdk");

class AWSFileManager extends FileManager {
  constructor({ Bucket, credentials: { accessKeyId, secretAccessKey } }) {
    super();

    this.s3 = new AWS.S3({
      accessKeyId,
      secretAccessKey,
    });
    this.Bucket = Bucket;
  }

  async read(path) {
    const data = await this.s3
      .getObject({
        Bucket: this.Bucket,
        Key: path,
      })
      .promise();
    return data.Body;
  }

  async write(path, data, options) {
    return this.s3
      .upload({
        Bucket: this.Bucket,
        Key: path,
        Body: data,
        ...options,
      })
      .promise();
  }
}

module.exports = AWSFileManager;
