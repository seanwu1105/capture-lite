# Capture Lite

[![build](https://github.com/numbersprotocol/capture-lite/workflows/build/badge.svg)](https://github.com/numbersprotocol/capture-lite/actions?query=workflow%3Abuild)
[![Codacy Badge](https://app.codacy.com/project/badge/Grade/45ae18aaa6a7474497e0efd818452a46)](https://www.codacy.com/gh/numbersprotocol/capture-lite?utm_source=github.com&amp;utm_medium=referral&amp;utm_content=numbersprotocol/capture-lite&amp;utm_campaign=Badge_Grade)

## Highlight Features

* Generate digital proofs on media assets created.
* WIP: Publish digital proofs to decentralized networks.

## Demo App

![preview](https://i.imgur.com/VRXhKo3.png)

[The demo app](https://numbersprotocol.github.io/capture-lite/) is hosted on GitHub Page. You can simulate the mobile device by [toggling device mode with Chrome DevTools](https://developers.google.com/web/tools/chrome-devtools/device-mode).

## Getting Started

Node.js 10.16.0+ is required.

Install the dependencies.

``` bash
npm i
```

Preview the app in web browser.

``` bash
ionic serve
```

### Verification

The signature of proof can be verified with [Web Crypto API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API).

## Development

Start a local dev server for app dev/testing.

``` bash
ionic serve
```

Run tests.

``` bash
npm run test
```

Run tests in headless mode.

``` bash
npm run test-ci
```

Lint the projects.

``` bash
npm run lint
```

### Contribution

* The committed codes should pass all GitHub workflows.

### Platform

#### Android

Before running the app with Android Studio, build and sync the dependencies and web assets.

``` bash
ionic build
npx cap sync
```

If your operating system is Linux, set the `linuxAndroidStudioPath` in `capacitor.config.json`. For example,

``` json
{
  "linuxAndroidStudioPath": "/home/username/android-studio/bin/studio.sh"
}
```

Open the project in Android Studio.

``` bash
npx cap open android
```

### Architecture

See [the architecture of Starling Capture](https://github.com/numbersprotocol/starling-capture#architecture) for details.

### Serialization Schema

See [the serialization schema of Starling Capture](https://github.com/numbersprotocol/starling-capture#serialization-schema) for details.

### Caveat

* This app is still in the experimental stage.
* This app uses raw file system to save proofs, and thus the performance is not optimized.

### Release

Bump version in `package.json`.

``` json
{
  "version": "a.b.c"
}
```

Bump version in `android/app/build.gradle`.

``` gradle
android {
    defaultConfig {
        versionCode abc
        versionName "a.b.c"
    }
}
```

When push to the `master` branch with new version in the `package.json` file, GitHub Action would automatically create new release.

### Deploy

#### Demo App

The demo app is hosted on the GitHub Page. It would be updated when there is a new commit on the `develop` branch.