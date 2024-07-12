# Introducing syntax

```
seq = term /[ ]+/ seq  (t, _, s) => [t, ...s];
    | term  (t) => [t];

term = int ;
     | iden ;

iden = /[a-zA-Z_][a-zA-Z_[0-9]*/ ;

int = /[0-9]+/ (s) => Number(s);
```

**terminal** match the input directly

**non-terminal** name a rule

**rule** Combine terminals and non-terminals to match complex sequences

## Define data structure

```js
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
```

**y** needed to set regex last index

## Implement interpreter

```js
export const interpret = (syntax, source, rule, start) =>
  rule
    .map(({ seq, gencode }) => {
      const result = seq.reduce(
        (r, term) => {
          if (r) {
            const { matches, index } = r

            if (term instanceof RegExp) {
              term.lastIndex = index
              const match = term.exec(source)
              if (match) {
                return {
                  matches: [...matches, match[0]],
                  index: term.lastIndex,
                }
              }
            } else {
              const sub = interpret(syntax, source, syntax[term], index)
              if (sub) {
                return {
                  matches: [...matches, sub.matches],
                  index: sub.index,
                }
              }
            }
          }

          return null
        },
        { matches: [], index: start }
      )

      if (result) {
        return {
          matches: (gencode ?? ((x) => x))(...result.matches),
          index: result.index,
        }
      }
    })
    .reduce((r, x) => r || x, null)
```

## Test

```js
const exampleSource = "28 x 14 y2"

console.log("\nExample")
console.log(
  prn(interpret(example, exampleSource, Object.values(example)[0], 0))
)
```

# Self describe

```
syntax = rule syntax  (r, s) => ({ ...r, ...s }) ;
       | rule ;

rule = nonterminal _ /=/ expr (name, _, __, expr) => ({[name]: expr});

expr = seq gencode _ /\|/ expr  (seq, gencode, _, __, expr) => [{ seq, ...gencode }, ...expr];
     | seq gencode (seq, gencode) => [{ seq, ...gencode }];

gencode = /[^;]+;/ (s) => s.trim().length === 1 ? {} : ({ gencode: eval(s.replace(/\n/g, " ")) }) ;

seq = term /\s+/ seq  (t, _, s) => [t, ...s];
    | term  (t) => [t];


term = terminal ;
     | nonterminal ;

nonterminal = _ /[a-zA-Z_][a-zA-Z_0-9]*/ (_, s) => s;

terminal = _ /\/(\\\/|[^\/])+\//  (_, s) => eval(s + "y");

_ = /\s*/ ;
```

## Test

```
term = int ;
     | bool ;

int = /[0-9]+/ ;

bool = /true\|false/  (s) => Boolean(s);
```

## Test self!

# Hand roll first version

```js
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
```

## Test

# Journal

```js
// Define the data structure that represents BNF.
// It must be simply machine readable.
// Later on BNF can be parsed in text form and translated into the data structure

// Need distinction between terminals and non-terminals.
// Don't really fancy working with symbols, and later on, regexs are powerful.
// So, terminal will be regexs, non-terminals will be strings.
// A production will be an array of ORs (e.g. [["int"], ["symbol"]]).
// Each OR is an array of terminals and non-terminals (e.g. [[/#/, "bracket"], ["bracket"]])

// Actually, we need a genCode per sequence, so top level object needs to be replace with array of sequences.
// Each sequence has the OR array and some genCode.

// Implement simple interpreter for BNF to get a feeling for how it works in practise.
// Returning error messages it not always obvious, only when having exausted productions can you throw "end of input but expected ...".
// Possibly you'd have to keep track of the furtherst you've come, and then throw "expected x but found y"?
// For each branch one can record why it failed, then throw "expected x or y or z".

// Steps to bootstrap:
// write interpreter
// define PEG in data structures
// use that to define PEG as text
// rince and repeat

// Should we start loading from file, as escaping is becoming an issue?
```

# Regex

```
regex = or ;

or = dot or2  (lhs, rest) => lhs + rest;
or2 = /\|/ dot or2  (op, rhs, rest) => rhs + op + rest;
    | /.{0}/  () => "";

dot = star dot2  (lhs, rest) => lhs + rest;
dot2 = star dot2  (rhs, rest) => rhs + "." + rest;
     | /.{0}/  () => "";

star = unit /\*/  (lhs, op) => lhs + op;
     | unit ;

unit = /\(/ regex /\)/ (o, r, c) => r;
     | char ;

char = /[a-z]/ ;
```
