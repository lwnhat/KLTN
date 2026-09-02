import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { ConfigProvider } from 'antd';
import viVN from 'antd/locale/vi_VN';
import './index.css';

// ─── ANT DESIGN TOKEN: Ăn khớp với design system của Storefront ──────────────
// Storefront palette: ink=#111111, canvas=#ffffff, amber gold=#d4af37/#b45309
// Font: Inter (sans) + Bebas Neue (display)
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ConfigProvider
      locale={viVN}
      theme={{
        token: {
          // ── Brand Colors ──
          colorPrimary: '#111111',        // ink — storefront primary
          colorInfo: '#111111',
          colorSuccess: '#007d48',         // storefront success token
          colorWarning: '#d97706',
          colorError: '#d30005',           // storefront sale token

          // ── Typography ──
          fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif",
          fontSize: 14,
          colorTextBase: '#111111',        // ink

          // ── Layout ──
          borderRadius: 8,
          colorBgLayout: '#f5f5f5',        // soft-cloud
          colorBgContainer: '#ffffff',     // canvas
          colorBorder: '#e5e5e5',          // hairline-soft
          colorBorderSecondary: '#cacacb', // hairline

          // ── Shadows & Motion ──
          boxShadow: '0 1px 4px rgba(17,17,17,0.06)',
          boxShadowSecondary: '0 4px 20px rgba(17,17,17,0.08)',
          motionDurationMid: '0.2s',
        },
        components: {
          Button: {
            controlHeight: 38,
            borderRadius: 8,
            fontWeight: 600,
            // Primary button = ink (black) ─ matches storefront .btn-primary
            colorPrimary: '#111111',
            colorPrimaryHover: '#39393b',  // charcoal
            colorPrimaryActive: '#39393b',
          },
          Card: {
            borderRadiusLG: 12,
            headerFontSize: 15,
            headerHeight: 52,
            colorBorderSecondary: '#e5e5e5',
          },
          Table: {
            borderRadiusLG: 10,
            headerBg: '#f5f5f5',           // soft-cloud
            headerColor: '#707072',        // mute
            rowHoverBg: '#f5f5f5',
            colorBorderSecondary: '#e5e5e5',
          },
          Menu: {
            darkItemBg: 'transparent',
            darkSubMenuItemBg: 'transparent',
            itemHeight: 42,
            itemBorderRadius: 8,
            // Selected item amber/gold accent
            darkItemSelectedBg: 'rgba(212,175,55,0.15)',
            darkItemSelectedColor: '#fde68a',
          },
          Input: {
            controlHeight: 38,
            borderRadius: 8,
            colorBorder: '#cacacb',
            hoverBorderColor: '#111111',
            activeBorderColor: '#111111',
          },
          Select: {
            controlHeight: 38,
            borderRadius: 8,
          },
          Tag: {
            borderRadius: 4,
          },
          Badge: {
            colorPrimary: '#111111',
          },
        },
      }}
    >
      <App />
    </ConfigProvider>
  </React.StrictMode>
);
