/*
 * Shared state for the HTML mockups.
 * A fake "server" backed by localStorage: writes in one tab arrive in the others through the
 * `storage` event, which stands in for the socket.io push of the real app.
 */
const Lab = (() => {
  const KEY = { menu: 'kitchen:menu', cart: 'kitchen:cart', orders: 'kitchen:orders' };
  const subscribers = new Map();

  const read = key => {
    try {
      return JSON.parse(localStorage.getItem(key) ?? 'null');
    } catch {
      return null;
    }
  };
  const emit = (key, value) => subscribers.get(key)?.forEach(fn => fn(value));
  const write = (key, value) => {
    localStorage.setItem(key, JSON.stringify(value));
    emit(key, value);
  };
  const on = (key, fn) => {
    if (!subscribers.has(key)) {
      subscribers.set(key, new Set());
    }

    subscribers.get(key).add(fn);
  };

  window.addEventListener('storage', e => {
    if (e.key && subscribers.has(e.key)) {
      emit(e.key, read(e.key));
    }
  });

  /* ---------- Seed menu ---------- */

  const rng = seed => () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;

    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  const CATALOG = [
    [
      'Breakfast',
      [650, 1400],
      [
        'Shakshuka',
        'Buttermilk pancakes',
        'Avocado toast',
        'Granola bowl',
        'Eggs Benedict',
        'Chicken congee',
        'Brioche French toast',
        'Breakfast burrito',
      ],
      ['', 'with bacon', 'with smoked salmon', 'vegan', 'double'],
    ],
    [
      'Soups',
      [550, 1300],
      [
        'Tom yum',
        'Miso soup',
        'Borscht',
        'Pho bo',
        'Minestrone',
        'Tonkotsu ramen',
        'Red lentil soup',
        'Chicken noodle soup',
      ],
      ['', 'large', 'spicy', 'with extra noodles'],
    ],
    [
      'Salads',
      [800, 1500],
      [
        'Caesar',
        'Greek salad',
        'Som tam',
        'Niçoise',
        'Burrata and tomato',
        'Quinoa tabbouleh',
        'Warm beet salad',
        'Seaweed salad',
      ],
      ['', 'with chicken', 'with prawns', 'with halloumi', 'large'],
    ],
    [
      'Noodles',
      [900, 1700],
      [
        'Pad thai',
        'Dan dan noodles',
        'Yaki udon',
        'Singapore noodles',
        'Chow mein',
        'Laksa',
        'Japchae',
        'Cold soba',
      ],
      ['with chicken', 'with beef', 'with tofu', 'with prawns', 'spicy'],
    ],
    [
      'Rice bowls',
      [950, 1650],
      [
        'Bibimbap',
        'Katsu curry',
        'Poke bowl',
        'Teriyaki bowl',
        'Nasi goreng',
        'Chicken biryani',
        'Burrito bowl',
        'Gyudon',
      ],
      ['', 'large', 'with egg', 'vegan'],
    ],
    [
      'Dumplings',
      [700, 1300],
      [
        'Pork gyoza',
        'Xiao long bao',
        'Har gow',
        'Pelmeni',
        'Khinkali',
        'Momo',
        'Wontons in chili oil',
        'Vegetable bao',
      ],
      ['6 pcs', '10 pcs', 'fried', 'steamed'],
    ],
    [
      'Grill',
      [1400, 3200],
      [
        'Ribeye steak',
        'Lamb chops',
        'Chicken skewers',
        'Pork belly',
        'Grilled salmon',
        'Halloumi skewers',
        'Beef kofta',
        'Whole sea bream',
      ],
      ['', 'with fries', 'with grilled vegetables', 'with salad'],
    ],
    [
      'Burgers',
      [1100, 1800],
      [
        'Classic cheeseburger',
        'Smash burger',
        'Chicken burger',
        'Mushroom burger',
        'Lamb burger',
        'Fish burger',
        'Bacon burger',
        'Bean burger',
      ],
      ['', 'double', 'with fries', 'no bun'],
    ],
    [
      'Pizza',
      [1000, 1900],
      [
        'Margherita',
        'Pepperoni',
        'Quattro formaggi',
        'Diavola',
        'Funghi',
        'Capricciosa',
        'Prosciutto e rucola',
        'Marinara',
      ],
      ['30 cm', '40 cm', 'gluten-free base'],
    ],
    [
      'Pasta',
      [1050, 1750],
      [
        'Carbonara',
        'Cacio e pepe',
        'Bolognese',
        'Pesto Genovese',
        'Arrabbiata',
        'Vongole',
        'Lasagne',
        'Mushroom tagliatelle',
      ],
      ['', 'large', 'gluten-free'],
    ],
    [
      'Sides',
      [300, 700],
      [
        'Fries',
        'Sweet potato fries',
        'Steamed rice',
        'Kimchi',
        'Garlic bread',
        'Edamame',
        'Coleslaw',
        'Grilled corn',
      ],
      ['', 'large'],
    ],
    [
      'Desserts',
      [450, 950],
      [
        'Tiramisu',
        'Cheesecake',
        'Mochi',
        'Crème brûlée',
        'Chocolate fondant',
        'Panna cotta',
        'Baklava',
        'Mango sticky rice',
      ],
      ['', 'with ice cream'],
    ],
    [
      'Coffee',
      [250, 550],
      [
        'Espresso',
        'Americano',
        'Flat white',
        'Cappuccino',
        'Latte',
        'Cortado',
        'Mocha',
        'Iced latte',
      ],
      ['', 'oat milk', 'large', 'decaf'],
    ],
    [
      'Tea',
      [250, 500],
      [
        'Green tea',
        'Earl Grey',
        'Masala chai',
        'Jasmine tea',
        'Mint tea',
        'Oolong',
        'Matcha latte',
        'Hibiscus iced tea',
      ],
      ['', 'large'],
    ],
    [
      'Lemonades',
      [350, 600],
      [
        'Classic lemonade',
        'Raspberry lemonade',
        'Ginger lemonade',
        'Yuzu soda',
        'Cucumber mint',
        'Passion fruit soda',
      ],
      ['330 ml', '500 ml'],
    ],
    [
      'Beer',
      [450, 900],
      ['Pilsner', 'IPA', 'Wheat beer', 'Stout', 'Sour ale', 'Lager'],
      ['330 ml', '500 ml'],
    ],
    [
      'Wine by the glass',
      [600, 1400],
      [
        'Pinot grigio',
        'Sauvignon blanc',
        'Rioja',
        'Malbec',
        'Chianti',
        'Prosecco',
        'Rosé',
        'Riesling',
      ],
      ['125 ml', '175 ml', '250 ml'],
    ],
  ];

  const OPEN_PRICE = {
    Grill: ['Catch of the day', 'Market price, weighed at the counter'],
    Desserts: ['Celebration cake', 'Made to order, price agreed with staff'],
    'Wine by the glass': ['Bottle from the cellar', 'Ask for the list, price set when ordering'],
  };

  function seedMenu() {
    const random = rng(42);
    const categories = [];
    const items = [];
    let itemSeq = 0;

    CATALOG.forEach(([name, [min, max], dishes, variants], index) => {
      const categoryId = `c${index + 1}`;
      categories.push({ id: categoryId, name });

      if (OPEN_PRICE[name]) {
        const [itemName, description] = OPEN_PRICE[name];
        items.push({
          id: `i${++itemSeq}`,
          categoryId,
          name: itemName,
          description,
          price: null,
          available: true,
          openPrice: true,
        });
      }

      for (const dish of dishes) {
        const base = min + random() * (max - min);

        variants.forEach((variant, step) => {
          const price = Math.round((base + step * 150) / 50) * 50;
          items.push({
            id: `i${++itemSeq}`,
            categoryId,
            name: variant ? `${dish}, ${variant}` : dish,
            description: '',
            price,
            available: random() > 0.06,
            openPrice: false,
          });
        });
      }
    });

    return { revision: 1, categories, items };
  }

  /* ---------- Menu, cart, orders ---------- */

  function getMenu() {
    let menu = read(KEY.menu);

    if (!menu) {
      menu = seedMenu();
      localStorage.setItem(KEY.menu, JSON.stringify(menu));
    }

    return menu;
  }

  function updateMenu(mutate) {
    const menu = getMenu();
    mutate(menu);
    menu.revision += 1;
    write(KEY.menu, menu);

    return menu;
  }

  const getCart = () => read(KEY.cart) ?? { lines: [], discount: 0 };
  const saveCart = cart => write(KEY.cart, cart);
  const getOrders = () => read(KEY.orders) ?? [];

  /* ---------- Connection (per tab) ---------- */

  let connection = 'online';
  const connectionSubscribers = new Set();

  function setConnection(state) {
    connection = state;
    connectionSubscribers.forEach(fn => fn(state));
  }

  function goOnline() {
    setConnection('reconnecting');
    setTimeout(() => setConnection('online'), 1200);
  }

  const onConnection = fn => connectionSubscribers.add(fn);
  const isOnline = () => connection === 'online';

  /* ---------- Fake API ---------- */

  let nextCheckout = 'normal';
  const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

  class ApiError extends Error {
    constructor(code, details) {
      super(code);
      this.code = code;
      this.details = details;
    }
  }

  function subtotalOf(lines) {
    return lines.reduce((sum, line) => sum + line.unitPrice * line.qty, 0);
  }

  async function placeOrder({ requestKey, lines, discount }) {
    await delay(700 + Math.random() * 600);

    if (!isOnline()) {
      throw new ApiError('offline');
    }

    const mode = nextCheckout;
    nextCheckout = 'normal';
    syncLabPanel();

    if (mode === 'error') {
      throw new ApiError('server');
    }

    const orders = getOrders();
    const existing = orders.find(order => order.requestKey === requestKey);

    if (existing) {
      return { order: existing, replayed: true };
    }

    const menu = getMenu();
    const changes = [];

    for (const line of lines) {
      const item = menu.items.find(candidate => candidate.id === line.itemId);

      // The pricing mode is part of the contract: a line priced one way is never accepted
      // against an item that is now priced the other way.
      if (!item || !item.available) {
        changes.push({ type: 'unavailable', lineId: line.lineId, name: line.name });
      } else if (item.openPrice && !line.openPrice) {
        changes.push({ type: 'now-open', lineId: line.lineId, name: line.name });
      } else if (!item.openPrice && line.openPrice) {
        changes.push({
          type: 'now-fixed',
          lineId: line.lineId,
          name: line.name,
          from: line.unitPrice,
          to: item.price,
        });
      } else if (!item.openPrice && item.price !== line.unitPrice) {
        changes.push({
          type: 'price',
          lineId: line.lineId,
          name: line.name,
          from: line.unitPrice,
          to: item.price,
        });
      }
    }

    if (changes.length) {
      throw new ApiError('conflict', changes);
    }

    const subtotal = subtotalOf(lines);
    const appliedDiscount = Math.min(discount, subtotal);
    const order = {
      id: crypto.randomUUID(),
      number: 1041 + orders.length,
      requestKey,
      createdAt: Date.now(),
      lines,
      subtotal,
      discount: appliedDiscount,
      total: subtotal - appliedDiscount,
    };

    write(KEY.orders, [order, ...orders]);

    if (mode === 'lost') {
      throw new ApiError('lost');
    }

    return { order, replayed: false };
  }

  /* ---------- Order status (derived from time, so every tab agrees) ---------- */

  const STATUSES = [
    ['Received', 0],
    ['Preparing', 12],
    ['Ready', 40],
    ['Collected', 70],
  ];

  function statusOf(order, now = Date.now()) {
    const elapsed = (now - order.createdAt) / 1000;
    let index = 0;

    STATUSES.forEach(([, after], i) => {
      if (elapsed >= after) {
        index = i;
      }
    });

    return { index, label: STATUSES[index][0] };
  }

  /* ---------- Formatting ---------- */

  const money = cents => `$${(cents / 100).toFixed(2)}`;

  function parseMoney(value) {
    const normalized = String(value).replace(',', '.').trim();

    if (!/^\d+(\.\d{0,2})?$/.test(normalized)) {
      return null;
    }

    return Math.round(Number(normalized) * 100);
  }

  const escape = value =>
    String(value).replace(
      /[&<>"']/g,
      ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch],
    );

  const time = ts => new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  let toastTimer;

  function toast(message) {
    const el = document.getElementById('toast');
    el.textContent = message;
    el.dataset.open = '';
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => delete el.dataset.open, 3200);
  }

  /* ---------- Connection banner ---------- */

  function mountConnection({ offlineText }) {
    const indicator = document.querySelector('[data-conn-indicator]');
    const banner = document.querySelector('[data-conn-banner]');

    onConnection(state => {
      indicator.dataset.state = state;
      indicator.querySelector('span').textContent = {
        online: 'Live',
        reconnecting: 'Reconnecting',
        offline: 'Offline',
      }[state];
      banner.hidden = state === 'online';
      banner.dataset.state = state;
      banner.textContent =
        state === 'offline' ? offlineText() : 'Reconnecting… Catching up on what changed.';
    });
  }

  /* ---------- Mockup controls ---------- */

  let kitchenTimer;

  function simulateKitchen(enabled) {
    clearInterval(kitchenTimer);

    if (!enabled) {
      return;
    }

    kitchenTimer = setInterval(() => {
      updateMenu(menu => {
        const candidates = menu.items.filter(item => !item.openPrice);
        const item = candidates[Math.floor(Math.random() * candidates.length)];

        if (Math.random() < 0.5) {
          item.available = !item.available;
        } else {
          item.price = Math.max(150, item.price + (Math.random() < 0.5 ? -100 : 150));
        }
      });
    }, 2500);
  }

  function mountLabPanel({ kitchen = false } = {}) {
    const panel = document.createElement('details');
    panel.className = 'lab-panel';
    panel.innerHTML = `
      <summary>Mockup controls</summary>
      <div class="lab-body">
        <label>Connection in this tab
          <div class="segmented" data-lab-conn>
            <button type="button" data-value="online">Online</button>
            <button type="button" data-value="offline">Offline</button>
          </div>
        </label>
        <label>Next checkout
          <select class="field" data-lab-checkout>
            <option value="normal">Goes through</option>
            <option value="error">Server error (500)</option>
            <option value="lost">Saved, response lost</option>
          </select>
        </label>
        ${kitchen ? '<label class="lab-check"><input type="checkbox" data-lab-kitchen> Random menu changes every 2.5 s</label>' : ''}
        <button type="button" class="btn" data-lab-reset>Reset demo data</button>
      </div>`;
    document.body.append(panel);

    panel.querySelector('[data-lab-conn]').addEventListener('click', e => {
      const value = e.target.closest('button')?.dataset.value;

      if (value === 'offline') {
        setConnection('offline');
      } else if (value === 'online' && connection === 'offline') {
        goOnline();
      }
    });

    panel.querySelector('[data-lab-checkout]').addEventListener('change', e => {
      nextCheckout = e.target.value;
    });

    panel
      .querySelector('[data-lab-kitchen]')
      ?.addEventListener('change', e => simulateKitchen(e.target.checked));

    panel.querySelector('[data-lab-reset]').addEventListener('click', () => {
      Object.values(KEY).forEach(key => localStorage.removeItem(key));
      location.reload();
    });

    onConnection(syncLabPanel);
    syncLabPanel();
  }

  function syncLabPanel() {
    document.querySelectorAll('[data-lab-conn] button').forEach(button => {
      button.setAttribute(
        'aria-pressed',
        String(button.dataset.value === (connection === 'offline' ? 'offline' : 'online')),
      );
    });

    const select = document.querySelector('[data-lab-checkout]');

    if (select) {
      select.value = nextCheckout;
    }
  }

  return {
    KEY,
    on,
    getMenu,
    updateMenu,
    getCart,
    saveCart,
    getOrders,
    placeOrder,
    statusOf,
    STATUSES,
    isOnline,
    onConnection,
    money,
    parseMoney,
    escape,
    time,
    toast,
    subtotalOf,
    mountConnection,
    mountLabPanel,
  };
})();
