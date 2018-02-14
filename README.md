# publists

[![David](https://img.shields.io/david/xavdid/publists.svg?maxAge=2592000)](https://david-dm.org/xavdid/publists)

Public lists for Wunderlists.

## Deprecation

As Wunderlist will (eventually) [shut off](https://techcrunch.com/2017/04/19/microsoft-to-shut-down-wunderlist-in-favor-of-its-new-app-to-do/), so too will this. It'll stay up for now, but will eventually just be memories.

## Background

[Once upon a time](https://www.wunderlist.com/blog/a-guide-to-public-lists/) Wunderlist offered public lists. Later that month, they [unreleased](https://support.wunderlist.com/customer/portal/questions/16325899-publishing-a-list) it. Here's our shot and bringing the feature back.

If you've got suggestions or bug reports, please feel free to drop me a line or open a report!

## Running Locally

This project is written in [Typescript](http://www.typescriptlang.org/), so you'll need to have the compilder available (it's an npm package).

Then, run `npm install` and wait patiently.

Once that finishes, you can use Foreman (in your preffered language) to run `Procfile.dev`, which'll handle watching typescript, re-browserifying things, etc.

You'll also need a `.env` file with the following keys:

```
COOKIE_SECRET
MONGOLAB_URI
REDIS_URL
SERVER_SECRET
STATE
WUNDERLIST_ACCESS_TOKEN
WUNDERLIST_CLIENT_ID
WUNDERLIST_CLIENT_SECRET
```

The Wunerlist stuff is from their API, Redis and Mongo are from heroku, and the others are random strings.

## Attribution

Icons made by [Freepik](http://www.freepik.com "Freepik") from [www.flaticon.com](http://www.flaticon.com "Flaticon") is licensed by [CC 3.0 BY](http://creativecommons.org/licenses/by/3.0/ "Creative Commons BY 3.0").

This app was made for fun and is not affiliated with Wunderlist in any way.
