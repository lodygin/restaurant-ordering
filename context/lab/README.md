# UI mockups

Plain HTML mockups of the three screens, to agree on the target before building the Angular app.
Not part of the build.

```bash
python3 -m http.server 8765 --directory context/lab
```

Open http://127.0.0.1:8765/ and pick a variant. Open menu setup in a second tab to watch menu
changes arrive live.

- `custom/`: own visual design, cherry palette (kitchen-ticket orders page).
- `material/`: Angular Material 3 components and tokens, close to what the real app gets from
  `mat.theme()` with the azure palette.
- `shared/`: behaviour used by both. `lab.js` is a fake server on `localStorage`; tabs sync through
  the `storage` event, standing in for socket.io. `menu.js`, `orders.js`, `admin.js` drive the
  pages by element ids, so a variant only changes markup and styles.

The "Mockup controls" panel switches the tab offline, makes the next checkout fail with a 500 or
lose its response after saving, and turns on random menu changes.
