const { execSync } = require("child_process");
const { version, name } = require("../package.json");
const fileName = name.replace("@", "").replace("/", "-");

afterEach(() => {
  execSync(`rm -rf ${fileName}-${version}.tgz ${fileName}-v${version}.tgz TEST_PACK`);
});

describe("npm pack", () => {
  it("should pack all required files", () => {
    execSync("npm pack");
    execSync("mkdir -pv TEST_PACK");
    execSync(`tar -xvzf ${fileName}-${version}.tgz -C TEST_PACK`);
    const list = execSync("find ./TEST_PACK/package/ -type file")
      .toString()
      .trim()
      .split("\n")
      .map((path) => path.replace("./TEST_PACK/package/", "/"))
      .sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));

    expect(list).toMatchInlineSnapshot(`
      Array [
        "/README.md",
        "/package.json",
        "/request.js",
        "/src/cli/index.js",
        "/src/common/build-base.js",
        "/src/common/build-object-by-mode.js",
        "/src/common/build-object-by-refs.js",
        "/src/common/build-path-name.js",
        "/src/common/build-paths.js",
        "/src/common/get-mode.js",
        "/src/common/is-path-exception.js",
        "/src/common/load-api-json.js",
        "/src/common/path-default-params.js",
        "/src/common/path-parameters-by-in.js",
        "/src/common/templates/request-code.js",
        "/src/common/templates/request-types.js",
        "/src/common/templates/swagger-type.js",
        "/src/common/templates/types-before.js",
        "/src/index.d.ts",
        "/src/index.js",
        "/src/lib/async-for-each.js",
        "/src/lib/async-map.js",
        "/src/lib/async-rebuild-object.js",
        "/src/lib/async-reduce.js",
        "/src/lib/capitalize.js",
        "/src/lib/content-to-json.js",
        "/src/lib/get-ref.js",
        "/src/lib/is-object.js",
        "/src/lib/join-strings.js",
        "/src/lib/json-to-xml.js",
        "/src/lib/presets/index.js",
        "/src/lib/presets/presets.test.js",
        "/src/lib/print-object.js",
        "/src/lib/rebuild-object.js",
        "/src/lib/request.js",
        "/src/lib/xml-to-json.js",
        "/src/v2/index.js",
        "/src/v3/index.js",
      ]
    `);
  });
});

describe("pnpm pack", () => {
  it("should pack all required files", () => {
    execSync("pnpm pack");
    execSync("mkdir -pv TEST_PACK");
    execSync(`tar -xvzf ${fileName}-${version}.tgz -C TEST_PACK`);
    const list = execSync("find ./TEST_PACK/package/ -type file")
      .toString()
      .trim()
      .split("\n")
      .map((path) => path.replace("./TEST_PACK/package/", "/"))
      .sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));

    expect(list).toMatchInlineSnapshot(`
      Array [
        "/README.md",
        "/package.json",
        "/request.js",
        "/src/cli/index.js",
        "/src/common/build-base.js",
        "/src/common/build-object-by-mode.js",
        "/src/common/build-object-by-refs.js",
        "/src/common/build-path-name.js",
        "/src/common/build-paths.js",
        "/src/common/get-mode.js",
        "/src/common/is-path-exception.js",
        "/src/common/load-api-json.js",
        "/src/common/path-default-params.js",
        "/src/common/path-parameters-by-in.js",
        "/src/common/templates/request-code.js",
        "/src/common/templates/request-types.js",
        "/src/common/templates/swagger-type.js",
        "/src/common/templates/types-before.js",
        "/src/index.d.ts",
        "/src/index.js",
        "/src/lib/async-for-each.js",
        "/src/lib/async-map.js",
        "/src/lib/async-rebuild-object.js",
        "/src/lib/async-reduce.js",
        "/src/lib/capitalize.js",
        "/src/lib/content-to-json.js",
        "/src/lib/get-ref.js",
        "/src/lib/is-object.js",
        "/src/lib/join-strings.js",
        "/src/lib/json-to-xml.js",
        "/src/lib/presets/index.js",
        "/src/lib/presets/mocks/demo-preset/another.js",
        "/src/lib/presets/mocks/demo-preset/index.js",
        "/src/lib/presets/mocks/demo-preset/package.json",
        "/src/lib/presets/mocks/demo2-preset/index.js",
        "/src/lib/presets/mocks/demo2-preset/local.js",
        "/src/lib/presets/mocks/demo2-preset/package.json",
        "/src/lib/presets/mocks/demo3-preset/index.js",
        "/src/lib/presets/mocks/demo3-preset/package.json",
        "/src/lib/presets/mocks/demo3-preset/unused.js",
        "/src/lib/presets/mocks/demo3-preset/yarn.lock",
        "/src/lib/presets/mocks/preset-nested.js",
        "/src/lib/presets/mocks/preset-options-nested.js",
        "/src/lib/presets/mocks/preset-options.js",
        "/src/lib/presets/mocks/preset-second.js",
        "/src/lib/presets/mocks/preset-simple.js",
        "/src/lib/presets/presets.test.js",
        "/src/lib/print-object.js",
        "/src/lib/rebuild-object.js",
        "/src/lib/request.js",
        "/src/lib/xml-to-json.js",
        "/src/v2/index.js",
        "/src/v3/index.js",
      ]
    `);
  });
});

// oapigen-cli-v0.0.0-version-set-from-ci.tgz
// oapigen-cli-0.0.0-version-set-from-ci.tgz
