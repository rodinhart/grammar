import { handrolled, interpret, prn } from "./main.js"

// const bnf2data = {
//   // syntax = rule syntax
//   //        | rule _
//   syntax: [
//     ["rule", "syntax", (r, b) => ({ ...r, ...b })],
//     ["rule", "_", (r) => r],
//   ],

//   // rule = nonterminal _ /=/ expression
//   rule: [
//     [
//       "nonterminal",
//       "_",
//       /=/y,
//       "expression",
//       (id, ws1, _, prod) => ({
//         [id]: prod,
//       }),
//     ],
//   ],

//   // expression = seq gencode _ /\|/ expression
//   //            / seq gencode
//   expression: [
//     [
//       "seq",
//       "gencode",
//       "_",
//       /\|/y,
//       "expression",
//       (seq, js, _, __, expr) => [[...seq, js], ...expr],
//     ],
//     ["seq", "gencode", (seq, js) => [[...seq, js]]],
//   ],

//   // gencode = /[^;]+?;/
//   gencode: [
//     [
//       /[^;]+?;/y,
//       (js) =>
//         js.trim() === ";"
//           ? (...xs) => (xs.length === 1 ? xs[0] : xs)
//           : eval(js.replace(/\n/g, " ")),
//     ],
//   ],

//   // term = term /\s+/ seq
//   //      | term
//   seq: [
//     ["term", /\s+/y, "seq", (t, _, s) => [t, ...s]],
//     ["term", (t) => [t]],
//   ],

//   // term = terminal
//   //      | nonterminal
//   term: [
//     ["terminal", (t) => t],
//     ["nonterminal", (t) => t],
//   ],

//   // nonterminal = _ /[a-zA-Z_][a-zA-Z_0-9]*/
//   nonterminal: [["_", /[a-zA-Z_][a-zA-Z_0-9]*/y, (_, id) => id]],

//   // terminal = _ /\/(\\\/|.)*?\//
//   terminal: [["_", /\/(\\\/|.)*?\//y, (_, regex) => eval(regex + "y")]],

//   // _ = /\s*/
//   _: [[/\s*/y, (w) => w]],
// }

// const interpret = (bnf, s) => {
//   const _ = (rule, start) =>
//     rule.reduce((r, seq) => {
//       if (r) {
//         return r
//       }

//       const [tree, lastIndex] =
//         seq.slice(0, seq.length - 1).reduce(
//           (r, term) => {
//             if (!r) {
//               return r
//             }

//             if (term instanceof RegExp) {
//               term.lastIndex = r[1]
//               const match = term.exec(s)
//               if (match) {
//                 r[0].push(match[0])
//                 r[1] = term.lastIndex

//                 return r
//               } else {
//                 return null
//               }
//             } else {
//               const sub = _(bnf[term], r[1])
//               if (sub) {
//                 r[0].push(sub[0])
//                 r[1] = sub[1]

//                 return r
//               } else {
//                 return null
//               }
//             }
//           },
//           [[], start]
//         ) ?? []

//       if (tree) {
//         return [seq[seq.length - 1](...tree), lastIndex]
//       }

//       return r
//     }, null)

//   return _(Object.values(bnf)[0], 0)
// }

// const arithmetic = `
//       add = mul add2  (lhs, rest) => rest.reduce((lhs, [op, rhs]) => [op, lhs, rhs], lhs);
//       add2 = ws /\\+/ mul add2  (_, op, rhs, rest) => [[op, rhs], ...rest];
//            | ws  (_) => [];

//       mul = atom mul2  (lhs, rest) => rest.reduce((lhs, [op, rhs]) => [op, lhs, rhs], lhs);
//       mul2 = ws /\\*/ atom mul2  (_, op, rhs, rest) => [[op, rhs], ...rest];
//            | ws  (_) => [];

//       atom = int  (i) => i;
//            | iden  (id) => id;

//       int = ws /[0-9]+/  (_, i) => Number(i);

//       iden = ws /[a-zA-Z]+/  (_, id) => id;

//       ws = /\\s*/  (_) => _;
//       `
// const res = interpret(bnf2data, arithmetic)
// console.log(res && res[1] === arithmetic.length ? res[0] : res)
// console.log(JSON.stringify(interpret(res[0], "2 + 3 * 4")))

// const bnf2code = `
//       syntax = rule syntax  (rule, syntax) => ({ ...rule, ...syntax });
//              | rule _  (rule) => rule;

//       rule = nonterminal _ /=/ expression  (id, _, __, expr) => ({ [id]: expr });

//       expression = seq gencode _ /\\|/ expression  (seq, js, _, __, expr) => [[...seq, js], ...expr];
//                  | seq gencode  (seq, js) => [[...seq, js]];

//       gencode = /[^;]+?;/  (js) => eval(js.replace(/\\n/g, ""));

//       seq = term /\\s+/ seq  (t, _, s) => [t, ...s];
//           | term  (t) => [t];

//       term = terminal  (t) => t;
//            | nonterminal  (t) => t;

//       nonterminal = _ /[a-zA_Z_][a-zA_Z_0-9]*/  (_, id) => id;

//       terminal = _ /\\/.*?\\//  (_, regex) => regex;

//       _ = /\\s*/  (ws) => ws;
//       `
// const res = interpret(bnf2data, bnf2code)

// console.log(res && res[1] === bnf2code.length ? res[0] : res)
// console.log(
//   interpret(
//     res[0],
//     `
//       hello = world () => null;

//       baz = foo (a) => a; | bar (b) => b;`
//   )
// )

const { syntaxEl, inputEl, outputEl } = Object.fromEntries(
  ["syntax", "input", "output"].map((id) => [
    id + "El",
    document.getElementById(id),
  ])
)

const exec = () => {
  let syn = null
  try {
    syn = interpret(handrolled, syntaxEl.value, Object.values(handrolled)[0], 0)
  } catch (e) {
    console.warn(e)
  }
  let res = null
  try {
    res = syn
      ? interpret(syn.matches, inputEl.value, Object.values(syn.matches)[0], 0)
      : null
  } catch (e) {
    console.warn(e)
  }

  outputEl.value = res != null ? prn(res.matches) : ""
}

syntaxEl.addEventListener("input", () => {
  exec()
})

inputEl.addEventListener("input", () => {
  exec()
})
