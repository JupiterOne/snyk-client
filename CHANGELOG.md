# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.1.2] - 2021-08-23

### Fixed 

- Retry all `5xx` errors.

## [1.1.1] - 2021-08-18

### Fixed

- Change unsuppored optional chaining from `options?.retries` to `(options && options.retries)`

## [1.1.0] - 2021-08-17

### Added

- Added the `List All Aggregated Issues` endpoint, and deprecated the `List Issues` endpoint.

### Fixed

- Retry all `5xx` errors including `503`, not just `500` and `502`.
