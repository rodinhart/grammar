export const prn = (x, i = "") => {
  const j = i + "  "
  switch (true) {
    case x instanceof RegExp:
      return `/${x.source}/${x.flags}`

    case typeof x === "function":
      return String(x)

    case x instanceof Array:
      return `[${x.map((y) => `\n${j}${prn(y, j)}`).join(`,`)}\n${i}]`

    case x?.constructor === Object:
      return `{${Object.entries(x)
        .map(([key, value]) => `\n${j}${key}: ${prn(value, j)}`)
        .join(`,`)}\n${i}}`

    default:
      return JSON.stringify(x)
  }
}

const example = {
  // seq = term /[ ]+/ seq  (t, _, s) => [t, ...s];
  //     | term  (t) => [t];
  seq: [
    { seq: ["term", /[ ]+/y, "seq"], gencode: (t, _, s) => [t, ...s] },
    { seq: ["term"], gencode: (t) => [t] },
  ],

  // term = int ;
  //      | iden ;
  term: [{ seq: ["int"] }, { seq: ["iden"] }],

  // iden = /[a-zA-Z_][a-zA-Z_[0-9]*/ ;
  iden: [{ seq: [/[a-zA-Z_][a-zA-Z_[0-9]*/y] }],

  // int = /[0-9]+/ (s) => Number(s);
  int: [{ seq: [/[0-9]+/y], gencode: (s) => Number(s) }],
}

export const interpret = (syntax, source, rule, start) =>
  rule.reduce((r, { seq, gencode }) => {
    if (r) {
      return r
    }

    const result = seq.reduce(
      (r, term) => {
        if (!r) {
          return r
        }

        const { matches, index } = r

        if (term instanceof RegExp) {
          term.lastIndex = index
          const match = term.exec(source)
          if (match) {
            return { matches: [...matches, match[0]], index: term.lastIndex }
          } else {
            return null
          }
        } else {
          const sub = interpret(syntax, source, syntax[term], index)
          if (sub) {
            return {
              matches: [...matches, sub.matches],
              index: sub.index,
            }
          } else {
            return null
          }
        }
      },
      { matches: [], index: start }
    )

    if (result) {
      return {
        matches: (gencode ?? ((x) => x))(...result.matches),
        index: result.index,
      }
    } else {
      return null
    }
  }, null)

const exampleSource = "28 x 14 y2"

console.log("\nExample")
console.log(
  prn(interpret(example, exampleSource, Object.values(example)[0], 0))
)

export const handrolled = {
  // syntax = rule syntax  (r, s) => ({ ...r, ...s }) ;
  //        | rule ;
  syntax: [
    { seq: ["rule", "syntax"], gencode: (r, s) => ({ ...r, ...s }) },
    { seq: ["rule"] },
  ],

  // rule = nonterminal _ /=/ expr (name, _, __, expr) => ({[name]: expr});
  rule: [
    {
      seq: ["nonterminal", "_", /=/y, "expr"],
      gencode: (name, _, __, expr) => ({ [name]: expr }),
    },
  ],

  // expr = seq gencode _ /\|/ expr  (seq, gencode, _, __, expr) => [{ seq, ...gencode }, ...expr];
  //      | seq gencode (seq, gencode) => [{ seq, ...gencode }];
  expr: [
    {
      seq: ["seq", "gencode", "_", /\|/y, "expr"],
      gencode: (seq, gencode, _, __, expr) => [{ seq, ...gencode }, ...expr],
    },
    {
      seq: ["seq", "gencode"],
      gencode: (seq, gencode) => [{ seq, ...gencode }],
    },
  ],

  // gencode = /[^;]+;/ (s) => s.trim().length === 1 ? {} : ({ gencode: eval(s.replace(/\n/g, " ")) }) ;
  gencode: [
    {
      seq: [/[^;]+;/y],
      gencode: (s) =>
        s.trim().length === 1 ? {} : { gencode: eval(s.replace(/\n/g, " ")) },
    },
  ],

  // seq = term /\s+/ seq  (t, _, s) => [t, ...s];
  //     | term  (t) => [t];
  seq: [
    { seq: ["term", /\s+/y, "seq"], gencode: (t, _, s) => [t, ...s] },
    { seq: ["term"], gencode: (t) => [t] },
  ],

  // term = terminal ;
  //      | nonterminal ;
  term: [{ seq: ["terminal"] }, { seq: ["nonterminal"] }],

  // nonterminal = _ /[a-zA-Z_][a-zA-Z_0-9]*/ (_, s) => s;
  nonterminal: [
    { seq: ["_", /[a-zA-Z_][a-zA-Z_0-9]*/y], gencode: (_, s) => s },
  ],

  // terminal = _ /\/(\\\/|[^\/])+\//  (_, s) => eval(s + "y");
  terminal: [
    {
      seq: ["_", /\/(\\\/|[^\/])+\//y],
      gencode: (_, s) => eval(s + "y"),
    },
  ],

  // _ = /\s*/ ;
  _: [
    {
      seq: [/\s*/y],
    },
  ],
}

const handrollSource = `
term = int ;
     | bool ;

int = /[0-9]+/ ;

bool = /true\|false/  (s) => Boolean(s);
`

console.log("\nHandroll")
console.log(
  prn(interpret(handrolled, handrollSource, Object.values(handrolled)[0], 0))
)

const selfSource = `
syntax = rule syntax  (r, s) => ({ ...r, ...s }) ;
       | rule ;

rule = nonterminal _ /=/ expr (name, _, __, expr) => ({[name]: expr});

expr = seq gencode _ /\\|/ expr  (seq, gencode, _, __, expr) => [{ seq, ...gencode }, ...expr];
     | seq gencode (seq, gencode) => [{ seq, ...gencode }];

gencode = /[^;]+;/ (s) => s.trim().length === 1 ? {} : ({ gencode: eval(s.replace(/\\n/g, " ")) }) ;

seq = term /\\s+/ seq  (t, _, s) => [t, ...s];
    | term  (t) => [t];


term = terminal ;
     | nonterminal ;

nonterminal = _ /[a-zA-Z_][a-zA-Z_0-9]*/ (_, s) => s;

terminal = _ /\\/(\\\\\\/|[^\\/])+\\//  (_, s) => eval(s + "y");

_ = /\\s*/ ;
`

console.log("\nSelf")
console.log(
  prn(interpret(handrolled, selfSource, Object.values(handrolled)[0], 0))
)
