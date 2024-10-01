# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.1] - 2024-10-01

### Added

- TypeScript support: Added `index.d.ts` file with type declarations for the package.
- Updated build process to include TypeScript declarations in the distribution.

### Changed

- Updated `package.json` to include the `types` field pointing to the TypeScript declarations.
- Modified `rollup.config.js` to copy TypeScript declarations to the `dist` folder during build.

### Fixed

- Modified `rollup.config.js` to copy the drillx directory to the `dist` folder during build.

## [1.0.0] - 2024-10-01

### Added

- Initial release of Cash Captcha npm package
- Core functionality for background captcha service utilizing proof of work on Solana
- Solver class for handling captcha challenges
- Rewards class for managing and claiming rewards
- Register class for user registration
- Device performance categorization function
- Configuration creation function
- WebAssembly integration for efficient computations
- Comprehensive README with usage instructions and features
- MIT License

### Changed

- N/A (Initial release)

### Deprecated

- N/A (Initial release)

### Removed

- N/A (Initial release)

### Fixed

- N/A (Initial release)

### Security

- Implemented secure communication with the Cash Captcha API
- Ensured user privacy by avoiding collection of personal data

## [Unreleased]

- Enhanced performance optimizations
- Additional integration options for various frameworks
- Expanded documentation and usage examples
