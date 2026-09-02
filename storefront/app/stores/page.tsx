import { Metadata } from 'next';
import Breadcrumbs from '@/components/common/Breadcrumbs';
import { MapPin, Phone, Clock, Navigation, ShieldCheck } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Hệ Thống Showroom & Bản Đồ Chỉ Đường',
  description: 'Trải nghiệm không gian trang sức Bắc Âu tại hệ thống Flagship Boutique Daniel Wellington TP.HCM và Hà Nội. Hướng dẫn chỉ đường và giờ mở cửa.',
};

export default function StoresPage() {
  const stores = [
    {
      id: 'hcm-flagship',
      name: 'Daniel Wellington Flagship Boutique — Quận 1',
      address: '123 Lê Lợi, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh',
      phone: '093 202 9606',
      hours: '09:00 - 21:30 (Mở cửa tất cả các ngày trong tuần)',
      mapEmbed: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3919.4604561081685!2d106.69894367583807!3d10.775231759200427!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x31752f385570472f%3A0x17874917306418f2!2zTMOqIEzhu6NpLCBC4bq_biBOZ2jDqSwgUXXhuq1uIDEsIEjhu5MgQ2jDrSBNaW5oLCBWaeG7h3QgTmFt!5e0!3m2!1svi!2s!4v1710000000000!5m2!1svi!2s',
      directionsUrl: 'https://maps.google.com/?q=123+Lê+Lợi,+Bến+Nghé,+Quận+1,+TP+Hồ+Chí+Minh',
    },
    {
      id: 'hn-boutique',
      name: 'Daniel Wellington Tràng Tiền Boutique — Hà Nội',
      address: '24 Tràng Tiền, Phường Tràng Tiền, Quận Hoàn Kiếm, Hà Nội',
      phone: '090 123 4567',
      hours: '09:30 - 22:00 (Mở cửa tất cả các ngày trong tuần)',
      mapEmbed: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3724.113063529241!2d105.85244587595304!3d21.028161787801837!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3135ab9533f59f9f%3A0x6b823e595493033!2zMjQgVHLDoG5nIFRp4buBbiwgSG_DoG4gS2nhur9tLCBIw6AgTuG7mWksIFZp4buHdCBOYW0!5e0!3m2!1svi!2s!4v1710000000001!5m2!1svi!2s',
      directionsUrl: 'https://maps.google.com/?q=24+Tràng+Tiền,+Hoàn+Kiếm,+Hà+Nội',
    },
  ];

  return (
    <div className="max-w-[1440px] mx-auto px-6 sm:px-12 py-10 space-y-10">
      <Breadcrumbs items={[{ label: 'Hệ thống Showroom & Bản đồ' }]} />

      <div className="max-w-2xl">
        <span className="text-xs font-bold tracking-[0.2em] uppercase text-mute">
          Trải Nghiệm Trực Tiếp
        </span>
        <h1 className="text-3xl sm:text-4xl font-bold uppercase tracking-tight text-ink mt-1">
          HỆ THỐNG FLAGSHIP BOUTIQUE
        </h1>
        <p className="text-sm text-mute mt-2 leading-relaxed">
          Kính mời Quý khách ghé thăm không gian trưng bày trang sức & đồng hồ Daniel Wellington để thử trực tiếp kích cỡ, nhận tư vấn kim hoàn chuyên sâu và trải nghiệm dịch vụ khắc laser lấy ngay.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {stores.map((store) => (
          <div
            key={store.id}
            className="border border-hairline rounded-lg overflow-hidden bg-canvas shadow-sm flex flex-col justify-between"
          >
            {/* Interactive Map Iframe */}
            <div className="w-full h-72 bg-soft-cloud relative border-b border-hairline">
              <iframe
                title={store.name}
                src={store.mapEmbed}
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen={false}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="w-full h-full"
              />
            </div>

            {/* Store Information */}
            <div className="p-6 space-y-5 flex-1 flex flex-col justify-between">
              <div className="space-y-3">
                <h3 className="text-lg font-bold text-ink uppercase tracking-wide">
                  {store.name}
                </h3>

                <div className="space-y-2.5 text-xs sm:text-sm text-mute">
                  <div className="flex items-start gap-2.5">
                    <MapPin className="w-4 h-4 text-ink shrink-0 mt-0.5" />
                    <span>{store.address}</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Clock className="w-4 h-4 text-ink shrink-0" />
                    <span>{store.hours}</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Phone className="w-4 h-4 text-ink shrink-0" />
                    <span className="font-semibold text-ink">{store.phone}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-hairline-soft flex flex-wrap items-center gap-3">
                <a
                  href={store.directionsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-primary py-2.5 px-5 text-xs font-semibold uppercase tracking-wider inline-flex items-center gap-2"
                >
                  <Navigation className="w-3.5 h-3.5" />
                  <span>Chỉ Đường Trên Google Maps</span>
                </a>
                <a
                  href={`tel:${store.phone.replace(/\s+/g, '')}`}
                  className="btn-secondary py-2.5 px-4 text-xs font-semibold uppercase tracking-wider inline-flex items-center gap-1.5"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>Gọi Showroom</span>
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
