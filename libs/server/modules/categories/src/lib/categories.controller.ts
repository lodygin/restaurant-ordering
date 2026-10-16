import { Body, Controller, Delete, Param, ParseUUIDPipe, Patch, Post } from '@nestjs/common';
import {
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';

import { RevisionResponseDto } from '@restaurant-ordering/server/modules/menu-revision';

import { CategoriesService } from './categories.service';
import { CategoryResponseDto, CreateCategoryDto, UpdateCategoryDto } from './dtos';

const NOT_FOUND = 'No category with this id.';

@ApiTags('menu')
@Controller('menu/categories')
export class CategoriesController {
  constructor(private readonly categories: CategoriesService) {}

  @Post()
  @ApiCreatedResponse({ type: CategoryResponseDto })
  create(@Body() dto: CreateCategoryDto): CategoryResponseDto {
    const { data, revision } = this.categories.create(dto);

    return { data, meta: { revision } };
  }

  @Patch(':id')
  @ApiOkResponse({ type: CategoryResponseDto })
  @ApiNotFoundResponse({ description: NOT_FOUND })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCategoryDto,
  ): CategoryResponseDto {
    const { data, revision } = this.categories.update(id, dto);

    return { data, meta: { revision } };
  }

  @Delete(':id')
  @ApiOkResponse({ type: RevisionResponseDto })
  @ApiNotFoundResponse({ description: NOT_FOUND })
  @ApiConflictResponse({
    description: 'The category still has items; the body carries their `itemCount`.',
  })
  remove(@Param('id', ParseUUIDPipe) id: string): RevisionResponseDto {
    return { meta: { revision: this.categories.remove(id) } };
  }
}
