import * as fs from "fs-extra";
import * as rp from "request-promise-native";
import * as cheerio from "cheerio";

interface Team {
  index: number;
  fullName: string;
  shortName: string;
}

const league = "Premier_League";
const season = encodeURI("2016–17");

// const url = "http://en.wikipedia.org/w/api.php?action=parse&page=2016%E2%80%9317_Premier_League&prop=text&section=10&format=json";

const url = `http://en.wikipedia.org/w/api.php?action=parse&page=${season}_${
  league
}&prop=text&section=10&format=json`;

const options = {
  uri: url,
  transform: body => cheerio.load(body)
};

//TODO add yargs for league / year

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
          const fullName = name
            .substring(name.lastIndexOf("/") + 1, name.lastIndexOf("\\"))
            .replace(/_/g, " ");
          const team: Team = {
            index: j,
            fullName: fullName,
            shortName: a.firstChild.nodeValue
          };
          teams.push(team);
        });
      } else {
        const $$ = cheerio.load(tr);
        $$("td").each((j: number, td: CheerioElement) => {
          let result = null;
          console.log(td.lastChild);
          // if (td.lastChild != null) {
          // }
        });
      }
    });
  })
  .catch(err => console.log(err));
