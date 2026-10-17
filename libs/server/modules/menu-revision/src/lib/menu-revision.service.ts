import { Injectable } from '@nestjs/common';

import { Revision } from '@restaurant-ordering/server/infrastructure/sse';

@Injectable()
export class MenuRevisionService extends Revision {}
