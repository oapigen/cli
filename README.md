# oapigen/cli

Generate JavaScript or TypeScript code from Swagger/OpenAPI specification.

## Install

```sh
npm install -D @oapigen/cli
# or
pnpm add -D @oapigen/cli
# or
yarn add -D @oapigen/cli
```

## Examples

```sh
pnpm oapi --file ../src/mocks/local-file-api.json
# or
pnpm oapi --file ../src/mocks/local-file-api.yaml
# or
pnpm oapi --file protocol://url/api.json
```

## Usage CLI

```sh
pnpm oapi [options]

Options:
  -V, --version            output the version number
  --output-dir <path>      Path output directory js api with types (default: './api')
  --config <path>          Path to config
  --mode <type>            Mode for additional info: 'prod' | 'dev' (default: 'prod')
  --file <path>            Path to file with api (*.json, *.yaml, url)
  --authorization <value>  Auth token for get api by url (it is header for request)
  --deprecated <type>      Action for deprecated methods: 'warning' | 'ignore' | 'exception' (default: 'warning')
  --import-request         Import request code in out code
  --original-body          Build with original request body
  --ignore-description     Print description of request
  -h, --help               display help for command
```

## Usage config in file

This package use [`cosmiconfig`](https://github.com/davidtheclark/cosmiconfig) for finding config.

### Config can exist next places

> TODO: config file may be renamed in the next major version

- a `openapi` property in `package.json`
- a `.openapirc` file in JSON or YAML format
- a `.openapirc.json` file
- a `.openapirc.yaml`, `.openapirc.yml`, or `.openapirc.js` file
- a `openapi.config.js` file exporting a JS object

```js
module.exports = {
  // Path to file with api (*.json, *.yaml, url)
  file: "./swagger-api.json", // string

  // Api in json (if not use option 'file', more important than path to file)
  apiJson: { ... },

  // Auth token for get api by url (it is header for request)
  authorization: "Token 123qwerty", // string

  // Path output directory js api with types
  outputDir: "./api", // string (default: "./api")

  // Mode for additional info
  mode: "prod", // "prod" | "dev" (default: "prod")

  // Action for deprecated methods
  deprecated: "warning", // "warning" | "ignore" | "exception" (default: "warning")

  // Import request code in out code
  // true — add import from `@oapigen/cli/request`
  // false — embed request to `outputDir` and import from it
  // "disabled" — completely disable imporing `request`, use `templateCodeBefore`
  importRequest: true, // (default: false)

  // Build with original request body
  originalBody: true, // (default: false)

  // Ignore description of requests
  ignoreDescription: true, // default: false

  // Completely disable generating types file (.d.ts)
  disableTypesGenerate: true, // (default: false)

  /**
   * Change file name for source code
   * Also it can be a function
   * @example
   * templateFileNameCode: ({ swaggerData, changeCase }) => string,
   */
  templateFileNameCode: 'my-api.js', // (default: 'index.js')

  /**
   * Change file name for typing
   * Also it can be a function
   * @example
   * templateFileNameTypes: ({ swaggerData, changeCase }) => string,
   */
  templateFileNameTypes: 'my-api.d.ts', // (default: 'index.d.js')

  /**
   * Load presets and merge local properties to it
   * If preset created as a function, options can be passed
   * @example
   * presets: [
   *  ['oapigen-preset-my-super', { passed: 'options' }],
   *  ['@oapigen/preset-another', { beautiful: 'options' }],
   * ]
   * If no options passed or used simple form, empty object passed to functional preset
   */
  presets: ['oapigen-preset-my-super'], // (default: [])

  /**
   * Template before main block code
   * @param {{
   *  swaggerData: { info: object; paths: object; components: object; };
   *  changeCase: { paramCase: Function; camelCase: Function; pascalCase: Function; ... };
   * }} extra
   */
  templateCodeBefore: (extra) => "",

  /**
   * Template request code
   * @param {{
   *  name: string;
   *  method: string;
   *  url: string;
   *  isWarningDeprecated: boolean;
   *  isExistParams: boolean;
   *  defaultParams: object;
   * }} params
   * @param {{
   *  swaggerData: { info: object; paths: object; components: object; };
   *  requestSwaggerData: { operationId: string; requestBody?: object; responses: object };
   *  changeCase: { paramCase: Function; camelCase: Function; pascalCase: Function; ... };
   * }} extra
   */
  templateRequestCode: (params, extra) => "",

  /**
   * Template after maon block code
   * @param {{
   *  swaggerData: { info: object; paths: object; components: object; };
   *  changeCase: { paramCase: Function; camelCase: Function; pascalCase: Function; ... };
   * }} extra
   */
  templateCodeAfter: (extra) => "",

  /**
   * Template before main block types
   * @param {{
   *  swaggerData: { info: object; paths: object; components: object; };
   *  changeCase: { paramCase: Function; camelCase: Function; pascalCase: Function; ... };
   * }} extra
   */
  templateTypesBefore: (extra) => "",

  /**
   * Template request types
   * @param {{
   *  name: string;
   *  summary: string;
   *  description: string;
   *  countVariants: number;
   *  index: number;
   *  params: SwaggerData | null;
   *  addedParams: SwaggerData | null;
   *  result: SwaggerData | null;
   * }} params
   * * @param {{
   *  swaggerData: { info: object; paths: object; components: object; };
   *  requestSwaggerData: { operationId: string; requestBody?: object; responses: object };
   *  changeCase: { paramCase: Function; camelCase: Function; pascalCase: Function; ... };
   * }} extra
   *
   * @type {https://swagger.io/docs/specification/data-models/} SwaggerData
   */
  templateRequestTypes: (param, extra) => "",

  /**
   * Template after main block types
   * @param {{
   *  swaggerData: { info: object; paths: object; components: object; };
   *  changeCase: { paramCase: Function; camelCase: Function; pascalCase: Function; ... };
   * }} extra
   */
  templateTypesAfter: (extra) => "",
};
```

## API

```js
import { openapiGenerate } from "@oapigen/cli";

const { code, types } = openapiGenerate({
  file: "./swagger-api.json",
});

console.log(code);
// => js code

console.log(types);
// => typescript types
```

[More examples](https://github.com/oapigen/cli/tree/next/examples)

## Additional notes

- If you will use this package after application created, you will have problem with generated api,
  because current api in your app will have different with your swagger api maybe.

## How to create custom preset

1. Create new NPM package (create directory and `npm init` there)
1. Name your package with `oapigen-preset-` prefix (ex.: `oapigen-preset-effector`)
1. Create `index.js` and set `"main": "index.js"` in your package.json
1. Fill your `index.js` with any properties from list before
1. Save and publish
1. Use it like: `presets: ['oapigen-preset-example']`

> Hint: if you want to use local file as a preset, just use `require.resolve`:
> `presets: [require.resolve('./local-preset')]`
> It is works only in `.js` configs

### Preset with options

1. Export from your javascript file function with single argument
1. Add valid options to your README.md
1. Use nested array form to pass options to preset

#### Example preset with options

```js
module.exports = (options) => ({
  templateRequestCode: (request, extra) =>
    options.parseBody ? generatorWithParser(request, extra) : simpleGenerator(request, extra),
});
```

Usage `openapi.config.js`:

```js
module.exports = {
  file: "./swagger-api.json",
  presets: [
    ["oapigen-preset-example", { parseBody: true }],
    ["@oapigen/preset-another", { requestImport: { module: "./axios-fabric", name: "axios" } }],
  ],
};
```

## Tested generation on swagger versions

- 2.0
- 3.0.1
- 3.0.2

## Roadmap

- [ ] Struct generated files by tags
- [ ] Detect `nullable`
- [ ] Validate by schema
- [ ] Combine types by

## Development

### How to release a new version

1. Wait for release-drafter to generates a new draft release
1. All PRs should have correct labels and useful titles. You can [review available labels here](https://github.com/oapigen/cli/blob/master/.github/release-drafter.yml).
1. Update labels for PRs and titles, next [manually run the release drafter action](https://github.com/oapigen/cli/actions/workflows/release-drafter.yml) to regenerate the draft release.
1. Review the new version and press "Publish"
1. If required check "Create discussion for this release"
