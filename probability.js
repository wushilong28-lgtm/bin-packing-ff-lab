(() => {
  "use strict";

  const functions = {
    exp: { arity: 1, apply: Math.exp },
    log: { arity: 1, apply: Math.log },
    sqrt: { arity: 1, apply: Math.sqrt },
    abs: { arity: 1, apply: Math.abs },
    min: { arity: 2, apply: Math.min },
    max: { arity: 2, apply: Math.max },
    clamp: { arity: 3, apply: (value, low, high) => Math.min(high, Math.max(low, value)) },
    step: { arity: 1, apply: (value) => value >= 0 ? 1 : 0 },
  };

  function tokenize(source) {
    if (typeof source !== "string" || !source.trim() || source.length > 180) {
      throw new Error("Enter a probability expression of at most 180 characters.");
    }
    const tokens = [];
    let position = 0;
    while (position < source.length) {
      if (/\s/.test(source[position])) { position += 1; continue; }
      const remaining = source.slice(position);
      const number = /^(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?/.exec(remaining);
      if (number) {
        tokens.push({ kind: "number", value: Number(number[0]) });
        position += number[0].length;
      } else {
        const identifier = /^[A-Za-z][A-Za-z0-9_]*/.exec(remaining);
        if (identifier) {
          tokens.push({ kind: "identifier", value: identifier[0].toLowerCase() });
          position += identifier[0].length;
        } else if ("+-*/^(),".includes(source[position])) {
          tokens.push({ kind: source[position], value: source[position] });
          position += 1;
        } else {
          throw new Error(`Unsupported character in expression: ${source[position]}`);
        }
      }
      if (tokens.length > 120) throw new Error("Expression is too complex. Simplify it and try again.");
    }
    return tokens;
  }

  function compileProbabilityExpression(source) {
    const tokens = tokenize(source);
    let cursor = 0;
    const current = () => tokens[cursor];
    const take = (kind) => {
      if (current()?.kind === kind) { cursor += 1; return true; }
      return false;
    };
    const expect = (kind) => {
      if (!take(kind)) throw new Error(`Expression syntax error: expected "${kind}".`);
    };

    function expression() {
      let left = term();
      while (current()?.kind === "+" || current()?.kind === "-") {
        const operator = tokens[cursor++].kind;
        const right = term();
        const previous = left;
        left = operator === "+" ? (z) => previous(z) + right(z) : (z) => previous(z) - right(z);
      }
      return left;
    }
    function term() {
      let left = unary();
      while (current()?.kind === "*" || current()?.kind === "/") {
        const operator = tokens[cursor++].kind;
        const right = unary();
        const previous = left;
        left = operator === "*" ? (z) => previous(z) * right(z) : (z) => previous(z) / right(z);
      }
      return left;
    }
    function unary() {
      if (take("+")) return unary();
      if (take("-")) { const value = unary(); return (z) => -value(z); }
      return power();
    }
    function power() {
      const base = primary();
      if (take("^")) { const exponent = unary(); return (z) => Math.pow(base(z), exponent(z)); }
      return base;
    }
    function primary() {
      const token = current();
      if (!token) throw new Error("Expression is incomplete.");
      if (take("(")) {
        const value = expression();
        expect(")");
        return value;
      }
      if (token.kind === "number") {
        cursor += 1;
        return () => token.value;
      }
      if (token.kind === "identifier") {
        cursor += 1;
        if (token.value === "z") return (z) => z;
        if (token.value === "pi") return () => Math.PI;
        if (token.value === "e") return () => Math.E;
        const selected = functions[token.value];
        if (!selected) throw new Error(`Unsupported variable or function: ${token.value}`);
        expect("(");
        const args = [];
        if (current()?.kind !== ")") {
          args.push(expression());
          while (take(",")) args.push(expression());
        }
        expect(")");
        if (args.length !== selected.arity) throw new Error(`${token.value}() requires ${selected.arity} arguments.`);
        if (selected.arity === 1) return (z) => selected.apply(args[0](z));
        if (selected.arity === 2) return (z) => selected.apply(args[0](z), args[1](z));
        return (z) => selected.apply(args[0](z), args[1](z), args[2](z));
      }
      throw new Error("Expression syntax error. Check operators and parentheses.");
    }

    const evaluator = expression();
    if (cursor !== tokens.length) throw new Error("Unexpected text at the end of the expression. Check parentheses and operators.");
    for (let i = 0; i <= 200; i += 1) {
      const value = evaluator(i / 200);
      if (!Number.isFinite(value) || value < -1e-9 || value > 1 + 1e-9) {
        throw new Error("g(z) must return a finite value between 0 and 1 throughout [0, 1].");
      }
    }
    return (z) => {
      const value = evaluator(z);
      if (!Number.isFinite(value) || value < -1e-9 || value > 1 + 1e-9) {
        throw new Error("g(z) is not a valid probability for some perceived sizes. Edit the expression.");
      }
      return Math.min(1, Math.max(0, value));
    };
  }

  window.compileProbabilityExpression = compileProbabilityExpression;
})();
