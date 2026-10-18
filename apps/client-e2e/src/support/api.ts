import { type APIRequestContext } from '@playwright/test';

import { type ItemSeed, type PlacedOrder, type SeededItem } from './types';

const API = 'http://localhost:3000/api/v1';

// tests share one in-memory server, so each one works on its own uniquely named data
export class Api {
  constructor(private readonly request: APIRequestContext) {}

  async createCategory(name: string): Promise<string> {
    const response = await this.request.post(`${API}/menu/categories`, { data: { name } });
    const { data } = (await response.json()) as { data: { id: string } };

    return data.id;
  }

  async createItem(categoryId: string, name: string, seed: ItemSeed = {}): Promise<SeededItem> {
    const { openPrice = false, price = openPrice ? null : 1000, available = true } = seed;
    const response = await this.request.post(`${API}/menu/items`, {
      data: { categoryId, name, price, openPrice, available },
    });

    const { data } = (await response.json()) as { data: SeededItem };

    return data;
  }

  async updateItem(id: string, changes: ItemSeed): Promise<void> {
    await this.request.patch(`${API}/menu/items/${id}`, { data: changes });
  }

  async ordersWith(itemName: string): Promise<PlacedOrder[]> {
    const response = await this.request.get(`${API}/orders`);
    const { data } = (await response.json()) as { data: PlacedOrder[] };

    return data.filter(order => order.lines.some(line => line.name === itemName));
  }
}
