# UI mockups

Plain HTML mockups of the three screens, to agree on the target before building the Angular app.
Not part of the build.

```bash
python3 -m http.server 8765 --directory context/lab
```

Open http://127.0.0.1:8765/ and pick a variant. Open menu setup in a second tab to watch menu
changes arrive live.

- `custom/`: own visual design, cherry palette, kitchen-ticket orders page. This is the one the app
  follows.
- `material/`: stock Angular Material 3 look, considered and not chosen.
- `shared/`: behaviour used by both. `lab.js` is a fake server on `localStorage`; tabs sync through
  the `storage` event, standing in for the server's live stream (SSE in the real app). `menu.js`,
  `orders.js`, `admin.js` drive the pages by element ids, so a variant only changes markup and
  styles.

The "Mockup controls" panel switches the tab offline, makes the next checkout fail with a 500 or
lose its response after saving, and turns on random menu changes.
