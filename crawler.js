const fs = require("fs");
const cheerio = require("cheerio");
const fetch = require("node-fetch");

async function crawl(n) {
  const PMSDatabaseHTML = fs.readFileSync("./PMSDatabase.html").toString();
  const $ = cheerio.load(PMSDatabaseHTML);

  const rows = Array.from($("#table_int > tbody > tr"));
  const result = [];

  for (let i = n * 100; i < Math.min(rows.length, (n + 1) * 100); i++) {
    console.log("processing", i);
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
        bpm: $lr2(
          "#box > table:nth-of-type(1) > tbody > tr:nth-child(1) > td:nth-child(2)"
        ).text(),
        playerCount: Number(
          $lr2(
            "#box > table:nth-of-type(2) > tbody > tr:nth-child(3) > td:nth-child(2)"
          ).text()
        ),
        clear_fc: Number(
          $lr2(
            "#box > table:nth-of-type(3) > tbody > tr:nth-child(4) > td:nth-child(2)"
          )
            .text()
            .replace("%", "")
        ),
        clear_hard: Number(
          $lr2(
            "#box > table:nth-of-type(3) > tbody > tr:nth-child(4) > td:nth-child(3)"
          )
            .text()
            .replace("%", "")
        ),
        clear_normal: Number(
          $lr2(
            "#box > table:nth-of-type(3) > tbody > tr:nth-child(4) > td:nth-child(4)"
          )
            .text()
            .replace("%", "")
        ),
        clear_easy: Number(
          $lr2(
            "#box > table:nth-of-type(3) > tbody > tr:nth-child(4) > td:nth-child(5)"
          )
            .text()
            .replace("%", "")
        ),
      };
      result.push(song);
    }
  }

  fs.writeFileSync(`./result-${n}.json`, JSON.stringify(result));
}

async function start() {
  for (let n = 0; n < 67; n++) {
    await crawl(n);
  }
}

start();