const cheerio = require("cheerio");
const puppeteer = require("puppeteer");
const fetch = require("node-fetch");
const AWSFileManager = require("./AWSFileManager");
const LocalFileManager = require("./LocalFileManager");

require("dotenv").config({});

let INITER = "test";
let RUN_ID;
const LIMIT = 3;
// const fm232 = new AWSFileManager({
//   Bucket: "ssdh232",
//   credentials: {
//     accessKeyId: process.env.ACCESS_KEY_ID,
//     secretAccessKey: process.env.ACCESS_KEY_SECRET,
//   },
// });
// const fm233 = new AWSFileManager({
//   Bucket: "ssdh233",
//   credentials: {
//     accessKeyId: process.env.ACCESS_KEY_ID,
//     secretAccessKey: process.env.ACCESS_KEY_SECRET,
//   },
// });

const fm232 = new LocalFileManager({ rootPath: "./temp/ssdh232/" });
const fm233 = new LocalFileManager({ rootPath: "./temp/ssdh233/" });

fm232.write("test", "12345");

async function getInitialStatus() {
  let status;
  try {
    status = await fm232.readJSON(`status-${INITER}.json`);
    console.log("initial status", status);
    if (!status.step || !status.runId || status.step === "DONE") {
      RUN_ID =
        (process.env.TEST_RUN ? "TEST_" : "REAL_") + new Date().getTime();
      status = await updateStatus({ step: "FETCH_HTML" });
    }

    RUN_ID = status.runId;
    return status;
  } catch (e) {
    console.error(e);
    RUN_ID = (process.env.TEST_RUN ? "TEST_" : "REAL_") + new Date().getTime();
    status = await updateStatus({ step: "FETCH_HTML" });
    return status;
  }
}

async function updateStatus(params) {
  const newStatus = {
    ...params,
    date: new Date().toLocaleString({ timeZone: "Asia/Tokyo" }),
    runId: RUN_ID,
  };
  await fm232.write(`status-${INITER}.json`, JSON.stringify(newStatus));
  return newStatus;
}

async function getPMSDatabaseHTML() {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  page.setDefaultNavigationTimeout(0);
  await page.goto(
    "https://pmsdifficulty.xxxxxxxx.jp/insane_PMSdifficulty.html",
    {
      waitUntil: "networkidle0",
    }
  );
  const bodyHTML = await page.evaluate(() => document.body.innerHTML);
  await browser.close();
  return bodyHTML;
}

async function crawl(n, PMSDatabaseHTML) {
  console.log(PMSDatabaseHTML && PMSDatabaseHTML.length);
  const $ = cheerio.load(PMSDatabaseHTML);

  const rows = Array.from($("#table_int > tbody > tr"));
  const result = [];

  for (let i = n * 100; i < Math.min(rows.length, (n + 1) * 100); i++) {
    await new Promise((r) => setTimeout(r, 2500));
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

  await fm232.write(`${RUN_ID}/result-${n}.json`, JSON.stringify(result));
}

(async () => {
  let status = await getInitialStatus();
  let PMSDatabaseHTML;

  console.log("RUN_ID:", RUN_ID);

  while (status.step !== "DONE") {
    console.log(status);
    switch (status.step) {
      case "FETCH_HTML": {
        PMSDatabaseHTML = await getPMSDatabaseHTML();
        console.log(
          "PMSDatabaseHTML.length",
          PMSDatabaseHTML && PMSDatabaseHTML.length
        );

        await fm232.write(
          `${RUN_ID}/insane_PMSdifficulty.html`,
          PMSDatabaseHTML
        );
        status = await updateStatus({ step: "CRAWLING", index: 0 });
        break;
      }
      case "CRAWLING": {
        if (!PMSDatabaseHTML) {
          console.log("Trying to fetch PMSDatabaseHTML");
          PMSDatabaseHTML = await fm232.read(
            `${RUN_ID}/insane_PMSdifficulty.html`
          );
        }

        console.log(
          "PMSDatabaseHTML.length",
          PMSDatabaseHTML && PMSDatabaseHTML.length
        );

        const n = status.index;
        if (n >= LIMIT) {
          status = await updateStatus({ step: "MERGE_RESULT" });
          break;
        }
        await crawl(n, PMSDatabaseHTML);
        status = await updateStatus({ step: "CRAWLING", index: n + 1 });
        break;
      }
      case "MERGE_RESULT": {
        let result = [];
        for (let i = 0; i < LIMIT; i++) {
          const part = await fm232.readJSON(`${RUN_ID}/result-${i}.json`);
          result = result.concat(part);
        }
        await fm233.write(
          `${RUN_ID}/result.json`,
          JSON.stringify({ result, date: new Date().getTime() }),
          { ACL: "public-read" }
        );
        // await fm233.write(
        //   "result.json",
        //   JSON.stringify({ result, date: new Date().getTime() }),
        //   { ACL: "public-read" }
        // );
        status = await updateStatus({ step: "DONE" });
        break;
      }
    }
  }
})();
