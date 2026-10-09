export function formatValue(val) {
  if (typeof val === 'number') {
    return parseFloat(val.toFixed(4));
  }
  return val;
}
