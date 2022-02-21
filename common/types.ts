export type AtLeastTwo<T> = {
  0: T,
  1: T
} & Array<T>
