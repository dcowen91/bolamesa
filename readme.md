# BolaMesa
Soccer League Tables in JSON! 

[![Dependency Status](https://david-dm.org/dcowen91/bolamesa.svg)](https://david-dm.org/dcowen91/bolamesa) [![devDependency Status](https://david-dm.org/dcowen91/bolamesa/dev-status.svg)](https://david-dm.org/dcowen91/bolamesa#info=devDependencies)
[![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square)](https://github.com/prettier/prettier)


## About
given a league and a season, generates a JSON file for the teams and current results.

## Usage
* git clone https://github.com/dcowen91/bolamesa.git
* cd bolamesa
* yarn install
* yarn build -l [League] -s [Season]
* [League] = Premier League, La Liga, Bundesliga, Ligue 1, Serie A
* [Season] = 2016-17, 2017-18

## Output
```
{
    "teams": [
        {
            "index": 0,
            "fullName": "Arsenal F.C.",
            "shortName": "ARS"
        },
        {
            "index": 1,
            "fullName": "A.F.C. Bournemouth",
            "shortName": "BOU"
        },
        // ...
    ],
      "results": [
        [
            null,  //ARS V ARS
            [  // ARS 3:0  BOU
                3,
                0
            ],
            // ...
        ]
      ]
}