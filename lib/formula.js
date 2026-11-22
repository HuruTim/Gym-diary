const OPERATORS = { "+": 1, "-": 1, "*": 2, "/": 2 };

function tokenize(input) {
  const tokens = [];
  let i = 0;
  while (i < input.length) {
    const ch = input[i];
    if (ch === " " || ch === "\t") {
      i += 1;
    } else if (/[0-9.]/.test(ch)) {
      let num = "";
      while (i < input.length && /[0-9.]/.test(input[i])) {
        num += input[i];
        i += 1;
      }
      const value = Number(num);
      if (Number.isNaN(value)) throw new Error(`Bad number "${num}"`);
      tokens.push({ type: "num", value });
    } else if (/[a-zA-Z_]/.test(ch)) {
      let name = "";
      while (i < input.length && /[a-zA-Z0-9_ ]/.test(input[i])) {
        name += input[i];
        i += 1;
      }
      tokens.push({ type: "var", name: name.trim() });
    } else if (OPERATORS[ch] || ch === "(" || ch === ")") {
      tokens.push({ type: ch });
      i += 1;
    } else if (ch === "×" || ch === "x" || ch === "X") {
      tokens.push({ type: "*" });
      i += 1;
    } else {
      throw new Error(`Unexpected character "${ch}"`);
    }
  }
  return tokens;
}

function parse(tokens, vars, pos) {
  function peekToken() {
    return tokens[pos.i];
  }

  function parseExpr() {
    let left = parseTerm();
    let token = peekToken();
    while (token && (token.type === "+" || token.type === "-")) {
      pos.i += 1;
      const right = parseTerm();
      left = token.type === "+" ? left + right : left - right;
      token = peekToken();
    }
    return left;
  }

  function parseTerm() {
    let left = parseFactor();
    let token = peekToken();
    while (token && (token.type === "*" || token.type === "/")) {
      pos.i += 1;
      const right = parseFactor();
      if (token.type === "/" && right === 0) throw new Error("Division by zero");
      left = token.type === "*" ? left * right : left / right;
      token = peekToken();
    }
    return left;
  }

  function parseFactor() {
    const token = peekToken();
    if (!token) throw new Error("Unexpected end of formula");
    if (token.type === "-") {
      pos.i += 1;
      return -parseFactor();
    }
    if (token.type === "+") {
      pos.i += 1;
      return parseFactor();
    }
    if (token.type === "num") {
      pos.i += 1;
      return token.value;
    }
    if (token.type === "(") {
      pos.i += 1;
      const value = parseExpr();
      const closing = peekToken();
      if (!closing || closing.type !== ")") throw new Error("Missing )");
      pos.i += 1;
      return value;
    }
    if (token.type === "var") {
      pos.i += 1;
      const key = Object.keys(vars).find(
        (k) => k.toLowerCase() === token.name.toLowerCase(),
      );
      if (key === undefined) throw new Error(`Unknown max "${token.name}"`);
      return Number(vars[key]);
    }
    throw new Error(`Unexpected token ${token.type}`);
  }

  const result = parseExpr();
  if (pos.i < tokens.length) throw new Error("Unexpected trailing tokens");
  return result;
}

export function evalFormula(expr, vars) {
  if (typeof expr !== "string" || !expr.trim()) return null;
  try {
    const value = parse(tokenize(expr), vars ?? {}, { i: 0 });
    return Number.isFinite(value) ? value : null;
  } catch {
    return null;
  }
}

export function roundKg(value) {
  if (value == null || !Number.isFinite(value)) return null;
  return Math.round(value / 2.5) * 2.5;
}
