import { Controller, Get, Headers, Query, Sse, type MessageEvent } from '@nestjs/common';
import { ApiExcludeEndpoint, ApiExtraModels, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { type Observable } from 'rxjs';

import { EventsQueryDto, ResyncEventDto } from '@restaurant-ordering/server/common/sync';
import { CategoriesService } from '@restaurant-ordering/server/modules/categories';
import { MenuItemsService } from '@restaurant-ordering/server/modules/menu-items';
import { MenuRevisionService } from '@restaurant-ordering/server/modules/menu-revision';

import {
  CategoryDeletedEventDto,
  CategorySavedEventDto,
  MenuItemDeletedEventDto,
  MenuItemSavedEventDto,
  MenuResponseDto,
} from './dtos';
import { MenuChangesService } from './menu-changes.service';

@ApiTags('menu')
@ApiExtraModels(
  CategorySavedEventDto,
  CategoryDeletedEventDto,
  MenuItemSavedEventDto,
  MenuItemDeletedEventDto,
  ResyncEventDto,
)
@Controller('menu')
export class MenuController {
  constructor(
    private readonly categories: CategoriesService,
    private readonly items: MenuItemsService,
    private readonly changes: MenuChangesService,
    private readonly revision: MenuRevisionService,
  ) {}

  @Get()
  @ApiOkResponse({
    type: MenuResponseDto,
    description: 'The whole menu with its current revision.',
  })
  snapshot(): MenuResponseDto {
    return {
      data: { categories: this.categories.list(), items: this.items.list() },
      meta: { revision: this.revision.current() },
    };
  }

  // EventSource, not HttpClient: kept out of the spec so orval does not generate a method for it
  @Sse('events')
  @ApiExcludeEndpoint()
  events(
    @Query() query: EventsQueryDto,
    @Headers('last-event-id') lastEventId?: string,
  ): Observable<MessageEvent> {
    return this.changes.events(lastEventId ? Number(lastEventId) : query.since);
  }
}
