# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## Unreleased

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
