const fs = require("fs");

let result = [];
for (let i = 0; i < 70; i++) {
  const part = JSON.parse(fs.readFileSync(`result-${i}.json`).toString());
  result = result.concat(part);
}

fs.writeFileSync(`result.json`, JSON.stringify(result));
