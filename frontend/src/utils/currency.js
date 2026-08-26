import { ref, computed } from 'vue';

export const CURRENCIES = [
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'SAR', symbol: '﷼', name: 'Saudi Riyal' },
  { code: 'AED', symbol: 'AED', name: 'UAE Dirham' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  { code: 'CAD', symbol: 'CA$', name: 'Canadian Dollar' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
  { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar' },
  { code: 'CNY', symbol: 'CN¥', name: 'Chinese Yuan' },
  { code: 'CHF', symbol: 'CHF', name: 'Swiss Franc' },
  { code: 'BRL', symbol: 'R$', name: 'Brazilian Real' },
  { code: 'ZAR', symbol: 'R', name: 'South African Rand' },
  { code: 'RUB', symbol: '₽', name: 'Russian Ruble' },
  { code: 'KRW', symbol: '₩', name: 'South Korean Won' },
  { code: 'MXN', symbol: 'MX$', name: 'Mexican Peso' },
  { code: 'IDR', symbol: 'Rp', name: 'Indonesian Rupiah' },
  { code: 'THB', symbol: '฿', name: 'Thai Baht' },
  { code: 'NZD', symbol: 'NZ$', name: 'New Zealand Dollar' },
  { code: 'KWD', symbol: 'KD', name: 'Kuwaiti Dinar' },
  { code: 'QAR', symbol: 'QR', name: 'Qatari Riyal' },
  { code: 'OMR', symbol: 'OMR', name: 'Omani Rial' },
  { code: 'BHD', symbol: 'BD', name: 'Bahraini Dinar' },
  { code: 'PKR', symbol: 'Rs', name: 'Pakistani Rupee' },
  { code: 'BDT', symbol: '৳', name: 'Bangladeshi Taka' },
  { code: 'LKR', symbol: 'Rs', name: 'Sri Lankan Rupee' },
  { code: 'NPR', symbol: 'Rs', name: 'Nepalese Rupee' },
  { code: 'MYR', symbol: 'RM', name: 'Malaysian Ringgit' },
  { code: 'PHP', symbol: '₱', name: 'Philippine Peso' },
  { code: 'VND', symbol: '₫', name: 'Vietnamese Dong' },
  { code: 'EGP', symbol: 'E£', name: 'Egyptian Pound' },
  { code: 'TRY', symbol: '₺', name: 'Turkish Lira' }
];

const STORAGE_KEY = 'cashbuddy_currency';

const loadSavedCurrency = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.code) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Failed to parse saved currency setting:', e);
  }
  return CURRENCIES[0]; // Default: INR
};

export const currentCurrency = ref(loadSavedCurrency());

export const currencySymbol = computed(() => {
  if (!currentCurrency.value) return '₹';
  return currentCurrency.value.symbol || currentCurrency.value.code || '₹';
});

export const currencyCode = computed(() => {
  return currentCurrency.value?.code || 'INR';
});

export const setCurrency = (curr) => {
  if (!curr || !curr.code) return;
  const newCurr = {
    code: String(curr.code).toUpperCase().trim(),
    symbol: curr.symbol ? String(curr.symbol).trim() : '',
    name: curr.name ? String(curr.name).trim() : String(curr.code).toUpperCase().trim()
  };
  currentCurrency.value = newCurr;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newCurr));
  } catch (e) {
    console.error('Failed to save currency setting to localStorage:', e);
  }
};
