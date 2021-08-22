const AWS = require("aws-sdk");
const cheerio = require("cheerio");
const puppeteer = require("puppeteer");
const fetch = require("node-fetch");

require("dotenv").config({});

const LIMIT = 70;

const s3 = new AWS.S3({
  accessKeyId: process.env.ACCESS_KEY_ID,
  secretAccessKey: process.env.ACCESS_KEY_SECRET,
});

async function getJSON(params) {
  console.log("getJSON", params);
  let data = await s3.getObject(params).promise();
  return JSON.parse(data.Body);
}

async function getInitialStatus() {
  try {
    let status = await getJSON({ Bucket: "ssdh232", Key: "status.json" });
    console.log("initial status", status);
    if (!status.step || status.step === "DONE") {
      status = await updateStatus({ step: "FETCH_HTML" });
    }
    return status;
  } catch (e) {
    console.error(e);
    status = await updateStatus({ step: "FETCH_HTML" });
    return status;
  }
}

async function updateStatus(params) {
  let newStatus = {
    ...params,
    date: new Date().toLocaleString({ timeZone: "Asia/Tokyo" }),
  };
  await s3
    .upload({
      Bucket: "ssdh232",
      Key: "status.json",
      Body: JSON.stringify(newStatus),
    })
    .promise();

  return newStatus;
}

async function getPMSDatabaseHTML() {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
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

  await s3
    .upload({
      Bucket: "ssdh232",
      Key: `result-${n}.json`,
      Body: JSON.stringify(result),
    })
    .promise();
}

(async () => {
  let status = await getInitialStatus();
  let PMSDatabaseHTML;

  while (status.step !== "DONE") {
    console.log(status);
    switch (status.step) {
      case "FETCH_HTML": {
        PMSDatabaseHTML = await getPMSDatabaseHTML();
        console.log(
          "PMSDatabaseHTML.length",
          PMSDatabaseHTML && PMSDatabaseHTML.length
        );

        await s3
          .upload({
            Bucket: "ssdh232",
            Key: "insane_PMSdifficulty.html",
            Body: PMSDatabaseHTML,
          })
          .promise();
        status = await updateStatus({ step: "CRAWLING", index: 0 });
        break;
      }
      case "CRAWLING": {
        if (!PMSDatabaseHTML) {
          console.log("Trying to fetch PMSDatabaseHTML");
          PMSDatabaseHTML = (
            await s3
              .getObject({
                Bucket: "ssdh232",
                Key: "insane_PMSdifficulty.html",
              })
              .promise()
          ).Body;
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
          const part = await getJSON({
            Bucket: "ssdh232",
            Key: `result-${i}.json`,
          });
          result = result.concat(part);
        }
        await s3
          .upload({
            Bucket: "ssdh233",
            Key: "result.json",
            Body: JSON.stringify(result),
          })
          .promise();
        status = await updateStatus({ step: "DONE" });
        break;
      }
    }
  }
})();
