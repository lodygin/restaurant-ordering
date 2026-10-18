import { Injectable } from '@nestjs/common';

import { ChangeLog } from '@restaurant-ordering/server/common/sync';

// categories and items commit here, so the menu has one revision and one stream
@Injectable()
export class MenuRevisionService extends ChangeLog<{ type: string }> {}
