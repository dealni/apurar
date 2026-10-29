export const isFiniteNumber = (value) =>
  typeof value === 'number' && isFinite(value);
export const isNonNegative = (value) => isFiniteNumber(value) && value >= 0;
