// Polyfill for DOM APIs missing in Node.js
if (typeof globalThis.DOMMatrix === "undefined") {
  (globalThis as any).DOMMatrix = class DOMMatrix {
    constructor() {}
  };
}
if (typeof globalThis.DOMPoint === "undefined") {
  (globalThis as any).DOMPoint = class DOMPoint {
    constructor() {}
  };
}
