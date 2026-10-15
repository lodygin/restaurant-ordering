import { Logger } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { SwaggerModule } from '@nestjs/swagger';

import { API_PREFIX, applyApiRouting } from './app/api-routing';
import appConfig from './app/app.config';
import { AppModule } from './app/app.module';
import { createDocumentConfig } from './app/swagger.config';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);

  app.enableShutdownHooks();

  const config = app.get<ConfigType<typeof appConfig>>(appConfig.KEY);
  const isProduction = config.NODE_ENV === 'production';

  app.enableCors({ origin: config.CLIENT_ORIGIN });

  applyApiRouting(app);

  if (!isProduction) {
    const document = SwaggerModule.createDocument(app, createDocumentConfig());

    SwaggerModule.setup('docs', app, document, { jsonDocumentUrl: 'docs-json' });
  }

  await app.listen(config.PORT);
  Logger.log(
    `🚀 Application is running in ${config.NODE_ENV} mode on: http://localhost:${config.PORT}/${API_PREFIX}`,
  );

  if (!isProduction) {
    Logger.log(`📖 Swagger UI: http://localhost:${config.PORT}/docs`);
  }
}

void bootstrap();
