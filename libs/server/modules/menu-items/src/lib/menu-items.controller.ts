import {
  Body,
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiTags,
  ApiUnprocessableEntityResponse,
} from '@nestjs/swagger';

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
    return { data: this.items.create(dto).data };
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
    return { data: this.items.update(id, dto).data };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse()
  @ApiNotFoundResponse({ description: NOT_FOUND })
  remove(@Param('id', ParseUUIDPipe) id: string): void {
    this.items.remove(id);
  }
}
