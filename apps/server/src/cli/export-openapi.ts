import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { NestFactory } from '@nestjs/core';
import { SwaggerModule } from '@nestjs/swagger';

import { applyApiRouting } from '../app/api-routing';
import { AppModule } from '../app/app.module';
import { createDocumentConfig } from '../app/swagger.config';

async function main(): Promise<void> {
  // preview builds the module graph without instantiating providers: no in-memory seed, no timers
  const app = await NestFactory.create(AppModule, { logger: false, preview: true });

  applyApiRouting(app);

  const document = SwaggerModule.createDocument(app, createDocumentConfig());

  const outPath = join(process.cwd(), 'dist/apps/server/openapi.json');

  await writeFile(outPath, `${JSON.stringify(document, null, 2)}\n`);

  await app.close();

  console.log(`Wrote ${outPath}`);
}

void main();
