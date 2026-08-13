import Script from 'next/script';

export function OrganizationSchema() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "House Agent",
    "url": "https://marketplace-production-2905.up.railway.app",
    "logo": "https://marketplace-production-2905.up.railway.app/icon.png",
    "description": "The premier student and agent property rental platform in North Cyprus."
  };

  return (
    <Script
      id="organization-schema"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

export function RealEstateListingSchema({ property }: { property: Record<string, unknown> | null | undefined }) {
  // Gracefully handle missing property data
  if (!property) return null;

  const schema = {
    "@context": "https://schema.org",
    "@type": "RealEstateListing",
    "name": property.title || "Property Listing",
    "description": property.description || "View this property on House Agent.",
    "datePosted": property.created_at,
    "image": Array.isArray(property.images) && property.images.length > 0 ? property.images[0] : undefined,
    "offers": {
      "@type": "Offer",
      "price": property.price || 0,
      "priceCurrency": property.currency || "USD",
      "availability": "https://schema.org/InStock",
      "url": `https://marketplace-production-2905.up.railway.app/property/${property.id}`
    },
    "accommodationCategory": property.property_type || "Apartment",
    "numberOfBedrooms": property.bedrooms,
    "numberOfBathrooms": property.bathrooms,
    "address": {
      "@type": "PostalAddress",
      "addressLocality": property.location || "North Cyprus",
      "addressCountry": "CY"
    }
  };

  return (
    <Script
      id={`property-schema-${property.id}`}
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
