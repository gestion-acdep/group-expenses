export interface Currency {
  code: string
  name: string
  symbol: string
  flag: string
}

export const CURRENCIES: Currency[] = [
  { code: "USD", name: "US Dollar", symbol: "$", flag: "🇺🇸" },
  { code: "EUR", name: "Euro", symbol: "€", flag: "🇪🇺" },
  { code: "ARS", name: "Argentine Peso", symbol: "$", flag: "🇦🇷" },
]

export function getCurrency(code: string): Currency | undefined {
  return CURRENCIES.find((currency) => currency.code === code)
}

export function formatAmount(amount: number, currencyCode: string): string {
  const currency = getCurrency(currencyCode)
  if (!currency) {
    return `${amount.toFixed(2)} ${currencyCode}`
  }

  // Handle special formatting for different currencies
  switch (currencyCode) {
    case "EUR":
      // Euro often uses comma as decimal separator in many countries
      return `${amount.toFixed(2).replace(".", ",")} ${currency.symbol}`
    default:
      return `${currency.symbol}${amount.toFixed(2)}`
  }
}

export function getCurrencySymbol(currencyCode: string): string {
  const currency = getCurrency(currencyCode)
  return currency ? currency.symbol : currencyCode
}

export function getCurrencyName(currencyCode: string): string {
  const currency = getCurrency(currencyCode)
  return currency ? currency.name : currencyCode
}

// Popular currencies for quick access
export const POPULAR_CURRENCIES = ["USD", "EUR", "ARS" ]
