/*
 * Tiny DOM builder. All text goes through textContent (never innerHTML), so worker
 * names and pasted certificate text cannot inject markup.
 */
(function (root) {
  'use strict';
  var SA = root.SA = root.SA || {};

  function append(el, child) {
    if (child === null || child === undefined || child === false) return;
    if (Array.isArray(child)) { child.forEach(function (c) { append(el, c); }); return; }
    el.appendChild(typeof child === 'object' ? child : document.createTextNode(String(child)));
  }

  /**
   * h('button', {class: 'btn', onClick: fn, 'aria-label': 'x'}, 'Label', childNode)
   */
  function h(tag, props) {
    var el = document.createElement(tag);
    if (props) {
      Object.keys(props).forEach(function (key) {
        var v = props[key];
        if (v === null || v === undefined || v === false) return;
        if (key === 'class') el.className = v;
        else if (key === 'text') el.textContent = v;
        else if (key.slice(0, 2) === 'on' && typeof v === 'function') el.addEventListener(key.slice(2).toLowerCase(), v);
        else if (key === 'value') el.value = v;
        else el.setAttribute(key, v === true ? '' : String(v));
      });
    }
    for (var i = 2; i < arguments.length; i++) append(el, arguments[i]);
    return el;
  }

  SA.dom = { h: h };
})(typeof globalThis !== 'undefined' ? globalThis : window);
