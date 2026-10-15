const { money, escape } = Lab;

let menu = Lab.getMenu();
let pendingMenu = null;
let cart = Lab.getCart();
let query = '';
let requestKey = null;
let placing = false;
let openPriceItem = null;

const $ = id => document.getElementById(id);
const list = $('menu-list');

/* ---------- Menu list ---------- */

const itemById = (source, id) => source.items.find(item => item.id === id);
const qtyInCart = itemId =>
  cart.lines.filter(line => line.itemId === itemId).reduce((sum, line) => sum + line.qty, 0);

function rowHtml(item) {
  const qty = qtyInCart(item.id);
  let price = `<span class="row-price">${money(item.price)}</span>`;
  let action;

  if (item.openPrice) {
    price = '<span class="row-price open">Price set when ordering</span>';
  }

  if (!item.available) {
    action = '<button class="btn" type="button" disabled>Sold out</button>';
  } else if (item.openPrice) {
    action = `<button class="btn" type="button" data-open-price="${item.id}">Add…</button>`;
  } else if (qty > 0) {
    action = `<span class="stepper" aria-label="Quantity of ${escape(item.name)}">
        <button type="button" data-dec="${item.id}" aria-label="Remove one">−</button>
        <output>${qty}</output>
        <button type="button" data-inc="${item.id}" aria-label="Add one">+</button>
      </span>`;
  } else {
    action = `<button class="btn" type="button" data-inc="${item.id}">Add</button>`;
  }

  return `<li class="row" data-id="${item.id}" ${item.available ? '' : 'data-soldout'}>
      <div class="row-main">
        <span class="row-name">${escape(item.name)}</span>
        ${item.description ? `<span class="row-desc">${escape(item.description)}</span>` : ''}
      </div>
      ${price}
      <div class="row-action">${action}</div>
    </li>`;
}

function renderMenu() {
  const needle = query.trim().toLowerCase();
  const sections = [];
  const shown = [];

  for (const category of menu.categories) {
    const items = menu.items.filter(
      item =>
        item.categoryId === category.id && (!needle || item.name.toLowerCase().includes(needle)),
    );

    // Empty categories (or ones the search filtered out) get neither a section nor a chip.
    if (items.length) {
      shown.push(category);
      sections.push(`<section class="cat" id="cat-${category.id}" data-category="${category.id}">
          <h2>${escape(category.name)} <small>${items.length}</small></h2>
          <ul class="rows">${items.map(rowHtml).join('')}</ul>
        </section>`);
    }
  }

  list.innerHTML =
    sections.join('') ||
    `<p class="empty-search">${
      needle ? `No dishes match “${escape(query)}”.` : 'The menu is empty right now.'
    }</p>`;
  $('search').placeholder = `Search ${menu.items.length} dishes`;
  $('chips').innerHTML = shown
    .map(
      category =>
        `<a href="#cat-${category.id}" data-chip="${category.id}">${escape(category.name)}</a>`,
    )
    .join('');
  observeSections();
  updateChipFades();
}

/* Fade the chip strip only on the side that still has chips to scroll to. */
function updateChipFades() {
  const strip = $('chips');
  const max = strip.scrollWidth - strip.clientWidth;
  strip.toggleAttribute('data-fade-start', strip.scrollLeft > 1);
  strip.toggleAttribute('data-fade-end', strip.scrollLeft < max - 1);
}

$('chips').addEventListener('scroll', updateChipFades, { passive: true });
window.addEventListener('resize', updateChipFades);

function patchRow(item, flash) {
  const row = list.querySelector(`[data-id="${item.id}"]`);

  if (!row) {
    return;
  }

  row.outerHTML = rowHtml(item);

  if (flash) {
    list.querySelector(`[data-id="${item.id}"]`).classList.add('changed');
  }
}

/* Applies a new menu revision: patches changed rows in place, re-renders on structural changes. */
function applyMenu(next) {
  const structural =
    next.categories.length !== menu.categories.length ||
    next.items.length !== menu.items.length ||
    next.categories.some(
      (category, i) =>
        category.id !== menu.categories[i]?.id || category.name !== menu.categories[i]?.name,
    );
  let changed = 0;

  if (structural) {
    menu = next;
    renderMenu();
    renderCart();

    return 1;
  }

  for (const item of next.items) {
    const before = itemById(menu, item.id);

    if (JSON.stringify(before) !== JSON.stringify(item)) {
      changed += 1;
      menu = { ...menu, items: menu.items.map(old => (old.id === item.id ? item : old)) };
      patchRow(item, true);
    }
  }

  menu = next;
  renderCart();

  return changed;
}

/* The active chip is the last category whose heading has scrolled under the sticky tools. */
function observeSections() {
  const sections = [...list.querySelectorAll('.cat')];
  let current = sections[0];

  for (const section of sections) {
    if (section.getBoundingClientRect().top <= 180) {
      current = section;
    }
  }

  document.querySelectorAll('[data-chip]').forEach(chip => {
    const active = chip.dataset.chip === current?.dataset.category;
    chip.setAttribute('aria-current', String(active));

    // Scroll only the chip strip: scrollIntoView would also move the page under a sticky header.
    if (active) {
      const strip = chip.parentElement;
      strip.scrollLeft = chip.offsetLeft - strip.offsetLeft - 24;
      updateChipFades();
    }
  });
}

let scrollFrame;
const scheduleChipSync = () => {
  cancelAnimationFrame(scrollFrame);
  scrollFrame = requestAnimationFrame(observeSections);
};
window.addEventListener('scroll', scheduleChipSync);
window.addEventListener('hashchange', scheduleChipSync);
window.addEventListener('load', () => setTimeout(scheduleChipSync, 50)); // after the browser scrolls to #hash

/* ---------- Cart ---------- */

function saveCart(next) {
  cart = next;
  requestKey = null; // a different payload is a different request
  Lab.saveCart(cart);
  renderCart();
}

function addItem(item, qty = 1, unitPrice = item.price) {
  const lineId = item.openPrice ? `${item.id}@${unitPrice}` : item.id;
  const existing = cart.lines.find(line => line.lineId === lineId);
  const lines = existing
    ? cart.lines.map(line => (line.lineId === lineId ? { ...line, qty: line.qty + qty } : line))
    : [
        ...cart.lines,
        { lineId, itemId: item.id, name: item.name, unitPrice, qty, openPrice: item.openPrice },
      ];

  saveCart({ ...cart, lines });
  patchRow(item, false);
}

function changeQty(lineId, delta) {
  const lines = cart.lines
    .map(line => (line.lineId === lineId ? { ...line, qty: line.qty + delta } : line))
    .filter(line => line.qty > 0);
  const itemId = cart.lines.find(line => line.lineId === lineId)?.itemId;

  saveCart({ ...cart, lines });

  if (itemId) {
    patchRow(itemById(menu, itemId), false);
  }
}

function lineWarning(line) {
  const item = itemById(menu, line.itemId);

  if (!item || !item.available) {
    return '<span class="line-warning gone">No longer available. It will be removed when you place the order.</span>';
  }

  if (item.openPrice && !line.openPrice) {
    return '<span class="line-warning gone">Now priced when ordering. It will be removed; add it again with a price.</span>';
  }

  if (!item.openPrice && line.openPrice) {
    return `<span class="line-warning">Now has a fixed price of ${money(item.price)} instead of the price you entered. You’ll confirm it before the order is placed.</span>`;
  }

  if (!line.openPrice && item.price !== line.unitPrice) {
    return `<span class="line-warning">Price changed to ${money(item.price)}. You’ll confirm it before the order is placed.</span>`;
  }

  return '';
}

function renderCart() {
  const subtotal = Lab.subtotalOf(cart.lines);
  const applied = Math.min(cart.discount, subtotal);
  const count = cart.lines.reduce((sum, line) => sum + line.qty, 0);
  const empty = cart.lines.length === 0;

  $('cart-lines').innerHTML = cart.lines
    .map(
      line => `<li class="line">
        <div>
          <div class="line-name">${escape(line.name)}</div>
          <div class="line-unit">${money(line.unitPrice)} each${line.openPrice ? ', price you entered' : ''}</div>
        </div>
        <div class="line-total">${money(line.unitPrice * line.qty)}</div>
        ${lineWarning(line)}
        <div class="line-controls">
          <span class="stepper">
            <button type="button" data-line-dec="${escape(line.lineId)}" aria-label="Remove one">−</button>
            <output>${line.qty}</output>
            <button type="button" data-line-inc="${escape(line.lineId)}" aria-label="Add one">+</button>
          </span>
          <button class="btn btn-quiet" type="button" data-line-remove="${escape(line.lineId)}">Remove</button>
        </div>
      </li>`,
    )
    .join('');

  $('cart-empty').hidden = !empty;
  $('cart-foot').hidden = empty;
  $('subtotal').textContent = money(subtotal);
  $('discount-applied').textContent = applied ? `−${money(applied)}` : money(0);
  $('total').textContent = money(subtotal - applied);
  $('cart-bar-text').textContent = empty
    ? 'Your order is empty'
    : `${count} ${count === 1 ? 'item' : 'items'}, ${money(subtotal - applied)}`;

  if (document.activeElement !== $('discount')) {
    $('discount').value = cart.discount ? (cart.discount / 100).toFixed(2) : '';
  }

  const hint = $('discount-hint');
  hint.classList.remove('error');
  hint.hidden = !(cart.discount > subtotal && subtotal > 0);
  hint.textContent = `Discount is capped at the order total, ${money(subtotal)}.`;

  const button = $('place-order');
  button.disabled = placing || !Lab.isOnline();
  button.textContent = placing ? 'Placing order…' : `Place order, ${money(subtotal - applied)}`;

  if (!Lab.isOnline() && !placing) {
    showNotice(
      'info',
      'You’re offline. Your order is kept here, place it once you’re back online.',
    );
  } else if ($('checkout-notice').dataset.kind === 'offline') {
    hideNotice();
  }
}

function showNotice(kind, html) {
  const notice = $('checkout-notice');
  notice.className = `notice ${kind === 'error' ? 'error' : 'info'}`;
  notice.dataset.kind = kind === 'info' && !Lab.isOnline() ? 'offline' : kind;
  notice.innerHTML = html;
  notice.hidden = false;
}

function hideNotice() {
  $('checkout-notice').hidden = true;
  $('checkout-notice').dataset.kind = '';
}

/* ---------- Checkout ---------- */

async function placeOrder() {
  if (placing || cart.lines.length === 0) {
    return; // second click while the request is in flight does nothing
  }

  placing = true;
  requestKey ??= crypto.randomUUID();
  hideNotice();
  $('placed').hidden = true;
  renderCart();

  try {
    await submit();
  } finally {
    placing = false;
    renderCart();
  }
}

async function submit(isRetry = false) {
  try {
    const { order, replayed } = await Lab.placeOrder({
      requestKey,
      lines: cart.lines,
      discount: cart.discount,
    });
    hideNotice();
    const placed = $('placed');
    placed.innerHTML = `Order #${order.number} is in. ${
      replayed ? 'It had already gone through, so nothing was placed twice. ' : ''
    }<a href="orders.html">Follow it on the Orders page</a>.`;
    placed.hidden = false;
    saveCart({ lines: [], discount: 0 });
    renderMenu();
  } catch (error) {
    switch (error.code) {
      case 'conflict':
        applyConflict(error.details);
        break;
      case 'lost':
        if (!isRetry) {
          showNotice(
            'info',
            'The connection dropped before the kitchen confirmed. Checking whether your order went through…',
          );
          await new Promise(resolve => setTimeout(resolve, 1200));
          await submit(true); // same request key: the server returns the order it already has
        }
        break;
      case 'offline':
        showNotice(
          'error',
          'You went offline before the order was sent. Nothing was placed, try again once you’re back online.',
        );
        break;
      default:
        showNotice(
          'error',
          'The kitchen couldn’t accept the order because of a server error. Nothing was placed, try again.',
        );
    }
  }
}

const CHANGE_TEXT = {
  unavailable: () => 'No longer available, removed from your order.',
  'now-open': () => 'Now priced when ordering, removed from your order. Add it again with a price.',
  'now-fixed': change =>
    `Now has a fixed price of ${money(change.to)} instead of the ${money(change.from)} you entered.`,
  price: change => `Price changed from ${money(change.from)} to ${money(change.to)}.`,
};

function applyConflict(changes) {
  const byLine = new Map(changes.map(change => [change.lineId, change]));
  const lines = [];

  for (const line of cart.lines) {
    const change = byLine.get(line.lineId);

    if (change?.type === 'unavailable' || change?.type === 'now-open') {
      continue;
    }

    // An open-price line that became fixed joins the item's regular line, if there is one.
    const next =
      change?.type === 'now-fixed'
        ? { ...line, lineId: line.itemId, unitPrice: change.to, openPrice: false }
        : change?.type === 'price'
          ? { ...line, unitPrice: change.to }
          : line;
    const existing = lines.find(candidate => candidate.lineId === next.lineId);

    if (existing) {
      existing.qty += next.qty;
    } else {
      lines.push({ ...next });
    }
  }

  menu = Lab.getMenu();
  saveCart({ ...cart, lines });
  renderMenu();

  $('changes-list').innerHTML = changes
    .map(
      change =>
        `<li class="${['unavailable', 'now-open'].includes(change.type) ? 'gone' : ''}">
          <strong>${escape(change.name)}</strong>${CHANGE_TEXT[change.type](change)}</li>`,
    )
    .join('');
  $('changes-confirm').hidden = lines.length === 0;
  $('changes-dialog').showModal();
}

/* ---------- Events ---------- */

list.addEventListener('click', e => {
  const button = e.target.closest('button');

  if (!button) {
    return;
  }

  if (button.dataset.inc) {
    addItem(itemById(menu, button.dataset.inc));
  } else if (button.dataset.dec) {
    changeQty(button.dataset.dec, -1);
  } else if (button.dataset.openPrice) {
    openPriceDialog(itemById(menu, button.dataset.openPrice));
  }
});

$('cart-lines').addEventListener('click', e => {
  const button = e.target.closest('button');

  if (!button) {
    return;
  }

  if (button.dataset.lineInc) {
    changeQty(button.dataset.lineInc, 1);
  } else if (button.dataset.lineDec) {
    changeQty(button.dataset.lineDec, -1);
  } else if (button.dataset.lineRemove) {
    const line = cart.lines.find(candidate => candidate.lineId === button.dataset.lineRemove);
    changeQty(line.lineId, -line.qty);
  }
});

$('discount').addEventListener('change', e => {
  const value = e.target.value.trim();
  const cents = value === '' ? 0 : Lab.parseMoney(value);

  if (cents === null) {
    const hint = $('discount-hint');
    hint.textContent = 'Enter an amount like 5 or 5.50.';
    hint.classList.add('error');
    hint.hidden = false;

    return;
  }

  saveCart({ ...cart, discount: cents });
});

$('place-order').addEventListener('click', placeOrder);
$('changes-review').addEventListener('click', () => $('changes-dialog').close());
$('changes-confirm').addEventListener('click', () => {
  $('changes-dialog').close();
  placeOrder();
});

$('search').addEventListener('input', e => {
  query = e.target.value;
  renderMenu();
});

/*
 * Open-price items: the price is entered when the item is added.
 * The dialog follows the live menu while it is open: if the item stops being open-price or
 * sells out, it says so and offers what is still possible instead of adding a stale line.
 */
function openPriceDialog(item) {
  openPriceItem = item.id;
  $('price-title').textContent = item.name;
  $('price-desc').textContent = item.description;
  $('price-input').value = '';
  $('qty-input').value = '1';
  $('price-error').hidden = true;
  syncPriceDialog();
  $('price-dialog').showModal();
}

function syncPriceDialog() {
  const item = itemById(menu, openPriceItem);
  const notice = $('price-notice');
  const submit = $('price-submit');

  if (!item || !item.available) {
    notice.textContent = 'This item is no longer available.';
    notice.className = 'notice error';
    notice.hidden = false;
    $('price-field').hidden = true;
    submit.disabled = true;
    submit.textContent = 'Add to order';
  } else if (!item.openPrice) {
    notice.textContent = `This item now has a fixed price of ${money(item.price)}.`;
    notice.className = 'notice info';
    notice.hidden = false;
    $('price-field').hidden = true;
    submit.disabled = false;
    submit.textContent = `Add at ${money(item.price)}`;
  } else {
    notice.hidden = true;
    $('price-field').hidden = false;
    submit.disabled = false;
    submit.textContent = 'Add to order';
  }

  $('price-input').required = Boolean(item?.openPrice);
}

$('price-form').addEventListener('submit', e => {
  if (e.submitter?.value !== 'add') {
    return;
  }

  const item = itemById(menu, openPriceItem); // always the live item, never the one we opened with
  const qty = Number($('qty-input').value);
  const price = item?.openPrice ? Lab.parseMoney($('price-input').value) : item?.price;

  if (!item || !item.available) {
    e.preventDefault();

    return;
  }

  if (!price || price <= 0 || !Number.isInteger(qty) || qty < 1) {
    e.preventDefault();
    $('price-error').textContent = item.openPrice
      ? 'Enter a price above zero and a quantity of at least 1.'
      : 'Enter a quantity of at least 1.';
    $('price-error').hidden = false;

    return;
  }

  addItem(item, qty, price);
  Lab.toast(`${item.name} added at ${money(price)}`);
});

/* ---------- Live updates ---------- */

Lab.on(Lab.KEY.menu, next => {
  if (Lab.isOnline()) {
    applyMenu(next);

    if ($('price-dialog').open) {
      syncPriceDialog();
    }
  } else {
    pendingMenu = next; // the socket is down: changes are fetched on reconnect
  }
});

Lab.on(Lab.KEY.cart, next => {
  cart = next;
  renderCart();
});

Lab.onConnection(state => {
  if (state === 'online' && pendingMenu) {
    const changed = applyMenu(pendingMenu);
    pendingMenu = null;
    Lab.toast(changed ? `Back online. The menu changed while you were away.` : 'Back online.');
  }

  if (state === 'online' && $('price-dialog').open) {
    syncPriceDialog();
  }

  renderCart();
});

Lab.mountConnection({
  offlineText: () =>
    'You’re offline. Showing the menu as it was when the connection dropped; changes will appear once it’s back.',
});
Lab.mountLabPanel({ kitchen: true });

renderMenu();
renderCart();
