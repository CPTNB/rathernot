// type serializable<T, identitfier extends string> = {
//   _rnTypeName: identitfier
//   deserialize(input: object & {
//     _rnTypeName: identitfier
//   }): T
//   serialize(): string
// };

// class BackAndForth implements serializable<BackAndForth, "bnf"> {
//   _rnTypeName: "bnf"
//   deserialize(input) {
//     return new BackAndForth()
//   }
//   serialize() {
//     return JSON.stringify(this)
//   }
// }
