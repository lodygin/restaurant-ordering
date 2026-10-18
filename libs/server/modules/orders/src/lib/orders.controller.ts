import { Body, Controller, Get, Post, Sse, type MessageEvent } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiExcludeEndpoint,
  ApiExtraModels,
  ApiHeader,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';
import { type Observable } from 'rxjs';

import { IdempotencyKey } from '@restaurant-ordering/server/common/idempotency';
import { ResumeFrom, ResyncEventDto } from '@restaurant-ordering/server/common/sync';

import {
  OrderConflictDto,
  OrderEventDto,
  OrderResponseDto,
  OrdersResponseDto,
  PlaceOrderDto,
} from './dtos';
import { OrdersService } from './orders.service';

@ApiTags('orders')
@ApiExtraModels(OrderEventDto, ResyncEventDto)
@Controller('orders')
export class OrdersController {
  constructor(private readonly orders: OrdersService) {}

  @Get()
  @ApiOkResponse({
    type: OrdersResponseDto,
    description: 'All orders with their current revision.',
  })
  list(): OrdersResponseDto {
    return { data: this.orders.list(), meta: { revision: this.orders.currentRevision() } };
  }

  @Sse('events')
  @ApiExcludeEndpoint()
  events(@ResumeFrom() since?: number): Observable<MessageEvent> {
    return this.orders.events(since);
  }

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
