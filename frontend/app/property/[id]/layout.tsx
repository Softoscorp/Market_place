import { Metadata } from 'next';
import { RealEstateListingSchema } from '@/components/seo/SchemaMarkup';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://marketplace-production-2905.up.railway.app';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  try {
    const response = await fetch(`${API_BASE_URL}/properties/${id}`);
    if (response.ok) {
      const property = await response.json();
      return {
        title: `${property.title || 'Property'} | House Agent`,
        description: property.description 
          ? property.description.slice(0, 160) 
          : `View this ${property.bedrooms ? `${property.bedrooms} Bed` : ''} ${property.house_type || 'Property'} in ${property.location || 'North Cyprus'}.`,
        openGraph: {
          title: property.title,
          description: property.description,
          images: property.photos && property.photos.length > 0 ? [property.photos[0].url] : [],
          type: 'article',
        }
      };
    }
  } catch (e) {
    console.error('Failed to fetch property metadata', e);
  }

  return {
    title: 'Property Listing | House Agent',
  };
}

export default async function PropertyLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  let property = null;

  try {
    const response = await fetch(`${API_BASE_URL}/properties/${id}`);
    if (response.ok) {
      property = await response.json();
    }
  } catch (e) {
    console.error('Failed to fetch property for schema', e);
  }

  return (
    <>
      {property && <RealEstateListingSchema property={property} />}
      {children}
    </>
  );
}
