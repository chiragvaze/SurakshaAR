/*
 * Minimal DOM stand-in so screen functions (which only use SA.dom.h) can render in Node
 * without a browser or extra dependencies. Supports exactly what the screens use:
 * createElement/createTextNode, attributes, className, textContent, value, style,
 * appendChild/replaceChildren, addEventListener and click()/dispatch().
 */
'use strict';

class FakeNode {
  constructor(tag, text) {
    this.tagName = tag ? tag.toUpperCase() : '#text';
    this.children = [];
    this.attributes = {};
    this.listeners = {};
    this.style = {};
    this.className = '';
    this.value = '';
    this._text = text === undefined ? null : String(text);
  }
  appendChild(child) { this.children.push(child); return child; }
  replaceChildren(...nodes) { this.children = nodes; }
  setAttribute(name, value) { this.attributes[name] = String(value); if (name === 'id') this.id = String(value); }
  getAttribute(name) { return Object.prototype.hasOwnProperty.call(this.attributes, name) ? this.attributes[name] : null; }
  removeAttribute(name) { delete this.attributes[name]; }
  addEventListener(type, fn) { (this.listeners[type] = this.listeners[type] || []).push(fn); }
  dispatch(type, event) { (this.listeners[type] || []).forEach((fn) => fn(event || { type, preventDefault() {} })); }
  click() { this.dispatch('click'); }
  get textContent() { return this._text !== null ? this._text : this.children.map((c) => c.textContent).join(''); }
  set textContent(v) { this._text = String(v); this.children = []; }
  focus() {}
}

function install() {
  const document = {
    createElement: (tag) => new FakeNode(tag),
    createTextNode: (text) => new FakeNode(null, text),
    createElementNS: (ns, tag) => new FakeNode(tag),
    getElementById: () => null,
    documentElement: { lang: '' }
  };
  globalThis.document = document;
  globalThis.location = globalThis.location || { hash: '' };
  return document;
}

/** Depth-first list of element nodes matching a predicate. */
function findAll(node, pred, out = []) {
  if (node && node.tagName !== '#text') {
    if (pred(node)) out.push(node);
    node.children.forEach((c) => findAll(c, pred, out));
  }
  return out;
}

const byId = (root, id) => findAll(root, (n) => n.getAttribute('id') === id)[0] || null;
const byClass = (root, cls) => findAll(root, (n) => (' ' + n.className + ' ').includes(' ' + cls + ' '));
const byAttr = (root, attr) => findAll(root, (n) => n.getAttribute(attr) !== null);

module.exports = { install, findAll, byId, byClass, byAttr, FakeNode };
