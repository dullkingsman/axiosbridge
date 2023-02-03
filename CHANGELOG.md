# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## Unreleased

## 1.1.0 - 2023-02-03
### Fixed
- Replaced `ts-results` with `rustic` as it was causing problems with commonjs modules

## 1.0.12 - 2023-02-03
### Fixed
- Removed `data` property accessor that tries to find `data` in `res.data`

## 1.0.11 - 2023-02-03
### Fixed
- Made axios intercept return when rejecting
- Added missing `status` code to axios error processor
- Turned `ts-results` imports to esm imports

## 1.0.10 - 2022-11-26
### Fixed
- Added request and pre-request error catches for axios

## 1.0.9 - 2022-11-16
### Fixed
- Added the `AxiosStatic` object as a `Bridge` static property to avoid potential faults because of imports.

## 1.0.8 - 2022-11-11
### Changed
- Changed the primary parameter for `Bridge` to AxiosConfig
- Updated usages in docs

## 1.0.7 - 2022-11-11
### Added
- Added `connection_timeout` as a `Bridge` property
- Generated documentation
- Updated default exported axios item access to check for the item on the default instance

## 1.0.7-beta.0 - 2022-11-10
### Fixed
- Reimplemented safe async executor to avoid pattern matching with fp-ts

## 1.0.6-beta.0 - 2022-11-10
### Fixed
- Updated promise converter to use try/catch statements

## 1.0.5 - 2022-11-10
### Added
- Exported the promise converter

## 1.0.5-beta.0 - 2022-11-10
### Changed
- Made axios instance a parameter for bridge constructor

## 1.0.4-beta.0 - 2022-11-09
### Fixed
- Placed response interceptors call on bridge instance

## 1.0.3-beta.0 - 2022-11-09
### Fixed
- Updated faulty default import

## 1.0.2 - 2022-11-09
### Fixed
- Changed faulty axios import that makes any call to it fail

## 1.0.1 - 2022-11-09
### Added
- Changelog
- Prettier
- Eslint
- Release workflow

### Changed
- Replaced the `ts-option` package with `fp-ts/Option` as ts-option had an older version of typescript and failed the build
