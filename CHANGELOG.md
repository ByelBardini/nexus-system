# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

Product status: **alpha** — internal / early use; breaking changes are possible while on `0.x`.

## [Unreleased]

## [0.1.0] - 2026-04-20

### Added

- Unified product versioning for the API and SPA (single `version` at repo root; `server` and `client` mirror via `scripts/sync-package-versions.mjs`).
- Automated releases with [release-it](https://github.com/release-it/release-it): bump, changelog update, Git commit, annotated tag `v*`, and push.

[Unreleased]: https://github.com/ByelBardini/nexus-system/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/ByelBardini/nexus-system/releases/tag/v0.1.0
