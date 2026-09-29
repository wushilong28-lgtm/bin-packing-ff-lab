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
        left = operator === "+" ? (a) => previous(a) + right(a) : (a) => previous(a) - right(a);
      }
      return left;
    }
    function term() {
      let left = unary();
      while (current()?.kind === "*" || current()?.kind === "/") {
        const operator = tokens[cursor++].kind;
        const right = unary();
        const previous = left;
        left = operator === "*" ? (a) => previous(a) * right(a) : (a) => previous(a) / right(a);
      }
      return left;
    }
    function unary() {
      if (take("+")) return unary();
      if (take("-")) { const value = unary(); return (a) => -value(a); }
      return power();
    }
    function power() {
      const base = primary();
      if (take("^")) { const exponent = unary(); return (a) => Math.pow(base(a), exponent(a)); }
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
        if (token.value === "a") return (a) => a;
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
        if (selected.arity === 1) return (a) => selected.apply(args[0](a));
        if (selected.arity === 2) return (a) => selected.apply(args[0](a), args[1](a));
        return (a) => selected.apply(args[0](a), args[1](a), args[2](a));
      }
      throw new Error("Expression syntax error. Check operators and parentheses.");
    }

    const evaluator = expression();
    if (cursor !== tokens.length) throw new Error("Unexpected text at the end of the expression. Check parentheses and operators.");
    for (let i = 0; i <= 200; i += 1) {
      const value = evaluator(i / 200);
      if (!Number.isFinite(value) || value < -1e-9 || value > 1 + 1e-9) {
        throw new Error("g(a) must return a finite value between 0 and 1 throughout [0, 1].");
      }
    }
    return (a) => {
      const value = evaluator(a);
      if (!Number.isFinite(value) || value < -1e-9 || value > 1 + 1e-9) {
        throw new Error("g(a) is not a valid probability for some job sizes. Edit the expression.");
      }
      return Math.min(1, Math.max(0, value));
    };
  }

  window.compileProbabilityExpression = compileProbabilityExpression;
})();
