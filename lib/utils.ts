export const formatCurrency = (amount: string | number, currencySymbol = 'KSh'): string => {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num)) return `${currencySymbol} 0`;
  return `${currencySymbol} ${num.toLocaleString()}`;
};

export const formatDate = (date: string | undefined | null): string => {
  if (!date) return '-';
  try {
    return new Date(date).toLocaleDateString('en-GB', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return '-';
  }
};

export const formatDateTime = (date: string | undefined | null): string => {
  if (!date) return '-';
  try {
    return new Date(date).toLocaleString('en-GB', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '-';
  }
};
