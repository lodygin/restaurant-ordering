const { money, escape } = Lab;
const $ = id => document.getElementById(id);
let menu = Lab.getMenu();
let selected = menu.categories[0]?.id;

function render(changedIds = new Set()) {
  if (!menu.categories.some(category => category.id === selected)) {
    selected = menu.categories[0]?.id;
  }

  // Keep focus and caret across re-renders triggered by other tabs.
  const focused = document.activeElement?.dataset?.key;
  const caret = document.activeElement?.selectionStart;

  $('categories').innerHTML = menu.categories
    .map(category => {
      const count = menu.items.filter(item => item.categoryId === category.id).length;

      return `<li><button type="button" data-category="${category.id}" aria-current="${category.id === selected}">
        ${escape(category.name)} <small>${count}</small></button></li>`;
    })
    .join('');

  const category = menu.categories.find(candidate => candidate.id === selected);
  const items = menu.items.filter(item => item.categoryId === selected);

  $('category-name').value = category?.name ?? '';
  $('category-name').dataset.key = 'category-name';
  $('items-empty').hidden = items.length > 0;
  $('items').innerHTML = items
    .map(
      item => `<tr data-id="${item.id}" class="${changedIds.has(item.id) ? 'changed' : ''}">
        <td><input class="field" data-key="${item.id}:name" data-field="name" value="${escape(item.name)}" aria-label="Item name" /></td>
        <td class="col-price"><span class="money-field"><input class="field" data-key="${item.id}:price" data-field="price"
          inputmode="decimal" value="${item.openPrice ? '' : (item.price / 100).toFixed(2)}"
          placeholder="${item.openPrice ? 'At order' : ''}" ${item.openPrice ? 'disabled' : ''} aria-label="Price of ${escape(item.name)}" /></span></td>
        <td class="col-toggle"><label class="switch"><input type="checkbox" data-key="${item.id}:available" data-field="available"
          ${item.available ? 'checked' : ''} aria-label="${escape(item.name)} is available" /><span></span></label></td>
        <td class="col-toggle"><input type="checkbox" data-key="${item.id}:openPrice" data-field="openPrice"
          ${item.openPrice ? 'checked' : ''} aria-label="${escape(item.name)} has an open price" /></td>
        <td class="col-remove"><button class="btn btn-quiet" type="button" data-remove="${item.id}">Remove</button></td>
      </tr>`,
    )
    .join('');

  $('revision').textContent =
    `Menu revision ${menu.revision}. Open the menu in another tab to watch changes arrive.`;

  if (focused) {
    const el = document.querySelector(`[data-key="${CSS.escape(focused)}"]`);
    el?.focus();

    if (el && caret != null && el.setSelectionRange) {
      el.setSelectionRange(caret, caret);
    }
  }
}

function save(mutate, message) {
  menu = Lab.updateMenu(mutate);
  render();

  if (message) {
    Lab.toast(message);
  }
}

$('categories').addEventListener('click', e => {
  const button = e.target.closest('[data-category]');

  if (button) {
    selected = button.dataset.category;
    render();
  }
});

$('add-category').addEventListener('submit', e => {
  e.preventDefault();
  const name = e.target.name.value.trim();

  if (!name) {
    return;
  }

  const id = `c${Date.now()}`;
  save(m => m.categories.push({ id, name }), `${name} added`);
  selected = id;
  e.target.reset();
  render();
});

$('category-name').addEventListener('change', e => {
  const name = e.target.value.trim();

  if (!name) {
    render();
    Lab.toast('A category needs a name');

    return;
  }

  save(
    m => (m.categories.find(category => category.id === selected).name = name),
    'Category renamed',
  );
});

$('delete-category').addEventListener('click', () => {
  const category = menu.categories.find(candidate => candidate.id === selected);
  const count = menu.items.filter(item => item.categoryId === selected).length;

  if (
    count &&
    !confirm(
      `Delete ${category.name} and its ${count} items? They disappear from the menu right away.`,
    )
  ) {
    return;
  }

  save(m => {
    m.categories = m.categories.filter(candidate => candidate.id !== selected);
    m.items = m.items.filter(item => item.categoryId !== selected);
  }, `${category.name} deleted`);
});

$('add-item').addEventListener('click', () => {
  const id = `i${Date.now()}`;
  save(m =>
    m.items.unshift({
      id,
      categoryId: selected,
      name: 'New item',
      description: '',
      price: 1000,
      available: false,
      openPrice: false,
    }),
  );
  const input = document.querySelector(`[data-key="${id}:name"]`);
  input.focus();
  input.select();
  Lab.toast('New items start as unavailable, switch them on when ready');
});

$('items').addEventListener('change', e => {
  const id = e.target.closest('tr').dataset.id;
  const field = e.target.dataset.field;
  const item = menu.items.find(candidate => candidate.id === id);

  if (field === 'name') {
    const name = e.target.value.trim();

    if (!name) {
      render();
      Lab.toast('An item needs a name');

      return;
    }

    save(m => (m.items.find(candidate => candidate.id === id).name = name), 'Saved');
  } else if (field === 'price') {
    const price = Lab.parseMoney(e.target.value);

    if (!price) {
      render();
      Lab.toast('Enter a price above zero, like 12.50');

      return;
    }

    save(
      m => (m.items.find(candidate => candidate.id === id).price = price),
      `${item.name} is now ${money(price)}`,
    );
  } else if (field === 'available') {
    save(
      m => (m.items.find(candidate => candidate.id === id).available = e.target.checked),
      `${item.name} is ${e.target.checked ? 'back on' : 'off'} the menu`,
    );
  } else if (field === 'openPrice') {
    save(
      m => {
        const target = m.items.find(candidate => candidate.id === id);
        target.openPrice = e.target.checked;
        target.price = e.target.checked ? null : 1000;
      },
      e.target.checked
        ? `${item.name}: price is now entered when ordering`
        : `${item.name}: fixed price $10.00, adjust it if needed`,
    );
  }
});

$('items').addEventListener('click', e => {
  const id = e.target.closest('[data-remove]')?.dataset.remove;

  if (id) {
    const item = menu.items.find(candidate => candidate.id === id);
    save(m => (m.items = m.items.filter(candidate => candidate.id !== id)), `${item.name} removed`);
  }
});

// Another admin tab (or the kitchen simulation) changed the menu.
Lab.on(Lab.KEY.menu, next => {
  if (!Lab.isOnline() || next.revision === menu.revision) {
    return;
  }

  const changed = new Set(
    next.items
      .filter(
        item => JSON.stringify(item) !== JSON.stringify(menu.items.find(old => old.id === item.id)),
      )
      .map(item => item.id),
  );
  menu = next;
  render(changed);
});

Lab.onConnection(state => {
  document.querySelectorAll('main input, main button').forEach(el => {
    el.disabled = state !== 'online';
  });

  // Re-render restores per-row state, e.g. the price field stays disabled for open-price items.
  if (state === 'online') {
    menu = Lab.getMenu();
    render();
  }
});

Lab.mountConnection({
  offlineText: () =>
    'You’re offline. Editing is paused so changes aren’t lost; it resumes when the connection is back.',
});
Lab.mountLabPanel({ kitchen: true });
render();
