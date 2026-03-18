export type Chain = (string | number)[];

// --- Low-level operation types ---

export interface OpUpdate {
  kind: 'update';
  chain: Chain;
  value: unknown;
}

export interface OpArrayInsert {
  kind: 'array:insert';
  chain: Chain;
  index: number;
  value: unknown;
}

export interface OpArrayRemove {
  kind: 'array:remove';
  chain: Chain;
  index: number;
}

export interface OpAdd {
  kind: 'add';
  chain: Chain;
  value: unknown;
}

export interface OpDelete {
  kind: 'delete';
  chain: Chain;
}

export interface OpMove {
  kind: 'move';
  chain: Chain;
  from: number;
  to: number;
}

export type Op =
  | OpUpdate
  | OpArrayInsert
  | OpArrayRemove
  | OpAdd
  | OpDelete
  | OpMove;

// --- Target-level operation models ---

export type DocumentOp = Op;
export type PageOp = Op;
export type WidgetOp = Op;

export interface DocumentOperation {
  target: 'document';
  operations: DocumentOp[];
}

export interface PageOperation {
  target: 'page';
  id: string;
  operations: PageOp[];
}

export interface WidgetOperation {
  target: 'widget';
  pageId: string;
  id: string;
  operations: WidgetOp[];
}

export type OperationModel =
  | DocumentOperation
  | PageOperation
  | WidgetOperation;

export interface UpdateOptions {
  memorize?: boolean;
  merge?: boolean;
}
