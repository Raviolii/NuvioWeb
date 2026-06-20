// ProviderRunner: fetches provider JS and executes it in a controlled sandbox
import { safeApiCall } from "../network/safeApiCall.js";

function cheerioShim() {
  function load(html) {
    const parser = typeof DOMParser !== 'undefined' ? new DOMParser() : null;
    const doc = parser ? parser.parseFromString(String(html || ''), 'text/html') : null;

    function $(selector) {
      if (!doc) return { length: 0, toArray: () => [], attr: () => null, text: () => '', find: () => $(null), html: () => null };
      const nodes = selector ? Array.from(doc.querySelectorAll(selector)) : [];
      const wrap = (el) => ({
        el,
        attr(name) { return el ? el.getAttribute(name) : null; },
        text() { return el ? el.textContent || '' : ''; },
        html() { return el ? el.innerHTML : ''; },
        find(sel) { return load((el && el.innerHTML) || '').find(sel); },
        toArray() { return nodes; }
      });
      const arr = nodes.map(wrap);
      arr.length = nodes.length;
      arr.toArray = () => nodes;
      arr.attr = function (name) { return nodes[0] ? nodes[0].getAttribute(name) : null; };
      arr.text = function () { return nodes.map((n) => n.textContent || '').join(''); };
      arr.find = function (sel) { return $(sel); };
      arr.html = function () { return nodes[0] ? nodes[0].innerHTML : null; };
      return arr;
    }
    return $;
  }
  return load;
}

async function fetchText(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Fetch failed ${res.status}`);
  return res.text();
}

export async function runProviderScript(scriptUrl, params = {}) {
  try {
    const code = await fetchText(scriptUrl);

    const module = { exports: {} };
    const exports = module.exports;

    const require = (name) => {
      if (String(name || '').includes('cheerio')) return cheerioShim();
      return {};
    };

    const sandboxFunc = new Function('require', 'module', 'exports', 'fetch', 'console', 'DOMParser', code + '\nreturn module.exports;');
    const exported = sandboxFunc(require, module, exports, fetch, console, typeof DOMParser !== 'undefined' ? DOMParser : undefined) || module.exports;

    // exported may be a function or object { getStreams }
    const runner = typeof exported === 'function' ? exported : exported.getStreams || exported;
    if (typeof runner !== 'function') {
      throw new Error('Provider script did not export a runnable function');
    }

    const result = await Promise.resolve(runner(params.tmdbId, params.mediaType, params.season, params.episode));
    return Array.isArray(result) ? result : [];
  } catch (e) {
    console.warn('ProviderRunner error', e);
    return [];
  }
}

export default { runProviderScript };
