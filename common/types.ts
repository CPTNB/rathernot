export type AtLeastTwo<T> = {
  0: T,
  1: T
} & Array<T>

export interface Discernable {
  descriminator: string;
}

export function getFieldsOfType
  <Type extends Discernable, Input extends object>(input: Input, descriminator: string):
    [ keyof Input, Type][] {
  const keys = Object.keys(input) as (keyof Input)[];
  return keys.filter(k => {
    if (typeof input !== 'object') {
      return false;
    }
    const value: any = input[k];
    if (value && value.descriminator) {
      return value.descriminator === descriminator;
    }
  }).map(k => [k, input[k] as unknown as Type])
}

export function getFieldsOf<Output>(input: any, discriminatingField: string): [string, Output][] {
  const keys = Object.keys(input);
  return keys.filter(k => {
    if (typeof input !== 'object') {
      return false;
    }
    const value: any = input[k];
    if (value && typeof value[discriminatingField] === 'string') {
      return true
    }
  }).map(k => [k, input[k] as unknown as Output])
}
