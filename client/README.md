# Liveblog Client
Liveblog Client is a javascript client for Liveblog REST API server.

## Setup

Requires Node.js 22+ (managed via [Volta](https://volta.sh/), see `package.json` for pinned version).

```
npm install
```

### Development

Start a local dev server on port `9000` with live reload:
```
npm start
```

### Production build

```
npm run build
```

Output goes to `dist/`.

### Linting

```
npm run lint
```

### Running with Docker

> **Note:** Docker commands need to be updated for the current build setup.

```
docker build -t liveblog-client:devel ./
docker run -i -p 9000:9000 -t liveblog-client:devel
```

## Info for contributors

### Commit messages

Every commit has to have a meaningful commit message in form:

```
Title
[<empty line>
Description]
[<empty line>
JIRA ref]
```

Where [JIRA ref](https://confluence.atlassian.com/display/FISHEYE/Using+smart+commits) is at least Issue code eg. ```LBSD-13```.

For trivial changes you can ommit JIRA ref or Description or both: ```Fix typo in liveblog.translate docs.```

### CI

CI runs via GitHub Actions on push and pull requests. The pipeline runs linting, builds the client, and executes Playwright e2e tests. See `.github/workflows/continuous-integration.yml`.
