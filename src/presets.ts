import path from "path";
import { OpenAPIV3 } from "openapi-types";
import * as changeCase from "change-case";
import createDebug from "debug";

import { PresetConfig } from "./config";

const debug = createDebug("openapi:presets");

export interface FilesApi {
  addFile(name: string, content: string, options?: { overwrite?: boolean }): void;
}

export interface Internal {
  changeCase: typeof changeCase;
  root(): OpenAPIV3.Document;
  resolveRef(ref: string): unknown | null;
  isRef(object: unknown): object is OpenAPIV3.ReferenceObject;
}

export type PresetConstructor<T extends object> = (options: T, internal: Internal) => Preset;

export type Method = "get" | "put" | "post" | "delete" | "options" | "head" | "patch" | "trace";

export interface PresetCore {
  name: string;
  build(filesApi: FilesApi): void;
  onCallback: (name: string, callback: OpenAPIV3.CallbackObject) => void;
  onHeader: (name: string, header: OpenAPIV3.HeaderObject) => void;
  onLink: (name: string, link: OpenAPIV3.LinkObject) => void;
  onOperation: (
    pattern: string,
    method: Method,
    operation: OpenAPIV3.OperationObject,
    path: OpenAPIV3.PathItemObject,
  ) => void;
  onParameter: (name: string, parameter: OpenAPIV3.ParameterObject) => void;
  onRequestBody: (name: string, requestBody: OpenAPIV3.RequestBodyObject) => void;
  onResponse: (name: string, response: OpenAPIV3.ResponseObject) => void;
  onSchema: (name: string, schema: OpenAPIV3.SchemaObject) => void;
  onSecurityScheme: (name: string, securityScheme: OpenAPIV3.SecuritySchemeObject) => void;
  postComponents: () => void;
  postOperations: () => void;
  preComponents: () => void;
  preOperations: () => void;
}

const defaultPreset: PresetCore = {
  name: "(default)",
  build() {},
  onCallback() {},
  onHeader() {},
  onLink() {},
  onOperation() {},
  onParameter() {},
  onRequestBody() {},
  onResponse() {},
  onSchema() {},
  onSecurityScheme() {},
  postComponents() {},
  postOperations() {},
  preComponents() {},
  preOperations() {},
};

export type Preset = Partial<PresetCore>;

interface PresetIteratorOptions {
  resolveLocalPresetsDir: string;
}

export function createPresetIterator(
  list: PresetConfig[],
  internal: unknown,
  options: PresetIteratorOptions,
) {
  const presets: PresetCore[] = [];

  list.forEach((presetConfigName) => {
    const [name, readPreset] = loadPreset(presetConfigName, internal, options);
    presets.push({ ...defaultPreset, name, ...readPreset });
  });

  return {
    forEach(fn: (preset: PresetCore) => void) {
      presets.forEach((preset) => fn(preset));
    },
    traverse<T>(
      schemas: Record<string, T> | undefined,
      fn: (
        preset: PresetCore,
      ) => (name: string, item: Exclude<T, OpenAPIV3.ReferenceObject | undefined>) => void,
    ) {
      forEach(schemas, (name, schema) => {
        presets.forEach((preset) => fn(preset)(name, schema));
      });
    },
  };
}

export function forEach<T>(
  map: Record<string, T> | undefined,
  fn: (name: string, value: Exclude<T, OpenAPIV3.ReferenceObject | undefined>) => void,
) {
  for (const name in map) {
    const value: OpenAPIV3.ReferenceObject | T | undefined = map[name];
    if (noRef(value) && value) fn(name, value as any);
  }
}

export function noRef<T>(value: OpenAPIV3.ReferenceObject | T): value is Exclude<T, undefined> {
  return typeof value && !(value as any)["$ref"];
}

function loadPreset(
  presetConfig: PresetConfig,
  internal: unknown,
  iteratorOptions: PresetIteratorOptions,
): [string, Preset] {
  if (Array.isArray(presetConfig)) {
    const [name, options] = presetConfig;
    if (typeof name !== "string") {
      throw new TypeError(
        `A name of the preset should be a string. "${name === null ? "null" : typeof name}" passed`,
      );
    }

    const imported = require(resolvePath(name, iteratorOptions.resolveLocalPresetsDir));

    // Here we know that user passed options to preset
    if (typeof imported !== "function") {
      throw new TypeError(
        `Preset "${name}" must be used without options. Please, remove options or check that you use correct preset`,
      );
    }
    const preset = imported(options || {}, internal);
    assertPreset(preset, name);

    return [name, preset];
  }

  const imported = require(resolvePath(presetConfig, iteratorOptions.resolveLocalPresetsDir));
  // Package exports preset constructor
  if (typeof imported === "function") {
    const preset = imported({}, internal);
    assertPreset(preset, presetConfig);
    return [presetConfig, preset];
  }
  // Here package exports preset object
  assertPreset(imported, presetConfig);
  return [presetConfig, imported];
}

function resolvePath(name: string, resolveAt: string): string {
  if (name[0] === ".") {
    return path.resolve(resolveAt, name);
  }
  return name;
}

function assertPreset(preset: any, name: string): void {
  if (typeof preset !== "object") {
    throw new TypeError(
      `Preset "${name}" must return an object from default exported function. Please, check that you use correct preset name.`,
    );
  }
}
