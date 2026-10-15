import { VersioningType, type INestApplication } from '@nestjs/common';

export const API_PREFIX = 'api';

export const API_DEFAULT_VERSION = '1';

export function applyApiRouting(app: INestApplication): void {
  app.setGlobalPrefix(API_PREFIX);
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: API_DEFAULT_VERSION });
}
