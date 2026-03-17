export function formatMoney(amount: number) {
  return new Intl.NumberFormat('ru-RU').format(amount) + ' сом';
}

export function formatDate(date: string) {
  return new Date(date).toLocaleDateString('ru-RU');
}
