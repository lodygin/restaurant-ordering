import { Injectable } from '@nestjs/common';

import { Revision } from '@restaurant-ordering/server/common/sync';

@Injectable()
export class MenuRevisionService extends Revision {}
