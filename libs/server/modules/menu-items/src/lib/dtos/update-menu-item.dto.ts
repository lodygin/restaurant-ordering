import { PartialType } from '@nestjs/swagger';

import { CreateMenuItemDto } from './create-menu-item.dto';

/**
 * Switching an item to open price clears its price; switching it back to a fixed price needs a
 * new `price` in the same request.
 */
export class UpdateMenuItemDto extends PartialType(CreateMenuItemDto) {}
