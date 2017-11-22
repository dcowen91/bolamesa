import * as fs from "fs-extra";
import * as rp from "request-promise-native";
import * as cheerio from "cheerio";

interface Team {
  index: number;
  fullName: string;
  shortName: string;
}

const plUrl =
  "http://en.wikipedia.org/w/api.php?action=parse&page=2016%E2%80%9317_Premier_League&prop=text&section=10&format=json";

const options = {
  uri: plUrl,
  transform: body => cheerio.load(body)
};

const omittedKeys = ["href", "title", 'f.c.\\"', 'a.f.c.\\"'];

rp(options)
  .then($ => {
    const rowCount = $("tr").length - 1;
    const results = new Array(rowCount);
    const teams = new Array(rowCount);
    $("tr").each((i: number, tr: CheerioElement) => {
      if (i === 0) {
        //header row;
        const $$ = cheerio.load(tr);
        $$("a").each((j: number, a: CheerioElement) => {
          const name = a.attribs["href"];
          console.log(
            name.substring(name.lastIndexOf("/") + 1, name.lastIndexOf("\\"))
          );
          //TODO build rest of team row header object
        });
        //TODO handle data rows
      }
    });
  })
  .catch(err => console.log(err));
