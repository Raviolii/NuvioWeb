import { LocalStore } from "../storage/localStore.js";
import { PluginRuntime } from "./pluginRuntime.js";
import { ENABLE_PLUGINS } from "../../config.js";

const PLUGINS_ENABLED_KEY = "pluginsEnabled";

export const PluginManager = {
  get pluginsEnabled() {
    return Boolean(LocalStore.get(PLUGINS_ENABLED_KEY, ENABLE_PLUGINS));
  },

  setPluginsEnabled(enabled) {
    LocalStore.set(PLUGINS_ENABLED_KEY, Boolean(enabled));
  },

  listPluginSources() {
    return PluginRuntime.listSources();
  },

  addPluginSource(source) {
    PluginRuntime.addSource(source);
  },

  removePluginSource(sourceId) {
    PluginRuntime.removeSource(sourceId);
  },

  setPluginSourceEnabled(sourceId, enabled) {
    PluginRuntime.setSourceEnabled(sourceId, enabled);
  },

  async executeScrapersStreaming({ tmdbId, mediaType, season = null, episode = null } = {}) {
    if (!this.pluginsEnabled) {
      return [];
    }
    return PluginRuntime.execute({ tmdbId, mediaType, season, episode });
  }
};
