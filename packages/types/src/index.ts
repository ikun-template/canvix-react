/**
 * 深度可选：将对象所有层级的字段变为可选，保留元组和数组结构。
 */
export type DeepPartial<T> = T extends readonly [unknown, ...unknown[]]
  ? T
  : T extends readonly (infer U)[]
    ? DeepPartial<U>[]
    : T extends object
      ? { [K in keyof T]?: DeepPartial<T[K]> }
      : T;
