# typeorm-dynamodb - Copilot Instructions

## Project Overview
This is an **NPM package** that adds DynamoDB support to TypeORM. It wraps TypeORM to enable DynamoDB as a database driver, supporting TypeORM version 0.3+.

**Key Technologies:**
- TypeScript 4.7.4
- Jest for testing (with ts-jest)
- ESLint for linting
- DynamoDB as the database target
- TypeORM 0.3+ compatibility

## Build & Development Commands

### Prerequisites
- Node.js: 18.x, 20.x, or 22.x (CI tests all three)
- npm: 10.x+

### Installation
```bash
npm install
```

### Development Commands

**Lint:**
```bash
npm run lint
# Runs ESLint with auto-fix on src/**/*.ts
```

**Test:**
```bash
npm test
# Runs Jest with coverage
```

**Build:**
```bash
npm run tsc
# Compiles TypeScript to /dist
```

**Full Build (lint + test + compile):**
```bash
npm run build
# Runs: clean → lint → test → tsc
```

**Clean:**
```bash
npm run clean
# Removes /dist directory
```

## Project Structure

**Source Code (`/src`):**
- `index.ts` - Main entry point (exports public API)
- `driver/dynamo/` - DynamoDB driver implementation
  - `DynamoDriver.ts` - Core driver
  - `DynamoQueryRunner.ts` - Query execution
  - `DynamoSchemaBuilder.ts` - Schema management
  - `decorators/` - Custom decorators for DynamoDB
  - `entity-manager/` - Entity management
  - `helpers/` - Utility functions
  - `managers/` - Data source and repository managers
- `typeorm/` - TypeORM integration layer

**Tests (`/test`):**
- `entities/` - Test entity definitions
- `helpers/` - Helper function tests
- `managers/` - Manager tests
- `mocks/` - Mock objects for testing
- `parsers/` - Annotation parser tests
- `repositories/` - Repository tests

**Build Output (`/dist`):**
- Compiled JavaScript and TypeScript declarations
- Published to NPM (only /dist is included via `files` in package.json)

## NPM Publishing

### Manual Publishing via GitHub Actions

**To publish a new version:**
1. Go to [Actions → Publish to NPM](https://github.com/blueleader07/typeorm-dynamodb/actions/workflows/publish-npm.yml)
2. Click "Run workflow"
3. Select version bump type: `patch`, `minor`, or `major`
4. Choose NPM tag (usually `latest`)
5. Click "Run workflow"

**The workflow will:**
- Run all tests
- Bump version in package.json
- Build the package
- Publish to NPM with provenance (trusted publishing)
- Create git tag and GitHub release
- Push changes back to main branch

**Required Secret:**
- `NPM_TOKEN` - NPM authentication token (set in GitHub repo secrets)
  - **Recommended:** Use NPM Trusted Publishing (OIDC) instead of long-lived tokens
  - Workflow includes `--provenance` flag for supply chain security

### Semantic Versioning
- **Patch** (3.0.54 → 3.0.55): Bug fixes, no breaking changes
- **Minor** (3.0.54 → 3.1.0): New features, backward compatible
- **Major** (3.0.54 → 4.0.0): Breaking changes

Current version: **3.0.54**

## CI/CD Workflows

### CI Workflow
**Triggers:** Push to main/develop, pull requests, manual
**Tests:** Node.js 18.x, 20.x, 22.x
**Steps:** Install → Lint → Test → Build

### Dependabot Auto-Merge
**Schedule:** Weekly (Saturdays at 9am)
**Auto-merges:** Patch and minor dependency updates
**Requires:** "automerge" label on PR

### NPM Publishing
**Trigger:** Manual via GitHub Actions UI
**Outputs:** NPM package, git tag, GitHub release

## Development Best Practices

1. **Testing:** All new features must have tests (Jest + ts-jest)
2. **Linting:** Code must pass ESLint (runs with --fix)
3. **Type Safety:** Strict TypeScript compilation required
4. **Coverage:** Maintain test coverage (tracked by Jest)
5. **Versioning:** Use semantic versioning for releases
6. **Documentation:** Update README.md for API changes

## Key Source Files

**Entry Point:**
- `src/index.ts` - Main exports for the package

**Core Driver:**
- `src/driver/dynamo/DynamoDriver.ts` - DynamoDB driver implementation
- `src/driver/dynamo/DynamoQueryRunner.ts` - Query execution logic

**Managers:**
- `src/driver/dynamo/managers/datasource-manager.ts` - DataSource initialization

**Decorators:**
- `src/driver/dynamo/decorators/` - DynamoDB-specific decorators

## Common Issues & Solutions

### Build Failures
**Issue:** TypeScript compilation errors
**Solution:** Check `tsconfig.json` settings, ensure all types are correct

### Test Failures
**Issue:** Jest tests failing
**Solution:** Run `npm test` locally, check mocks in `/test/mocks`

### Publishing Issues
**Issue:** NPM publish fails
**Solution:** Ensure `NPM_TOKEN` secret is set, version is bumped correctly

## Package Information

- **NPM Package:** [typeorm-dynamodb](https://www.npmjs.com/package/typeorm-dynamodb)
- **GitHub Repo:** https://github.com/blueleader07/typeorm-dynamodb
- **License:** ISC
- **Main Export:** `./dist/index.js`
- **TypeScript Declarations:** `./dist/index.d.ts`

## Trust These Instructions

These instructions have been validated against the actual project structure, package.json scripts, and existing codebase. Only search for additional information if:
- A command fails unexpectedly
- You need to understand DynamoDB-specific implementation details
- The package.json scripts have changed
- New features are being added that require different workflows

When in doubt, run `npm test` and `npm run build` to validate changes before committing.
