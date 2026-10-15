const { money, escape } = Lab;
let orders = Lab.getOrders();
let frozenAt = null; // while offline, statuses stay as last received
let lastStatuses = new Map();

function render() {
  const now = frozenAt ?? Date.now();
  const rail = document.getElementById('rail');
  const active = orders.filter(order => Lab.statusOf(order, now).index < 3).length;

  document.getElementById('summary').textContent = orders.length
    ? `${active} in progress, ${orders.length - active} collected`
    : '';

  if (!orders.length) {
    rail.innerHTML = `<p class="empty">No orders yet. <a href="menu.html">Pick something from the menu</a> and it will show up here.</p>`;
    rail.style.display = 'block';

    return;
  }

  rail.style.display = '';
  rail.innerHTML = orders
    .map(order => {
      const status = Lab.statusOf(order, now);
      const changed = lastStatuses.has(order.id) && lastStatuses.get(order.id) !== status.index;
      lastStatuses.set(order.id, status.index);

      return `<article class="ticket" ${status.index === 3 ? 'data-done' : ''} aria-label="Order ${order.number}, ${status.label}">
        <div class="ticket-head">
          <div>
            <span class="ticket-number">#${order.number}</span>
            <span class="ticket-time">Placed ${Lab.time(order.createdAt)}</span>
          </div>
          <span class="stamp" data-status="${status.index}" ${changed ? 'data-fresh' : ''}>${status.label}</span>
        </div>
        <ul class="ticket-lines">
          ${order.lines
            .map(
              line =>
                `<li><span>${line.qty}×</span><span>${escape(line.name)}</span><span>${money(line.unitPrice * line.qty)}</span></li>`,
            )
            .join('')}
        </ul>
        <dl class="ticket-sums">
          ${order.discount ? `<dt>Discount</dt><dd>−${money(order.discount)}</dd>` : ''}
          <dt class="grand">Total</dt><dd class="grand">${money(order.total)}</dd>
        </dl>
        <ol class="progress">
          ${Lab.STATUSES.map(([label], i) => `<li ${i <= status.index ? 'data-reached' : ''}>${label}</li>`).join('')}
        </ol>
      </article>`;
    })
    .join('');
}

Lab.on(Lab.KEY.orders, next => {
  orders = next ?? [];
  render();
});

Lab.onConnection(state => {
  frozenAt = state === 'online' ? null : (frozenAt ?? Date.now());

  if (state === 'online') {
    render();
  }
});

Lab.mountConnection({
  offlineText: () =>
    `You’re offline. Order statuses are as of ${Lab.time(frozenAt ?? Date.now())} and will update once the connection is back.`,
});
Lab.mountLabPanel();

setInterval(render, 1000);
render();
