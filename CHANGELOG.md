# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.9] - 2024-12-29

### Added

- Optional configuration parameter to specify the amount of nonces requested by the worker.

## [1.0.8] - 2024-10-15

### Added

- Webpack configuration instructions in README for browser environments.
- Conditional imports for Node.js-specific modules to improve cross-environment compatibility.

### Changed

- Updated `devices.js` to work in both Node.js and browser environments.
- Modified `api.js` and `solver.js` to handle environment-specific code more effectively.

### Fixed

- Resolved issues with browser functionality caused by Node.js-specific module imports.
- Addressed "Can't resolve 'os'" and similar errors in browser builds.

### Improved

- Enhanced cross-platform compatibility, allowing the package to work seamlessly in both Node.js and browser environments.
- Refined error handling and logging for better debugging across different environments.

## [1.0.7] - 2024-10-15

### Added

- Implemented global configuration system.
- Added logLevels support and corresponding print functions.

### Changed

- Modified `solver.js` to set the global configuration at initialization and when creating new Solver instances.
- Improved error handling and logging.

### Fixed

- Node.js support issues resolved.
- Removed unutilized functions and imports.

## [1.0.6] - 2024-10-15

### Changed

- Modified solver.js and worker.js to support Node.js environments with worker threads.

## [1.0.5] - 2024-10-15

### Changed

- Modified api.js to support Node.js environments.

## [1.0.4] - 2024-10-15

### Changed

- Modified device performance profiling to support Node.js environments.

## [1.0.3] - 2024-10-15

### Added

- Added "type": "module" to package.json to explicitly declare the package as an ES module.

### Changed

- Updated all import statements in src files to include .js file extensions for better compatibility with ES modules in Node.js environments.

## [1.0.2] - 2024-10-01

### Changed

- Removed bundling process: The package is now distributed with its original file structure.
- Updated package structure: Users now work directly with the src files.
- Simplified build process: Removed Rollup and related dependencies.
- Updated package.json: Changed "files" field to include "src" instead of "dist".

### Removed

- Rollup configuration and build step.
- Dist folder: The package no longer includes a dist folder with bundled files.

### Fixed

- Resolved issues related to WebAssembly and Web Worker loading in bundled environments.

## [1.0.1] - 2024-10-01

### Added

- TypeScript support: Added `index.d.ts` file with type declarations for the package.
- Updated build process to include TypeScript declarations in the distribution.

### Changed

- Updated `package.json` to include the `types` field pointing to the TypeScript declarations.
- Modified `rollup.config.js` to copy TypeScript declarations to the `dist` folder during build.

### Fixed

- Attempted to resolve WebAssembly loading issues in bundled package (superseded by changes in 1.0.2).

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
