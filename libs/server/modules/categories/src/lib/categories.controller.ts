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
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';

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
    return { data: this.categories.create(dto) };
  }

  @Patch(':id')
  @ApiOkResponse({ type: CategoryResponseDto })
  @ApiNotFoundResponse({ description: NOT_FOUND })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCategoryDto,
  ): CategoryResponseDto {
    return { data: this.categories.update(id, dto) };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse()
  @ApiNotFoundResponse({ description: NOT_FOUND })
  @ApiConflictResponse({
    description: 'The category still has items; the body carries their `itemCount`.',
  })
  remove(@Param('id', ParseUUIDPipe) id: string): void {
    this.categories.remove(id);
  }
}
