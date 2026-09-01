import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { ConfigProvider } from 'antd';
import viVN from 'antd/locale/vi_VN';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ConfigProvider
      locale={viVN}
      theme={{
        token: {
          colorPrimary: '#b45309', // Warm amber-700 / Luxury Bronze Gold
          colorInfo: '#0284c7',
          colorSuccess: '#059669',
          colorWarning: '#d97706',
          colorError: '#dc2626',
          borderRadius: 10,
          fontFamily: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
          colorBgLayout: '#f8fafc',
          colorTextBase: '#0f172a',
          fontSize: 14,
        },
        components: {
          Button: {
            controlHeight: 38,
            borderRadius: 8,
            fontWeight: 600,
          },
          Card: {
            borderRadiusLG: 14,
            headerFontSize: 16,
            headerHeight: 52,
          },
          Table: {
            borderRadiusLG: 12,
            headerBg: '#f8fafc',
            headerColor: '#475569',
            rowHoverBg: '#f1f5f9',
          },
          Menu: {
            darkItemBg: 'transparent',
            darkSubMenuItemBg: 'transparent',
            itemHeight: 42,
            itemBorderRadius: 8,
          },
          Input: {
            controlHeight: 38,
            borderRadius: 8,
          },
          Select: {
            controlHeight: 38,
            borderRadius: 8,
          },
        },
      }}
    >
      <App />
    </ConfigProvider>
  </React.StrictMode>
);

