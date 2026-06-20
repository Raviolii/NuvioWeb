Plugin support
==============

Overview
--------

This project supports plugin sources (simple URL templates) that can generate streams.
Plugins are enabled by default and can be managed from the app Settings or the dedicated plugin screen.

Enable / disable
-----------------

- Enable globally before app bootstrap by setting the runtime env object:

```js
globalThis.__NUVIO_ENV__ = { ENABLE_PLUGINS: true };
```

- Toggle at runtime via the Settings screen: the "Enable Plugins" toggle controls plugin usage.
- You can also persist the preference by calling `localStorage.setItem('pluginsEnabled', JSON.stringify(true))`.

Manage plugin sources
----------------------

- Use the Settings screen -> Plugins -> "Manage from phone" to open the phone-managed plugin UI.
- The Settings screen also lists configured plugin sources with per-source enable/disable and remove controls.
- Plugin sources are stored using the app's local storage and synced via the account sync service when signed in.

Running the plugin runtime tests
--------------------------------

A lightweight Node test harness verifies the `PluginRuntime` and `PluginManager` behavior without adding a test framework.

Run locally:

```bash
npm run test:plugins
```

This runs `scripts/test-plugins.mjs`, which exercises adding/removing sources and toggling plugin flags.

Continuous integration
----------------------

A GitHub Actions workflow is included to run the plugin tests on push and pull requests.

If you want additional test coverage or to migrate to a test framework (Jest/Mocha), I can add that next.
