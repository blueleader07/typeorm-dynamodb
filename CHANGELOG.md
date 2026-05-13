# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Fixed

- `findAll({ limit })` now continues across DynamoDB pages until the requested number of items has been collected instead of treating `limit` as only the first request size.
- Added a unit test covering multi-page `findAll({ limit })` behavior to verify the method stops paging once the requested item count is reached.
- Fixed filter placeholder collisions in `FindOptions` when the same field appears multiple times in a `filter` expression (for example `field = 'a' OR field = 'b'`), by generating unique expression attribute value aliases per occurrence.
- Updated filter parsing for `contains(...)` and standard comparison filters so `toFilterExpression()` and `toExpressionAttributeValues()` stay aligned on the same generated placeholder names.
- Added regression tests for duplicate-field filter aliases and kept real DynamoDB integration validation in `crud-repository` tests behind the `FLOCI_INTEGRATION=true` flag.

### Changed

- **Upgraded CI to Node 24**: Updated publish workflow to use Node 24 (which bundles npm 11.5.1+), required for npm Trusted Publishing (OIDC). CI matrix updated from `[18.x, 20.x, 22.x]` to `[20.x, 22.x, 24.x]`.
- **Removed manual npm upgrade step**: The `npm install -g npm@latest` step in the publish workflow was causing `MODULE_NOT_FOUND` errors on Node 22 runners; it is no longer needed with Node 24.
- **Simplified publish command**: Removed `--provenance` flag from `npm publish` — provenance attestations are now generated automatically by npm Trusted Publishing.

## [3.1.0] - 2025-12-28

### Changed

- **Upgraded to ESLint 9**: Migrated from ESLint 7 to ESLint 9.39.2 with modern flat config format (`eslint.config.mjs`)
- **Upgraded TypeScript ESLint**: Updated `@typescript-eslint/parser` and `@typescript-eslint/eslint-plugin` from 4.4.0 to 8.50.1
- **Removed eslint-config-standard**: Removed old `eslint-config-standard` and related plugins (incompatible with ESLint 9), now using `@eslint/js` and `typescript-eslint` directly

- **`deleteAll` now returns `DeleteResult`**: Updated to match TypeORM 0.3.28+ interface requirements. Returns a `DeleteResult` with the count of deleted rows instead of `void`.
  
  ```typescript
  // All existing code continues to work
  const result = await manager.deleteAll(User);
  console.log(`Deleted ${result.affected} rows`);
  
  const result2 = await manager.deleteAll(User, options, customKeyMapper);
  console.log(`Deleted ${result2.affected} filtered rows`);
  ```

- **`deleteAllBy` now returns `DeleteResult`**: Returns a `DeleteResult` with the count of deleted rows for consistency with TypeORM patterns.

- **`deleteQueryBatch` now returns deletion count**: Returns `Promise<number>` with the count of deleted items to support tracking in calling methods.

### Fixed

- Fixed TypeScript compilation errors with TypeORM 0.3.28+
- Fixed return type incompatibilities: changed `undefined` to `null` in `findOne` and `findOneBy` methods to match TypeORM's type signatures
- Added `sql()` method to `DynamoQueryRunner` to satisfy TypeORM's `QueryRunner` interface (throws `TypeORMError` as SQL is not supported by DynamoDB)

### Added

- `DynamoEntityManager.getRepository()` now returns `PagingAndSortingRepository<Entity>` which extends TypeORM's `Repository<Entity>` with additional DynamoDB-specific pagination and sorting capabilities
- `KeyMapper` type export for type-safe key mapping functions: `export type KeyMapper = (entity: ObjectLiteral) => ObjectLiteral`

## [3.0.54] - Previous Release

- See git history for changes prior to changelog adoption

