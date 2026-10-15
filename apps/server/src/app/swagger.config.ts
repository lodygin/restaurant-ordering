import { DocumentBuilder, type OpenAPIObject } from '@nestjs/swagger';

export function createDocumentConfig(): Omit<OpenAPIObject, 'paths'> {
  return new DocumentBuilder().setTitle('Restaurant Ordering API').setVersion('1.0').build();
}
