const MONTHS = [
  'januari', 'februari', 'mars', 'april', 'maj', 'juni',
  'juli', 'augusti', 'september', 'oktober', 'november', 'december',
];

export function currentMonthYear(): string {
  const d = new Date();
  return `${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

export function currentMonthYearCapitalized(): string {
  const s = currentMonthYear();
  return s.charAt(0).toUpperCase() + s.slice(1);
}
