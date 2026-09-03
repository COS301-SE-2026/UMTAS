import type { OpenAPIObject } from '@nestjs/swagger';
import systemContractCatalog from './system-contract-catalog.json';

const HTTP_METHODS = [
  'get',
  'put',
  'post',
  'delete',
  'patch',
  'options',
  'head',
  'trace',
];
const WRITE_METHODS = ['post', 'put', 'patch'];
const INTERNAL_OPERATION_MARKER =
  'Internal worker operation; requires the UMTAS worker bearer token.';
const INTERNAL_OPERATION_MARKERS =
  /(?:\s*Internal worker operation; requires the UMTAS worker bearer token\.)+/g;

const CANONICAL_TAGS = new Map([
  ['App', 'Application and metadata endpoints'],
  ['Auth', 'Authentication and account lifecycle endpoints'],
  ['Auth Email', 'Email authentication and account recovery'],
  ['Auth Google', 'Google OAuth sign-in and account linking'],
  ['Auth Session', 'Session monitoring and management'],
  ['Auth Admin', 'Administrative user management'],
  ['Health', 'System health checks'],
  ['Modules', 'Academic module management'],
  ['Courses', 'Course management'],
  ['Universities', 'University and membership management'],
  ['Grouping', 'Module grouping management'],
  ['Events', 'Scheduling event management'],
  ['Timetables', 'Timetable management'],
  ['Builder', 'Personal timetable builder'],
  ['PDF Parser', 'PDF parser jobs and worker callbacks'],
  ['Solver', 'Timetable solver jobs and worker callbacks'],
  ['Attendance', 'Attendance management'],
  ['Venues', 'Venue management'],
  ['Buildings', 'Building management'],
  ['Map Config', 'Frontend map configuration'],
  ['Routes', 'Route management'],
  ['Academic Calendar', 'Academic calendar management'],
  ['ApiService', 'External university API adapter endpoints'],
]);

type ContractOperation = {
  tags?: string[];
  summary?: string;
  description?: string;
  security?: Record<string, string[]>[];
  responses?: Record<string, ContractResponse>;
  'x-internal'?: boolean;
};

type ContractResponse = {
  description?: string;
  $ref?: string;
};

type ContractTag = {
  name: string;
  description: string;
};

export function completeOpenApiContract(document: OpenAPIObject): void {
  const tags = new Map<string, ContractTag>();

  document.openapi = '3.0.3';
  document.info.description = systemContractCatalog.description;
  Object.assign(document, {
    'x-umtas-service-contracts': systemContractCatalog.boundaries,
  });

  for (const [route, pathItem] of Object.entries(document.paths ?? {})) {
    for (const [method, operation] of Object.entries(pathItem)) {
      if (!HTTP_METHODS.includes(method)) {
        continue;
      }

      completeOperationContract(
        operation as ContractOperation,
        method,
        route,
        tags,
      );
    }
  }

  document.tags = [...CANONICAL_TAGS].map(
    ([name, description]) => tags.get(name) ?? { name, description },
  );

  document.components ??= {};
  document.components.schemas ??= {};
  Object.assign(document.components.schemas, standardContractSchemas());
  applySystemContractRouteSchemas(document);
  document.components.responses = {
    ...(document.components.responses ?? {}),
    ...standardContractResponses(),
  };
}

function completeOperationContract(
  operation: ContractOperation,
  method: string,
  route: string,
  tags: Map<string, ContractTag>,
): void {
  operation.tags = normalizeTags(operation.tags);
  operation.summary ??= `${method.toUpperCase()} ${route}`;

  const primaryTag = operation.tags[0] ?? 'App';
  operation.description = normalizeDescription(
    operation.description,
    operation.summary,
    primaryTag,
  );

  collectTags(operation.tags, tags);

  const internal = isInternalOperation(route);
  const publicOperation = isPublicOperation(route);

  operation.security ??= getSecurity(internal, publicOperation);

  if (internal) {
    markInternal(operation);
  }

  completeResponseDescriptions(operation);
  addStandardResponses(operation, method, route, internal, publicOperation);
}

function normalizeTags(tags: string[] | undefined): string[] {
  return [
    ...new Set(
      (tags ?? ['App']).map((tag) =>
        tag === 'Auth admin' ? 'Auth Admin' : tag,
      ),
    ),
  ];
}

function normalizeDescription(
  description: string | undefined,
  summary: string,
  tag: string,
): string {
  const contractDescription = `${summary}. This ${tag} operation is part of the versioned UMTAS HTTP contract.`;

  if (
    description === undefined ||
    description.includes('This operation is part of the UMTAS HTTP contract.')
  ) {
    return contractDescription;
  }

  return description;
}

function collectTags(
  operationTags: string[],
  tags: Map<string, ContractTag>,
): void {
  for (const name of operationTags) {
    const description = CANONICAL_TAGS.get(name) ?? `${name} operations`;
    tags.set(name, { name, description });
  }
}

function isInternalOperation(route: string): boolean {
  return /jobs\/\{jobId\}\/(input|callback)/.test(route);
}

function isPublicOperation(route: string): boolean {
  return (
    /^\/api\/?$/.test(route) ||
    route.includes('/health') ||
    /\/auth\/(sign-up|sign-in|verify-email|forget-password|reset-password|callback\/google)/.test(
      route,
    )
  );
}

function getSecurity(
  internal: boolean,
  publicOperation: boolean,
): Record<string, string[]>[] {
  if (internal) {
    return [{ bearer: [] }];
  }

  return publicOperation ? [] : [{ cookie: [] }];
}

function markInternal(operation: ContractOperation): void {
  const description = operation.description ?? '';

  operation['x-internal'] = true;
  operation.description = `${description
    .replace(INTERNAL_OPERATION_MARKERS, '')
    .trim()} ${INTERNAL_OPERATION_MARKER}`;
}

function completeResponseDescriptions(operation: ContractOperation): void {
  for (const [status, response] of Object.entries(operation.responses ?? {})) {
    response.description ||= `HTTP ${status} response.`;
  }
}

function addStandardResponses(
  operation: ContractOperation,
  method: string,
  route: string,
  internal: boolean,
  publicOperation: boolean,
): void {
  ensureResponse(operation, '400', 'BadRequestError');

  if (!publicOperation) {
    ensureResponse(operation, '401', 'UnauthorizedError');
  }

  if (!publicOperation && !internal) {
    ensureResponse(operation, '403', 'ForbiddenError');
  }

  if (/[/{]id\}|\{[^}]+Id\}/.test(route)) {
    ensureResponse(operation, '404', 'NotFoundError');
  }

  if (WRITE_METHODS.includes(method)) {
    ensureResponse(operation, '409', 'ConflictError');
  }

  ensureResponse(operation, '500', 'InternalError');
}

function ensureResponse(
  operation: ContractOperation,
  status: string,
  component: string,
): void {
  operation.responses ??= {};
  operation.responses[status] ??= {
    $ref: `#/components/responses/${component}`,
  };
}

function standardContractSchemas() {
  return {
    ErrorResponse: {
      type: 'object',
      description: 'Stable UMTAS error envelope.',
      required: ['code', 'message'],
      properties: {
        code: {
          type: 'string',
          description: 'Stable machine-readable error code.',
          example: 'PDF_JOB_NOT_FOUND',
        },
        message: {
          type: 'string',
          example: 'PDF parser job was not found.',
        },
        details: {
          type: 'object',
          additionalProperties: true,
        },
        requestId: {
          type: 'string',
          example: 'req_01J...',
        },
      },
    },
    ValidationErrorResponse: {
      allOf: [{ $ref: '#/components/schemas/ErrorResponse' }],
      description: 'Request validation failed.',
    },
    AcceptedJobResponse: {
      type: 'object',
      required: ['accepted', 'jobId'],
      properties: {
        accepted: {
          type: 'boolean',
          example: true,
        },
        jobId: {
          type: 'string',
          format: 'uuid',
        },
        status: {
          type: 'string',
          enum: ['queued', 'processing', 'completed', 'failed'],
        },
      },
    },
    JobStatus: {
      type: 'string',
      enum: ['queued', 'processing', 'completed', 'failed'],
      description: 'Asynchronous job lifecycle state.',
    },
    JobError: {
      allOf: [{ $ref: '#/components/schemas/ErrorResponse' }],
      description: 'Terminal asynchronous job failure.',
    },
    PaginationMetadata: {
      type: 'object',
      required: ['page', 'pageSize', 'total'],
      properties: {
        page: {
          type: 'integer',
          minimum: 1,
        },
        pageSize: {
          type: 'integer',
          minimum: 1,
          maximum: 100,
        },
        total: {
          type: 'integer',
          minimum: 0,
        },
      },
    },
    UUID: {
      type: 'string',
      format: 'uuid',
      example: '00000000-0000-4000-8000-000000000001',
    },
    TimeOfDay: {
      type: 'string',
      pattern: '^([01]\\d|2[0-3]):[0-5]\\d$',
      example: '08:30',
      description: '24-hour local time in HH:mm format.',
    },
    ...systemContractCatalog.schemas,
  };
}

function applySystemContractRouteSchemas(document: OpenAPIObject): void {
  setRequestSchema(
    document,
    '/api/pdf-parser/jobs/{jobId}/callback',
    'post',
    'Http_PdfParserCallback',
  );
  setResponseSchema(
    document,
    '/api/pdf-parser/jobs/{jobId}/result',
    'get',
    '200',
    'Worker_PdfParserResult',
  );
  setResponseSchema(
    document,
    '/api/solver/jobs/{jobId}/input',
    'get',
    '200',
    'Worker_SolverInput',
  );
  setResponseSchema(
    document,
    '/api/solver/jobs/{jobId}/result',
    'get',
    '200',
    'Worker_SolverResult',
  );
  setRequestSchema(
    document,
    '/api/solver/jobs/{jobId}/callback',
    'post',
    'Http_SolverCallback',
  );
}

function setRequestSchema(
  document: OpenAPIObject,
  route: string,
  method: string,
  schema: string,
): void {
  const operation = getOperation(document, route, method);
  const requestBody = operation?.requestBody as
    { content?: Record<string, { schema?: unknown }> } | undefined;
  const json = requestBody?.content?.['application/json'];
  if (json) json.schema = { $ref: `#/components/schemas/${schema}` };
}

function setResponseSchema(
  document: OpenAPIObject,
  route: string,
  method: string,
  status: string,
  schema: string,
): void {
  const operation = getOperation(document, route, method);
  const response = operation?.responses?.[status] as
    { content?: Record<string, { schema?: unknown }> } | undefined;
  const json = response?.content?.['application/json'];
  if (json) json.schema = { $ref: `#/components/schemas/${schema}` };
}

function getOperation(
  document: OpenAPIObject,
  route: string,
  method: string,
): Record<string, any> | undefined {
  return document.paths?.[route]?.[method] as Record<string, any> | undefined;
}

function standardContractResponses() {
  return {
    BadRequestError: createResponse(
      'The request is invalid.',
      'ValidationErrorResponse',
    ),
    UnauthorizedError: createResponse('Authentication is required.'),
    ForbiddenError: createResponse(
      'The authenticated principal is not allowed to perform this operation.',
    ),
    NotFoundError: createResponse('The requested resource was not found.'),
    ConflictError: createResponse(
      'The request conflicts with current resource state.',
    ),
    RateLimitError: createResponse('Too many requests.'),
    InternalError: createResponse('An unexpected server error occurred.'),
  };
}

function createResponse(description: string, schema = 'ErrorResponse') {
  return {
    description,
    content: {
      'application/json': {
        schema: {
          $ref: `#/components/schemas/${schema}`,
        },
      },
    },
  };
}
