import * as fs from "fs-extra";
import * as rp from "request-promise-native";
import * as cheerio from "cheerio";
import * as yargs from "yargs";

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
  } else if (league === Leagues.PREMIERLEAGUE && season === Seasons.S17_18) {
    return 9;
  } else if (league === Leagues.BUNDESLIGA && season === Seasons.S17_18) {
    return 7;
  } else if (league === Leagues.BUNDESLIGA && season === Seasons.S16_17) {
    return 8;
  } else if (league === Leagues.LALIGA && season === Seasons.S16_17) {
    return 10;
  } else if (league === Leagues.LALIGA && season === Seasons.S17_18) {
    return 9;
  } else return 5;
}

function transformResults(value: string): number[] {
  if (!value || value === "a" || value === "\\u2014") {
    return null;
  }
  return !!value ? value.split("\\u2013").map(Number) : null;
}

yargs
  .usage("Usage: --league [league] --season [season]")
  .example("$0 --league premierleague --season 2016", "")
  .example("$0 -l premierleague -s 2016", "")
  .describe("league", "premierleague, seriea, ligue1, bundesliga, laliga")
  .describe("season", "2016, 2017")
  .require("league", "specify a league")
  .require("season", "specify a season")
  .option("league", {
    alias: "l",
    choices: [
      Leagues.PREMIERLEAGUE,
      Leagues.BUNDESLIGA,
      Leagues.LALIGA,
      Leagues.LIGUE1,
      Leagues.SERIEA
    ],
    coerce: league => {
      if (league.indexOf("bundes") >= 0) {
        return Leagues.BUNDESLIGA;
      } else if (league.indexOf("premier") >= 0) {
        return Leagues.PREMIERLEAGUE;
      } else if (league.indexOf("serie") >= 0) {
        return Leagues.SERIEA;
      } else if (league.indexOf("ligue") >= 0) {
        return Leagues.LIGUE1;
      } else if (league.indexOf("liga") >= 0) {
        return Leagues.LALIGA;
      }
    }
  })
  .option("season", {
    alias: "s",
    choices: [Seasons.S16_17, Seasons.S17_18],
    coerce: season => {
      if (season.substr(0, 4) === "2016") {
        return Seasons.S16_17;
      } else if (season.substr(0, 4) === "2017") {
        return Seasons.S17_18;
      }
    }
  })
  .string("season");

const league = yargs.argv["league"];
const season = yargs.argv["season"];
const section = leagueSeasontoSectionMap(league, season);
const url = `http://en.wikipedia.org/w/api.php?action=parse&page=${encodeURI(
  season
)}_${league}&prop=text&section=${section}&format=json`;
console.log(url);

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
            fullName: decodeURI(fullName),
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
