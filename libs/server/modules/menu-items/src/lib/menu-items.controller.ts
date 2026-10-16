import { Body, Controller, Delete, Param, ParseUUIDPipe, Patch, Post } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiTags,
  ApiUnprocessableEntityResponse,
} from '@nestjs/swagger';

import { RevisionResponseDto } from '@restaurant-ordering/server/modules/menu-revision';

import { CreateMenuItemDto, MenuItemResponseDto, UpdateMenuItemDto } from './dtos';
import { MenuItemsService } from './menu-items.service';

const NOT_FOUND = 'No menu item with this id.';
const UNKNOWN_CATEGORY = 'categoryId points to a category that does not exist.';
const PRICING_MISMATCH =
  'Price does not match the pricing mode: fixed needs a price, open has none.';

@ApiTags('menu')
@Controller('menu/items')
export class MenuItemsController {
  constructor(private readonly items: MenuItemsService) {}

  @Post()
  @ApiCreatedResponse({ type: MenuItemResponseDto })
  @ApiBadRequestResponse({ description: PRICING_MISMATCH })
  @ApiUnprocessableEntityResponse({ description: UNKNOWN_CATEGORY })
  create(@Body() dto: CreateMenuItemDto): MenuItemResponseDto {
    const { data, revision } = this.items.create(dto);

    return { data, meta: { revision } };
  }

  @Patch(':id')
  @ApiOkResponse({ type: MenuItemResponseDto })
  @ApiBadRequestResponse({ description: PRICING_MISMATCH })
  @ApiNotFoundResponse({ description: NOT_FOUND })
  @ApiUnprocessableEntityResponse({ description: UNKNOWN_CATEGORY })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateMenuItemDto,
  ): MenuItemResponseDto {
    const { data, revision } = this.items.update(id, dto);

    return { data, meta: { revision } };
  }

  @Delete(':id')
  @ApiOkResponse({ type: RevisionResponseDto })
  @ApiNotFoundResponse({ description: NOT_FOUND })
  remove(@Param('id', ParseUUIDPipe) id: string): RevisionResponseDto {
    return { meta: { revision: this.items.remove(id) } };
  }
}
