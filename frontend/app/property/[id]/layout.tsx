import { Metadata } from 'next';
import { RealEstateListingSchema } from '@/components/seo/SchemaMarkup';
import { getPropertyPublic } from '@/lib/api';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  try {
    const property = await getPropertyPublic(id);
    if (property) {
      return {
        title: `${property.title || 'Property'} | House Agent`,
        description: property.description 
          ? String(property.description).slice(0, 160) 
          : `View this ${property.bedrooms ? `${property.bedrooms} Bed` : ''} ${property.house_type || 'Property'} in ${property.location || 'North Cyprus'}.`,
        openGraph: {
          title: String(property.title),
          description: property.description ? String(property.description) : undefined,
          images: Array.isArray(property.photos) && property.photos.length > 0 ? [(property.photos[0] as { url: string }).url] : [],
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
    property = await getPropertyPublic(id);
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
