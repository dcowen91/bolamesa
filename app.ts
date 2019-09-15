import * as cheerio from "cheerio";
import * as rp from "request-promise-native";
import * as yargs from "yargs";

interface ITeam {
  index: number;
  fullName: string;
  shortName: string;
}
type IResult = number[] | null;

interface IOutput {
  teams: ITeam[];
  results: IResult[][];
}

enum League {
  PREMIERLEAGUE = "Premier_League",
  BUNDESLIGA = "Bundesliga",
  LALIGA = "La_Liga",
  SERIEA = "Serie_A",
  LIGUE1 = "Ligue_1"
}

enum Season {
  S16_17 = "2016–17",
  S17_18 = "2017–18",
  S18_19 = "2018–19",
  S19_20 = "2019–20"
}

// Wikipedia stores the "results" section differently per article
// TODO add other leagues
const SectionMap: { [key: string]: number } = {
  [getSeasonKey(League.PREMIERLEAGUE, Season.S19_20)]: 6,
  [getSeasonKey(League.PREMIERLEAGUE, Season.S18_19)]: 7,
  [getSeasonKey(League.PREMIERLEAGUE, Season.S17_18)]: 10,
  [getSeasonKey(League.PREMIERLEAGUE, Season.S16_17)]: 10
};

function getSeasonKey(league: League, season: Season): string {
  return `${league}_ ${season}`;
}

function transformResults(value: string): IResult {
  if (value === "a" || value === "\\n" || value === "—\\n") {
    return null;
  }
  return value
    .replace("\\n", "")
    .split("\\u2013")
    .map(Number);
}

yargs
  .usage("Usage: --league [league] --season [season]")
  .example("$0 --league premierleague --season 2016", "")
  .example("$0 -l premierleague -s 2016", "")
  .describe("league", "premierleague, seriea, ligue1, bundesliga, laliga")
  .describe("season", "2016, 2017, 2018, 2019")
  .require("league", "specify a league")
  .require("season", "specify a season")
  .option("league", {
    alias: "l",
    choices: [
      League.PREMIERLEAGUE,
      League.BUNDESLIGA,
      League.LALIGA,
      League.LIGUE1,
      League.SERIEA
    ],
    coerce: league => {
      if (league.indexOf("bundes") >= 0) {
        return League.BUNDESLIGA;
      } else if (league.indexOf("premier") >= 0) {
        return League.PREMIERLEAGUE;
      } else if (league.indexOf("serie") >= 0) {
        return League.SERIEA;
      } else if (league.indexOf("ligue") >= 0) {
        return League.LIGUE1;
      } else if (league.indexOf("liga") >= 0) {
        return League.LALIGA;
      }
    }
  })
  .option("season", {
    alias: "s",
    choices: [Season.S16_17, Season.S17_18, Season.S18_19, Season.S19_20],
    coerce: season => {
      if (season.substr(0, 4) === "2016") {
        return Season.S16_17;
      } else if (season.substr(0, 4) === "2017") {
        return Season.S17_18;
      } else if (season.substr(0, 4) === "2018") {
        return Season.S18_19;
      } else if (season.substr(0, 4) === "2019") {
        return Season.S19_20;
      }
    }
  })
  .string("season");

const league = yargs.argv["league"] as League;
const season = yargs.argv["season"] as Season;

const section = SectionMap[getSeasonKey(league, season)];
const url = `http://en.wikipedia.org/w/api.php?action=parse&page=${encodeURI(
  season
)}_${league}&prop=text&section=${section}&format=json`;

const options = {
  uri: url,
  transform: (body: string) => cheerio.load(body)
};

rp(options)
  .then($ => {
    const results: IResult[][] = [];
    const teams: ITeam[] = [];
    const table: CheerioElement = $("table").get(0);
    const $$ = cheerio.load(table);
    $$("tr").each((i: number, tr: CheerioElement) => {
      const $$$ = cheerio.load(tr);
      if (i === 0) {
        $$$("a").each((j: number, a: CheerioElement) => {
          const name = a.attribs["href"];
          const fullName = name
            .substring(name.lastIndexOf("/") + 1, name.lastIndexOf("\\"))
            .replace(/_/g, " ");
          const team: ITeam = {
            index: j,
            fullName: decodeURI(fullName),
            shortName: a.firstChild.nodeValue
          };
          teams.push(team);
        });
      } else {
        const currentRow: IResult[] = [];
        $$$("td").each((j: number, td: CheerioElement) => {
          const lastChild = td.firstChild;
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
    const output: IOutput = { teams, results };

    console.log(JSON.stringify(output));
  })
  .catch(err => console.log(err));
