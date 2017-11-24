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

function transformResults(value: string): number[] {
  //handle result for match against self
  if (value === "\\u2014") {
    return null;
  }
  //split on unicode em dash and convert to number
  return value.split("\\u2013").map(Number);
}

//TODO add yargs for league / year

rp(options)
  .then($ => {
    const results = new Array();
    const teams = new Array();
    $("tr").each((i: number, tr: CheerioElement) => {
      const $$ = cheerio.load(tr);
      if (i === 0) {
        //header row;
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
        const currentRow = new Array();
        $$("td").each((j: number, td: CheerioElement) => {
          const lastChild = td.lastChild;
          if (!!lastChild.lastChild) {
            // Handle cells with links for rivalries
            currentRow.push(transformResults(lastChild.lastChild.nodeValue));
          } else if (!!lastChild.nodeValue) {
            currentRow.push(transformResults(lastChild.nodeValue));
          }
        });
        results.push(currentRow);
      }
    });
    const output = { teams, results };
    const fileName = `results_${league.substr(0, 4)}_${season.substr(
      0,
      4
    )}.json`;
    fs
      .writeJSON(fileName, output)
      .then(
        () => console.log(`SUCCESS: wrote ${fileName}`),
        err => console.log("ERROR" + err)
      );
  })
  .catch(err => console.log(err));
