#!/usr/bin/env node

const { program } = require("commander");
const { openapiGenerate } = require("../index");
const path = require("path");
const { existsSync, writeFileSync, readFileSync } = require("fs");
const { execSync } = require("child_process");
const { version, name } = require("../../package.json");
const { cosmiconfigSync } = require("cosmiconfig");
const { compilePresets } = require("../lib/presets");
const changeCase = require("change-case");

const timeLog = `✨ ${name}`;
const defaultOutputDir = "./api";

program
  .version(version)

  // Cli options
  .option(
    "--output-dir <path>",
    `Path output directory js api with types (default: '${defaultOutputDir}')`,
  )
  .option("--config <path>", "Path to config")

  // Common options
  .option("--mode <type>", "Mode for additional info: 'prod' | 'dev' (default: 'prod')")

  // Api options
  .option("--file <path>", "Path to file with api (*.json, *.yaml, url)")
  .option("--authorization <value>", "Auth token for get api by url (it is header for request)")
  .option(
    "--deprecated <type>",
    "Action for deprecated methods: 'warning' | 'ignore' | 'exception' (default: 'warning')",
  )
  .option("--import-request", "Import request code in out code")
  .option("--import-request-disabled", "Disable importing or generating request")
  .option("--disable-types-generate", "Disable generating .d.ts file")
  .option("--original-body", "Build with original request body")
  .option("--ignore-description", "Ignore description of requests")
  .option("--template-file-name-code <name>", "Set name for file with code")
  .option("--template-file-name-types <name>", "Set name for file with types")
  .option("--presets <presets...>", "Load options from presets. Options merged from right to left");

program.parse(process.argv);

const configExplorer = cosmiconfigSync("openapi");
const foundConfig = program.config
  ? configExplorer.load(program.config)
  : configExplorer.search() || {};
const resolvedConfig = foundConfig.config || {};

const config = {
  file: program.file || resolvedConfig.file,
  outputDir: program.outputDir || resolvedConfig.outputDir || defaultOutputDir,
  authorization: program.authorization || resolvedConfig.authorization,

  mode: program.mode || resolvedConfig.mode,
  deprecated: program.deprecated || resolvedConfig.deprecated,
  importRequest: program.importRequestDisabled
    ? "disabled"
    : program.importRequest || resolvedConfig.importRequest,
  originalBody: program.originalBody || resolvedConfig.originalBody,
  disableTypesGenerate: program.disableTypesGenerate || resolvedConfig.disableTypesGenerate,
  presets: program.presets || resolvedConfig.presets || [],

  templateFileNameCode: program.templateFileNameCode || resolvedConfig.templateFileNameCode,
  templateFileNameTypes: program.templateFileNameTypes || resolvedConfig.templateFileNameTypes,

  templateCodeBefore: resolvedConfig.templateCodeBefore,
  templateRequestCode: resolvedConfig.templateRequestCode,
  templateCodeAfter: resolvedConfig.templateCodeAfter,

  templateTypesBefore: resolvedConfig.templateTypesBefore,
  templateRequestTypes: resolvedConfig.templateRequestTypes,
  templateTypesAfter: resolvedConfig.templateTypesAfter,
};

async function main(config) {
  if (config.mode === "dev") {
    const pathConfig = program.config || foundConfig.filepath;

    if (pathConfig) {
      console.log("configPath:", pathConfig);
    }

    console.log("config:", config);
  }

  console.time(timeLog);

  // Convert to js
  const compiledConfig = compilePresets(resolveLocalPresets(omitUndefined(config)));
  const apiResult = await openapiGenerate(compiledConfig);
  console.log(">>", apiResult);
  const { all: outputFiles, source: sourceFilesNames } = buildFiles(apiResult, compiledConfig);

  // Check and create output dir
  const pathOutputDir = path.resolve(process.cwd(), compiledConfig.outputDir);

  if (existsSync(pathOutputDir) === false) {
    execSync(`mkdir -p ${pathOutputDir}`);
  }

  // Write files
  writeFilesSync(outputFiles, sourceFilesNames, pathOutputDir);

  console.timeEnd(timeLog);
}

function buildFiles({ code, types, swaggerData }, config = {}) {
  const { importRequest = false } = config;
  const files = {};
  const parameter = { swaggerData, changeCase };
  const nameTypes = compileFileName(config.templateFileNameTypes, "index.d.ts", parameter);
  const nameCode = compileFileName(config.templateFileNameCode, "index.js", parameter);

  if (!config.disableTypesGenerate) {
    files[nameTypes] = { content: types };
  }

  if (importRequest === true) {
    files[nameCode] = {
      content: `import { request } from '@oapigen/cli/request';\n\n${code}`,
    };
  } else if (importRequest === false) {
    files[nameCode] = {
      content: `import { request } from './request';\n\n${code}`,
    };

    files["request.js"] = {
      content: readFile("../lib/request.js", (content) => {
        const contentLines = content.split("\n").slice(0, -2);

        contentLines[0] = "import { jsonToXml } from './json-to-xml';";
        contentLines[1] = "import { xmlToJson } from './xml-to-json';";

        contentLines[3] = `export ${contentLines[3]}`;

        return contentLines.join("\n");
      }),
      dependencies: {
        "xml-to-json.js": {
          content: readFile("../lib/xml-to-json.js", exportOneFunction),
        },
        "json-to-xml.js": {
          content: readFile("../lib/json-to-xml.js", exportOneFunction),
        },
      },
    };
  } else if (importRequest === "disabled") {
    files[nameCode] = {
      content: code,
    };
  } else {
    throw new TypeError(
      `Passed ${importRequest} to "importRequest", while allowed true, false or "disabled" `,
    );
  }

  return { all: files, source: [nameCode, nameTypes] };
}

function resolveLocalPresets(config) {
  if (Array.isArray(config.presets)) {
    config.presets = config.presets.map((preset) => {
      if (preset[0] === ".") {
        return path.resolve(process.cwd(), preset);
      }
      return preset;
    });
  }
  return config;
}

function compileFileName(option, initial, parameter) {
  if (typeof option === "function") {
    return option(parameter);
  }
  return option || initial;
}

function readFile(value, callback = (content) => content) {
  const pathFile = path.resolve(path.dirname(__filename), value);

  return callback(readFileSync(pathFile).toString());
}

function exportOneFunction(content) {
  const contentLines = content.split("\n").slice(0, -2);

  contentLines[0] = `export ${contentLines[0]}`;

  return contentLines.join("\n");
}

function writeFilesSync(files, changeAlways = ["index.d.ts", "index.js"], outputDir = "") {
  Object.keys(files).forEach((fileName) => {
    const filePath = path.resolve(outputDir, fileName);

    if (existsSync(filePath) === false || changeAlways.includes(fileName)) {
      const fileConfig = files[fileName];

      writeFileSync(filePath, fileConfig.content);

      if (fileConfig.dependencies) {
        writeFilesSync(fileConfig.dependencies, changeAlways, outputDir);
      }
    }
  });
}

function omitUndefined(object) {
  const result = {};
  for (const key in object) {
    if (typeof object[key] !== "undefined") {
      result[key] = object[key];
    }
  }
  return result;
}

main(config);
