import { randomUUID } from 'node:crypto';

import { type Category } from '@restaurant-ordering/server/modules/categories';

import { type MenuItem } from '../types';

type CatalogCategory = {
  category: string;
  priceRange: [number, number];
  portions: boolean;
  dishes: string[];
  variants: string[];
};

const PORTIONS: { suffix: string; factor: number }[] = [
  { suffix: '', factor: 1 },
  { suffix: 'half portion', factor: 0.6 },
  { suffix: 'kids', factor: 0.5 },
  { suffix: 'to share', factor: 1.8 },
];

const OPEN_PRICE_ITEMS: Record<string, { name: string; description: string }> = {
  Grill: { name: 'Catch of the day', description: 'Market price, weighed at the counter' },
  Desserts: { name: 'Celebration cake', description: 'Made to order, price agreed with staff' },
  'Wine by the glass': {
    name: 'Bottle from the cellar',
    description: 'Ask for the list, price set when ordering',
  },
};

const CATALOG: CatalogCategory[] = [
  {
    category: 'Breakfast',
    priceRange: [650, 1400],
    portions: true,
    dishes: [
      'Shakshuka',
      'Buttermilk pancakes',
      'Avocado toast',
      'Granola bowl',
      'Eggs Benedict',
      'Chicken congee',
      'Brioche French toast',
      'Breakfast burrito',
    ],
    variants: ['', 'with bacon', 'with smoked salmon', 'vegan', 'double'],
  },
  {
    category: 'Soups',
    priceRange: [550, 1300],
    portions: true,
    dishes: [
      'Tom yum',
      'Miso soup',
      'Borscht',
      'Pho bo',
      'Minestrone',
      'Tonkotsu ramen',
      'Red lentil soup',
      'Chicken noodle soup',
    ],
    variants: ['', 'large', 'spicy', 'with extra noodles'],
  },
  {
    category: 'Salads',
    priceRange: [800, 1500],
    portions: true,
    dishes: [
      'Caesar',
      'Greek salad',
      'Som tam',
      'Niçoise',
      'Burrata and tomato',
      'Quinoa tabbouleh',
      'Warm beet salad',
      'Seaweed salad',
    ],
    variants: ['', 'with chicken', 'with prawns', 'with halloumi', 'large'],
  },
  {
    category: 'Noodles',
    priceRange: [900, 1700],
    portions: true,
    dishes: [
      'Pad thai',
      'Dan dan noodles',
      'Yaki udon',
      'Singapore noodles',
      'Chow mein',
      'Laksa',
      'Japchae',
      'Cold soba',
    ],
    variants: ['with chicken', 'with beef', 'with tofu', 'with prawns', 'spicy'],
  },
  {
    category: 'Rice bowls',
    priceRange: [950, 1650],
    portions: true,
    dishes: [
      'Bibimbap',
      'Katsu curry',
      'Poke bowl',
      'Teriyaki bowl',
      'Nasi goreng',
      'Chicken biryani',
      'Burrito bowl',
      'Gyudon',
    ],
    variants: ['', 'large', 'with egg', 'vegan'],
  },
  {
    category: 'Dumplings',
    priceRange: [700, 1300],
    portions: true,
    dishes: [
      'Pork gyoza',
      'Xiao long bao',
      'Har gow',
      'Pelmeni',
      'Khinkali',
      'Momo',
      'Wontons in chili oil',
      'Vegetable bao',
    ],
    variants: ['6 pcs', '10 pcs', 'fried', 'steamed'],
  },
  {
    category: 'Grill',
    priceRange: [1400, 3200],
    portions: true,
    dishes: [
      'Ribeye steak',
      'Lamb chops',
      'Chicken skewers',
      'Pork belly',
      'Grilled salmon',
      'Halloumi skewers',
      'Beef kofta',
      'Whole sea bream',
    ],
    variants: ['', 'with fries', 'with grilled vegetables', 'with salad'],
  },
  {
    category: 'Burgers',
    priceRange: [1100, 1800],
    portions: true,
    dishes: [
      'Classic cheeseburger',
      'Smash burger',
      'Chicken burger',
      'Mushroom burger',
      'Lamb burger',
      'Fish burger',
      'Bacon burger',
      'Bean burger',
    ],
    variants: ['', 'double', 'with fries', 'no bun'],
  },
  {
    category: 'Pizza',
    priceRange: [1000, 1900],
    portions: true,
    dishes: [
      'Margherita',
      'Pepperoni',
      'Quattro formaggi',
      'Diavola',
      'Funghi',
      'Capricciosa',
      'Prosciutto e rucola',
      'Marinara',
    ],
    variants: ['30 cm', '40 cm', 'gluten-free base'],
  },
  {
    category: 'Pasta',
    priceRange: [1050, 1750],
    portions: true,
    dishes: [
      'Carbonara',
      'Cacio e pepe',
      'Bolognese',
      'Pesto Genovese',
      'Arrabbiata',
      'Vongole',
      'Lasagne',
      'Mushroom tagliatelle',
    ],
    variants: ['', 'large', 'gluten-free'],
  },
  {
    category: 'Sides',
    priceRange: [300, 700],
    portions: true,
    dishes: [
      'Fries',
      'Sweet potato fries',
      'Steamed rice',
      'Kimchi',
      'Garlic bread',
      'Edamame',
      'Coleslaw',
      'Grilled corn',
    ],
    variants: ['', 'large'],
  },
  {
    category: 'Desserts',
    priceRange: [450, 950],
    portions: true,
    dishes: [
      'Tiramisu',
      'Cheesecake',
      'Mochi',
      'Crème brûlée',
      'Chocolate fondant',
      'Panna cotta',
      'Baklava',
      'Mango sticky rice',
    ],
    variants: ['', 'with ice cream'],
  },
  {
    category: 'Coffee',
    priceRange: [250, 550],
    portions: false,
    dishes: [
      'Espresso',
      'Americano',
      'Flat white',
      'Cappuccino',
      'Latte',
      'Cortado',
      'Mocha',
      'Iced latte',
    ],
    variants: ['', 'oat milk', 'large', 'decaf'],
  },
  {
    category: 'Tea',
    priceRange: [250, 500],
    portions: false,
    dishes: [
      'Green tea',
      'Earl Grey',
      'Masala chai',
      'Jasmine tea',
      'Mint tea',
      'Oolong',
      'Matcha latte',
      'Hibiscus iced tea',
    ],
    variants: ['', 'large'],
  },
  {
    category: 'Lemonades',
    priceRange: [350, 600],
    portions: false,
    dishes: [
      'Classic lemonade',
      'Raspberry lemonade',
      'Ginger lemonade',
      'Yuzu soda',
      'Cucumber mint',
      'Passion fruit soda',
    ],
    variants: ['330 ml', '500 ml'],
  },
  {
    category: 'Beer',
    priceRange: [450, 900],
    portions: false,
    dishes: ['Pilsner', 'IPA', 'Wheat beer', 'Stout', 'Sour ale', 'Lager'],
    variants: ['330 ml', '500 ml'],
  },
  {
    category: 'Wine by the glass',
    priceRange: [600, 1400],
    portions: false,
    dishes: [
      'Pinot grigio',
      'Sauvignon blanc',
      'Rioja',
      'Malbec',
      'Chianti',
      'Prosecco',
      'Rosé',
      'Riesling',
    ],
    variants: ['125 ml', '175 ml', '250 ml'],
  },
];

// mulberry32
function createRandom(seed: number): () => number {
  let state = seed;

  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;

    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function roundPrice(cents: number): number {
  return Math.max(50, Math.round(cents / 50) * 50);
}

export function seedMenuItems(categories: Category[]): MenuItem[] {
  const random = createRandom(42);
  const categoryIds = new Map(categories.map(category => [category.name, category.id]));
  const items: MenuItem[] = [];

  for (const entry of CATALOG) {
    const categoryId = categoryIds.get(entry.category);

    if (!categoryId) {
      continue;
    }

    const openPriceItem = OPEN_PRICE_ITEMS[entry.category];
    const [min, max] = entry.priceRange;
    const portions = entry.portions ? PORTIONS : PORTIONS.slice(0, 1);

    if (openPriceItem) {
      items.push({
        id: randomUUID(),
        categoryId,
        ...openPriceItem,
        price: null,
        available: true,
        openPrice: true,
      });
    }

    for (const dish of entry.dishes) {
      const base = min + random() * (max - min);

      entry.variants.forEach((variant, step) => {
        for (const portion of portions) {
          const name = [dish, variant, portion.suffix].filter(Boolean).join(', ');

          items.push({
            id: randomUUID(),
            categoryId,
            name,
            description: '',
            price: roundPrice((base + step * 150) * portion.factor),
            available: random() > 0.06,
            openPrice: false,
          });
        }
      });
    }
  }

  return items;
}
