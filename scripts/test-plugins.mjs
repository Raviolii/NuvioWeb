// Minimal test harness for plugin runtime/manager
globalThis.__NUVIO_ENV__ = globalThis.__NUVIO_ENV__ || {};

// Simple localStorage polyfill for Node
if (typeof globalThis.localStorage === "undefined") {
  const store = new Map();
  globalThis.localStorage = {
    getItem(key) {
      return store.has(key) ? store.get(key) : null;
    },
    setItem(key, value) {
      store.set(key, String(value));
    },
    removeItem(key) {
      store.delete(key);
    },
    clear() {
      store.clear();
    }
  };
}

console.log('localStorage proto:', typeof globalThis.localStorage, Object.keys(globalThis.localStorage || {}));

try {
  const LocalStoreModule = await import("../js/core/storage/localStore.js");
  // Override LocalStore methods with an in-memory implementation for Node tests
  const inMemory = new Map();
  if (LocalStoreModule && LocalStoreModule.LocalStore) {
    LocalStoreModule.LocalStore.get = (key, defaultValue = null) => {
      try {
        const v = inMemory.has(key) ? inMemory.get(key) : null;
        return v !== null ? JSON.parse(v) : defaultValue;
      } catch (e) {
        return defaultValue;
      }
    };
    LocalStoreModule.LocalStore.set = (key, value) => {
      try {
        inMemory.set(key, JSON.stringify(value));
      } catch (e) {
        // ignore
      }
    };
    LocalStoreModule.LocalStore.remove = (key) => inMemory.delete(key);
    LocalStoreModule.LocalStore.clear = () => inMemory.clear();
  }

  const { PluginRuntime } = await import("../js/core/player/pluginRuntime.js");
  const { PluginManager } = await import("../js/core/player/pluginManager.js");
  const { ENABLE_PLUGINS } = await import("../js/config.js");

  console.log("ENABLE_PLUGINS (from config):", ENABLE_PLUGINS);

  // start clean
  PluginRuntime.saveSources([]);
  if (LocalStoreModule && LocalStoreModule.LocalStore && typeof LocalStoreModule.LocalStore.remove === "function") {
    LocalStoreModule.LocalStore.remove('pluginsEnabled');
  }

  // Default pluginsEnabled should reflect config default
  console.log("PluginManager.pluginsEnabled (default):", PluginManager.pluginsEnabled);

  // Add a source and verify
  const src = { id: "test_src_1", name: "Test Source", urlTemplate: "https://example.com/{tmdbId}", enabled: true };
  PluginRuntime.addSource(src);
  let sources = PluginRuntime.listSources();
  if (!sources.length || sources[0].id !== src.id) throw new Error("Source add failed");

  // Toggle source
  PluginManager.setPluginSourceEnabled(src.id, false);
  sources = PluginRuntime.listSources();
  if (sources[0].enabled !== false) throw new Error("Set source enabled failed");

  // Remove source
  PluginManager.removePluginSource(src.id);
  sources = PluginRuntime.listSources();
  if (sources.length !== 0) throw new Error("Remove source failed");

  // Toggle global pluginsEnabled
  PluginManager.setPluginsEnabled(false);
  if (PluginManager.pluginsEnabled !== false) throw new Error("Global plugins toggle failed");

  PluginManager.setPluginsEnabled(true);
  if (PluginManager.pluginsEnabled !== true) throw new Error("Global plugins toggle restore failed");

  console.log("All plugin runtime tests passed");
  process.exit(0);
} catch (error) {
  console.error("Plugin runtime tests failed:", error);
  process.exit(2);
}
