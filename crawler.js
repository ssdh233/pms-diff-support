const fs = require("fs");
const cheerio = require("cheerio");
const fetch = require("node-fetch");

async function start() {
  const PMSDatabaseHTML = fs.readFileSync("./PMSDatabase.html").toString();
  const $ = cheerio.load(PMSDatabaseHTML);

  const rows = Array.from($("#table_int > tbody > tr"));
  const result = [];

  for (let i = 0; i < 10; i++) {
    const row = $(rows[i]);
    if (row.attr("class") && row.attr("class") !== "tr_separate") {
      let lr2link = $($(row.children()[3]).children()[0]).attr("href");

      const lr2HTML = await fetch(lr2link).then((res) => res.text());
      const $lr2 = cheerio.load(lr2HTML);

      const song = {
        level: $(row.children()[0]).text(),
        title: $(row.children()[3]).text(),
        lr2link,
        artist: $(row.children()[4]).text(),
        mapper: $(row.children()[5]).text(),
        memo: $(row.children()[6]).text(),
        comment: $(row.children()[7]).text(),
        bpm: $lr2("#box > table:nth-child(10) > tbody > tr:nth-child(1) > td:nth-child(2)").text(),
        playerCount: $lr2("#box > table:nth-child(12) > tbody > tr:nth-child(3) > td:nth-child(2)").text(),
        clear_fc: $lr2("#box > table:nth-child(13) > tbody > tr:nth-child(2) > td:nth-child(2)").text(),
        clear_hard: $lr2("#box > table:nth-child(13) > tbody > tr:nth-child(2) > td:nth-child(3)").text(),
        clear_normal: $lr2("#box > table:nth-child(13) > tbody > tr:nth-child(2) > td:nth-child(4)").text(),
        clear_easy: $lr2("#box > table:nth-child(13) > tbody > tr:nth-child(2) > td:nth-child(5)").text(),
      };
      result.push(song);
    }
  }

  fs.writeFileSync("./result.json", JSON.stringify(result));
}

start();
