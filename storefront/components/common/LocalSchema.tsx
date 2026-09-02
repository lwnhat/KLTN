export default function LocalSchema() {
  const schemaData = {
    '@context': 'https://schema.org',
    '@type': 'JewelryStore',
    name: 'Daniel Wellington Vietnam',
    image: [
      'https://res.cloudinary.com/akmq0b0f/image/upload/v1788237149/mn-jewelry/products/mo67cculr0ltpiyl0w4c.png',
    ],
    '@id': 'https://kltn-ashy.vercel.app/#jewelrystore',
    url: 'https://kltn-ashy.vercel.app',
    telephone: '+84932029606',
    priceRange: '500.000₫ - 50.000.000₫',
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'Số 123 Lê Lợi, Phường Bến Nghé',
      addressLocality: 'Quận 1',
      addressRegion: 'TP. Hồ Chí Minh',
      postalCode: '700000',
      addressCountry: 'VN',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: 10.7725,
      longitude: 106.7009,
    },
    openingHoursSpecification: [
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: [
          'Monday',
          'Tuesday',
          'Wednesday',
          'Thursday',
          'Friday',
          'Saturday',
          'Sunday',
        ],
        opens: '09:00',
        closes: '21:30',
      },
    ],
    sameAs: [
      'https://www.facebook.com/danielwellington',
      'https://www.instagram.com/danielwellington',
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData) }}
    />
  );
}
