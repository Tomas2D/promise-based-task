export interface Deletable {
  destructor: () => void;
}

export function isDeletable(value: unknown): value is Deletable {
  return typeof value === 'object' && value !== null && 'destructor' in value && typeof (value as Deletable).destructor === 'function';
}
