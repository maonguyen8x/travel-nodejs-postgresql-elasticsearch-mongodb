import {SecuritySchemeObject, ReferenceObject} from '@loopback/openapi-v3';

export const OPERATION_SECURITY_SPEC = [{jwt: []}];
export type SecuritySchemeObjects = {
  [securityScheme: string]: SecuritySchemeObject | ReferenceObject;
};
export const SECURITY_SCHEME_SPEC: SecuritySchemeObjects = {
  jwt: {
    type: 'apiKey',
    name: 'authorization',
    in: 'header',
  },
};
