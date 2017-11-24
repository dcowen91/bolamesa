import * as fs from "fs-extra";
import * as rp from "request-promise-native";
import * as cheerio from "cheerio";

interface Team {
  index: number;
  fullName: string;
  shortName: string;
}

enum Leagues {
  PREMIERLEAGUE = "Premier_League",
  BUNDESLIGA = "Bundesliga",
  LALIGA = "La_Liga",
  SERIEA = "Serie_A",
  LIGUE1 = "Ligue_1"
}

enum Seasons {
  S16_17 = "2016–17",
  S17_18 = "2017–18"
}

function leagueSeasontoSectionMap(league: Leagues, season: Seasons) {
  if (league === Leagues.PREMIERLEAGUE && season === Seasons.S16_17) {
    return 10;
  } else if (league === Leagues.PREMIERLEAGUE && season === Seasons.S16_17) {
    return 9;
  }
}

function transformResults(value: string): number[] {
  if (!value || value === "a" || value === "\\u2014") {
    return null;
  }
  return !!value ? value.split("\\u2013").map(Number) : null;
}

const league = Leagues.PREMIERLEAGUE;
const season = Seasons.S17_18;
const section = leagueSeasontoSectionMap(league, season);
const url = `http://en.wikipedia.org/w/api.php?action=parse&page=${encodeURI(
  season
)}_${league}&prop=text&section=${section}&format=json`;

const options = {
  uri: url,
  transform: body => cheerio.load(body)
};

//TODO add yargs for league / season

rp(options)
  .then($ => {
    const results = new Array();
    const teams = new Array();
    $("tr").each((i: number, tr: CheerioElement) => {
      const $$ = cheerio.load(tr);
      if (i === 0) {
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
          if (!!lastChild && !!lastChild.lastChild) {
            currentRow.push(transformResults(lastChild.lastChild.nodeValue));
          } else if (!!lastChild && !!lastChild.nodeValue) {
            currentRow.push(transformResults(lastChild.nodeValue));
          } else {
            currentRow.push(null);
          }
        });
        results.push(currentRow);
      }
    });
    const output = { teams, results };
    const fileName = `results_${league}_${season}.json`;

    fs
      .writeJSON(fileName, output)
      .then(
        () => console.log(`SUCCESS: wrote ${fileName}`),
        err => console.log("ERROR" + err)
      );
  })
  .catch(err => console.log(err));
