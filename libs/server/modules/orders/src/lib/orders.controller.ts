import { Body, Controller, Post } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiHeader,
  ApiTags,
} from '@nestjs/swagger';

import { IdempotencyKey } from '@restaurant-ordering/server/common/idempotency';

import { OrderConflictDto, OrderResponseDto, PlaceOrderDto } from './dtos';
import { OrdersService } from './orders.service';

@ApiTags('orders')
@Controller('orders')
export class OrdersController {
  constructor(private readonly orders: OrdersService) {}

  @Post()
  @ApiHeader({
    name: 'Idempotency-Key',
    required: true,
    description: 'UUID per cart; a retry with the same key returns the order already placed.',
  })
  @ApiCreatedResponse({ type: OrderResponseDto })
  @ApiBadRequestResponse({ description: 'Invalid cart or missing Idempotency-Key.' })
  @ApiConflictResponse({
    type: OrderConflictDto,
    description: 'The menu changed since the lines were added; nothing was placed.',
  })
  place(@IdempotencyKey() idempotencyKey: string, @Body() dto: PlaceOrderDto): OrderResponseDto {
    return { data: this.orders.place(idempotencyKey, dto) };
  }
}
