"use client";

import React, { useState, useEffect } from 'react';
import { MapPin, Building2, Landmark, Home, Loader2, CheckCircle2 } from 'lucide-react';

interface Province {
  code: number;
  name: string;
}

interface District {
  code: number;
  name: string;
}

interface Ward {
  code: number;
  name: string;
}

export interface AddressValue {
  province: string;
  district: string;
  ward: string;
  streetAddress: string;
}

interface VietnamAddressSelectorProps {
  value: AddressValue;
  onChange: (address: AddressValue) => void;
}

// Fallback data in case the public API is temporarily unreachable
const FALLBACK_PROVINCES = [
  { code: 79, name: 'Thành phố Hồ Chí Minh' },
  { code: 1, name: 'Thành phố Hà Nội' },
  { code: 48, name: 'Thành phố Đà Nẵng' },
  { code: 31, name: 'Thành phố Hải Phòng' },
  { code: 92, name: 'Thành phố Cần Thơ' },
  { code: 74, name: 'Tỉnh Bình Dương' },
  { code: 75, name: 'Tỉnh Đồng Nai' },
  { code: 77, name: 'Tỉnh Bà Rịa - Vũng Tàu' },
  { code: 68, name: 'Tỉnh Lâm Đồng' },
  { code: 56, name: 'Tỉnh Khánh Hòa' },
  { code: 46, name: 'Tỉnh Thừa Thiên Huế' },
  { code: 49, name: 'Tỉnh Quảng Nam' },
  { code: 80, name: 'Tỉnh Long An' },
  { code: 89, name: 'Tỉnh An Giang' },
  { code: 91, name: 'Tỉnh Kiên Giang' },
];

export default function VietnamAddressSelector({ value, onChange }: VietnamAddressSelectorProps) {
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);

  const [selectedProvinceCode, setSelectedProvinceCode] = useState<number | null>(null);
  const [selectedDistrictCode, setSelectedDistrictCode] = useState<number | null>(null);

  const [loadingProvinces, setLoadingProvinces] = useState(false);
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [loadingWards, setLoadingWards] = useState(false);

  // 1. Fetch 63 Provinces on Mount
  useEffect(() => {
    let isMounted = true;
    async function loadProvinces() {
      setLoadingProvinces(true);
      try {
        const res = await fetch('https://provinces.open-api.vn/api/p/');
        if (!res.ok) throw new Error('API failed');
        const data = await res.json();
        if (isMounted) {
          setProvinces(data);
          // Try matching initial province
          const match = data.find((p: Province) => p.name === value.province || p.name.includes(value.province));
          if (match) {
            setSelectedProvinceCode(match.code);
          }
        }
      } catch {
        if (isMounted) {
          setProvinces(FALLBACK_PROVINCES);
          setSelectedProvinceCode(79); // Default HCMC
        }
      } finally {
        if (isMounted) setLoadingProvinces(false);
      }
    }
    loadProvinces();
    return () => { isMounted = false; };
  }, []);

  // 2. Fetch Districts when Province changes
  useEffect(() => {
    if (!selectedProvinceCode) {
      setDistricts([]);
      setWards([]);
      return;
    }

    let isMounted = true;
    async function loadDistricts() {
      setLoadingDistricts(true);
      try {
        const res = await fetch(`https://provinces.open-api.vn/api/p/${selectedProvinceCode}?depth=2`);
        if (!res.ok) throw new Error('API failed');
        const data = await res.json();
        if (isMounted) {
          const list = data.districts || [];
          setDistricts(list);
          // Try matching initial district
          const match = list.find((d: District) => d.name === value.district || d.name.includes(value.district));
          if (match) {
            setSelectedDistrictCode(match.code);
          } else if (list.length > 0) {
            setSelectedDistrictCode(list[0].code);
            onChange({
              ...value,
              district: list[0].name,
            });
          }
        }
      } catch {
        if (isMounted) setDistricts([]);
      } finally {
        if (isMounted) setLoadingDistricts(false);
      }
    }
    loadDistricts();
    return () => { isMounted = false; };
  }, [selectedProvinceCode]);

  // 3. Fetch Wards when District changes
  useEffect(() => {
    if (!selectedDistrictCode) {
      setWards([]);
      return;
    }

    let isMounted = true;
    async function loadWards() {
      setLoadingWards(true);
      try {
        const res = await fetch(`https://provinces.open-api.vn/api/d/${selectedDistrictCode}?depth=2`);
        if (!res.ok) throw new Error('API failed');
        const data = await res.json();
        if (isMounted) {
          const list = data.wards || [];
          setWards(list);
          const match = list.find((w: Ward) => w.name === value.ward || w.name.includes(value.ward));
          if (match) {
            // Keep current
          } else if (list.length > 0) {
            onChange({
              ...value,
              ward: list[0].name,
            });
          }
        }
      } catch {
        if (isMounted) setWards([]);
      } finally {
        if (isMounted) setLoadingWards(false);
      }
    }
    loadWards();
    return () => { isMounted = false; };
  }, [selectedDistrictCode]);

  const handleProvinceSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const code = Number(e.target.value);
    setSelectedProvinceCode(code);
    const prov = provinces.find((p) => p.code === code);
    onChange({
      ...value,
      province: prov ? prov.name : '',
      district: '',
      ward: '',
    });
    setSelectedDistrictCode(null);
  };

  const handleDistrictSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const code = Number(e.target.value);
    setSelectedDistrictCode(code);
    const dist = districts.find((d) => d.code === code);
    onChange({
      ...value,
      district: dist ? dist.name : '',
      ward: '',
    });
  };

  const handleWardSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const wardName = e.target.value;
    onChange({
      ...value,
      ward: wardName,
    });
  };

  const handleStreetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({
      ...value,
      streetAddress: e.target.value,
    });
  };

  const fullAddressString = [
    value.streetAddress,
    value.ward,
    value.district,
    value.province,
  ]
    .filter(Boolean)
    .join(', ');

  return (
    <div className="space-y-4">
      {/* 3-Column Cascading Administrative Selectors */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        {/* 1. Tỉnh / Thành phố */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase text-slate-700 flex items-center gap-1.5">
            <Landmark className="w-3.5 h-3.5 text-amber-600" />
            Tỉnh / Thành phố <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <select
              value={selectedProvinceCode || ''}
              onChange={handleProvinceSelect}
              disabled={loadingProvinces}
              className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-xs text-slate-800 font-medium focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all cursor-pointer disabled:bg-slate-100"
            >
              <option value="" disabled>
                {loadingProvinces ? 'Đang tải tỉnh/thành...' : '-- Chọn Tỉnh / Thành phố --'}
              </option>
              {provinces.map((p) => (
                <option key={p.code} value={p.code}>
                  {p.name}
                </option>
              ))}
            </select>
            {loadingProvinces && (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-600 absolute right-3 top-3 pointer-events-none" />
            )}
          </div>
        </div>

        {/* 2. Quận / Huyện */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase text-slate-700 flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5 text-amber-600" />
            Quận / Huyện <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <select
              value={selectedDistrictCode || ''}
              onChange={handleDistrictSelect}
              disabled={!selectedProvinceCode || loadingDistricts}
              className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-xs text-slate-800 font-medium focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all cursor-pointer disabled:bg-slate-100 disabled:cursor-not-allowed"
            >
              <option value="" disabled>
                {loadingDistricts
                  ? 'Đang tải quận/huyện...'
                  : !selectedProvinceCode
                  ? '← Chọn tỉnh/thành trước'
                  : '-- Chọn Quận / Huyện --'}
              </option>
              {districts.map((d) => (
                <option key={d.code} value={d.code}>
                  {d.name}
                </option>
              ))}
            </select>
            {loadingDistricts && (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-600 absolute right-3 top-3 pointer-events-none" />
            )}
          </div>
        </div>

        {/* 3. Phường / Xã */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase text-slate-700 flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-amber-600" />
            Phường / Xã <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <select
              value={value.ward || ''}
              onChange={handleWardSelect}
              disabled={!selectedDistrictCode || loadingWards}
              className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-xs text-slate-800 font-medium focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all cursor-pointer disabled:bg-slate-100 disabled:cursor-not-allowed"
            >
              <option value="" disabled>
                {loadingWards
                  ? 'Đang tải phường/xã...'
                  : !selectedDistrictCode
                  ? '← Chọn quận/huyện trước'
                  : '-- Chọn Phường / Xã --'}
              </option>
              {wards.map((w) => (
                <option key={w.code} value={w.name}>
                  {w.name}
                </option>
              ))}
            </select>
            {loadingWards && (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-600 absolute right-3 top-3 pointer-events-none" />
            )}
          </div>
        </div>
      </div>

      {/* Specific Street Address */}
      <div className="space-y-1.5">
        <label className="text-xs font-bold uppercase text-slate-700 flex items-center gap-1.5">
          <Home className="w-3.5 h-3.5 text-amber-600" />
          Địa chỉ cụ thể (Số nhà, tên đường, căn hộ / tòa nhà) <span className="text-rose-500">*</span>
        </label>
        <input
          type="text"
          placeholder="VD: 123 Đường Lê Lợi, Tòa nhà Bitexco..."
          value={value.streetAddress}
          onChange={handleStreetChange}
          className="w-full bg-white border border-slate-300 rounded-lg p-3 text-xs text-slate-900 font-medium focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all"
        />
      </div>

      {/* Realtime Complete Address Preview */}
      {fullAddressString && (
        <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-3 flex items-start gap-2.5 text-xs text-amber-900">
          <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-amber-950 uppercase text-[10px] tracking-wider block mb-0.5">
              Địa chỉ nhận hàng đầy đủ:
            </span>
            <span className="font-semibold text-slate-800 leading-relaxed">
              {fullAddressString}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
