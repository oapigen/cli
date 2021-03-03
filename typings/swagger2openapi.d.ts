declare module "swagger2openapi" {
  import { OpenAPIV3 } from "openapi-types";
  export function convertObj(
    swagger: object,
    options?: {
      fetchOptions?: Record<string, any>;
    },
  ): Promise<{
    openapi: OpenAPIV3.Document;
  }>;
}
