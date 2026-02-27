// src/context/CurrencyContext.tsx
import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';

export type CurrencyType = 'VND' | 'USD';

interface CurrencyContextType {
  currency: CurrencyType;
  rate: number; // VND per 1 USD
  setCurrency: (curr: CurrencyType) => void; // Thay toggleCurrency bằng setCurrency
  formatPrice: (vndPrice: number) => string;
  convert: (vndPrice: number) => number;
}

const CurrencyContext = createContext<CurrencyContextType>({
  currency: 'VND',
  rate: 0,
  setCurrency: () => {},
  formatPrice: (v) => v.toLocaleString() + ' VND',
  convert: (v) => v,
});

export const CurrencyProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currency, setCurrencyState] = useState<CurrencyType>(() => {
    const saved = localStorage.getItem('currency');
    return (saved === 'USD' ? 'USD' : 'VND');
  });
  const [rate, setRate] = useState<number>(0);

  const fetchRate = async () => {
    try {
      const dateStr = new Date().toISOString().split('T')[0];
      const resp = await fetch(
        `https://www.vietcombank.com.vn/api/exchangerates?date=${dateStr}`
      );
      if (!resp.ok) throw new Error('Failed to fetch rate');
      const data: any = await resp.json();
      const usdInfo = data.Data?.find((d: any) => d.currencyCode === 'USD');
      if (usdInfo) {
        // VCB API trả về dạng string ví dụ: "25330.00"
        const parsed = parseFloat(usdInfo.transfer);
        if (!isNaN(parsed) && parsed > 0) {
          setRate(parsed);
        }
      }
    } catch (err) {
      console.error('Unable to load exchange rate', err);
    }
  };

  useEffect(() => {
    fetchRate();
  }, []);

  // Update localStorage mỗi khi currency thay đổi
  const setCurrency = (curr: CurrencyType) => {
    setCurrencyState(curr);
    localStorage.setItem('currency', curr);
  };

  const convert = (vndPrice: number) => {
    if (currency === 'USD' && rate > 0) {
      return vndPrice / rate;
    }
    return vndPrice;
  };

  const formatPrice = (vndPrice: number) => {
    if (currency === 'USD' && rate > 0) {
      const usd = vndPrice / rate;
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
      }).format(usd);
    }
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(vndPrice);
  };

  return (
    <CurrencyContext.Provider value={{ currency, rate, setCurrency, formatPrice, convert }}>
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = () => useContext(CurrencyContext);