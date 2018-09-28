# MusicTube Player
> MusicTube is an unofficial YouTube Music Desktop application, with some additions that I feel necessary, notably media keys and system notifications.

[![Build Status][ci-image]][ci-url]
[![Release Version][release-image]][release-url]
[![Download Release][download-image]][release-url]

![Opening Screenshot](assets/pics/start-screenshot.png)

## Installation

OSX

```sh
npm install && npm run osx
```

~~Windows:~~

```sh
npm install && npm run win
```

## Development setup

The application can be ran in development mode using the command npm below, tests can also be completed and ran through npm.

Development:

```sh
npm run start
```

Tests:

```sh
npm run test
```

## Release History

* 1.4.3
    * Pull Request #2 introducing [electron-window-state](https://npmjs.com/package/electron-window-state).
    * Redesigned loading screen.
* 1.4.2
    * Dependency updates.
* 1.4.1
    * FIX: Update to close behaviour to stop error notice.
* 1.4.0
    * Renamed to MusicTube with a new Icon Designed by rocketpixel / Freepik.
* 1.3.0
    * Method to auto skip over ads.
* 1.2.2
    * Code refactor.
    * Shelving update tool.
* 1.2.1
    * Testing new update tool.
* 1.2.0
    * Added a loading screen for loss of or slow internet connection.
    * Added an about panel.
* 1.1.0
    * First public release, application working on OSX (10.13.6).
* 1.0.0
    * Alpha/internal testing.

## Meta

Simon Fraser – [@symatree](https://twitter.com/symatree)

Distributed under the MIT license. See ``LICENSE`` for more information.

## Contributing

1. Fork it (<https://github.com/simon-fraser/MusicTube-Player/fork>)
2. Create your feature branch (`git checkout -b feature/fooBar`)
3. Commit your changes (`git commit -am 'Add some fooBar'`)
4. Push to the branch (`git push origin feature/fooBar`)
5. Create a new Pull Request

See ``CONTRIBUTING`` for a complete guide on contributing to this project

## Acknowledgments

Icon [Designed by rocketpixel / Freepik](http://www.freepik.com)

<!-- Markdown link & img dfn's -->
[ci-image]: https://circleci.com/gh/simon-fraser/MusicTube-Player.svg?style=svg
[ci-url]: https://circleci.com/gh/simon-fraser/MusicTube-Player
[release-image]: https://img.shields.io/github/release/simon-fraser/MusicTube-Player/all.svg
[release-url]: https://github.com/simon-fraser/MusicTube-Player/releases
[download-image]: https://img.shields.io/github/release-date/simon-fraser/MusicTube-Player.svg?colorB=brightgreen