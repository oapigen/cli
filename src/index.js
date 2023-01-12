const { loadApiJson } = require("./common/load-api-json");
const { templateRequestCode: _templateRequestCode } = require("./common/templates/request-code");
const { templateRequestTypes: _templateRequestTypes } = require("./common/templates/request-types");
const { templateTypesBefore: _templateTypesBefore } = require("./common/templates/types-before");
const { compilePresets } = require("./lib/presets");
const { swaggerV2ToJs } = require("./v2");
const { swaggerV3ToJs } = require("./v3");

async function openapiGenerate(_config = {}) {
  const config = buildConfig(compilePresets(_config));

  validateConfig(config);

  const apiJson = await loadApiJson(config);
  const version = detectVersion(apiJson);

  const { code, types } = await runCompilation(version, apiJson, config);

  return { code, types, swaggerData: apiJson };
}

function buildConfig(config = {}) {
  const {
    file = "",
    apiJson = "",
    authorization,

    mode = "prod",
    deprecated = "warning",
    originalBody = false,
    ignoreDescription = false,

    templateCodeBefore,
    templateRequestCode = _templateRequestCode,
    templateCodeAfter,

    templateTypesBefore = _templateTypesBefore,
    templateRequestTypes = _templateRequestTypes,
    templateTypesAfter,
  } = config;

  return {
    file,
    apiJson,
    authorization,

    deprecated,
    mode,
    originalBody,
    ignoreDescription,

    templateCodeBefore,
    templateRequestCode,
    templateCodeAfter,
    templateTypesBefore,
    templateRequestTypes,
    templateTypesAfter,
  };
}

function validateConfig(config) {
  const isExistFile = Boolean(config.file);
  const isExistApiJson = Boolean(config.apiJson);

  if (isExistFile === false && isExistApiJson === false) {
    throw new Error("Please, fill `file` or `apiJson` option in the config.");
  }
}

function detectVersion(apiJson) {
  if (apiJson.openapi) return 3;
  if (apiJson.swagger) return 2;
  return null;
}

async function runCompilation(version, apiJson, config) {
  switch (version) {
    case 3: {
      return await swaggerV3ToJs(apiJson, config);
    }

    case 2: {
      console.info(
        "[deprecated] OpenAPI/Swagger v2 is deprecated and support will be removed. Please, convert v2 into v3 before generating code.",
      );
      return await swaggerV2ToJs(apiJson, config);
    }
  }

  throw new Error("Unable to determine the version of OpenAPI/Swagger");
}

module.exports = { openapiGenerate };
