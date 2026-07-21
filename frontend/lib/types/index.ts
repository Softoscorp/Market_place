export type AgentVerificationTier = 'Basic' | 'Verified' | 'Trusted Agent' | 'Top Agent';

export interface Agent {
  id: string;
  name: string;
  agencyName?: string;
  verificationTier: AgentVerificationTier;
  rating: number;
  reviewCount: number;
  phone: string;
  email: string;
  avatarUrl: string;
  joinedDate: string;
  whatsappEnabled: boolean;
}

export type PropertyType = 'Studio' | '1+1' | '2+1' | '3+1' | '4+1' | 'Villa' | 'Room';
export type FurnishedStatus = 'Fully Furnished' | 'Partially Furnished' | 'Unfurnished';
export type LocationCity = 'Famagusta' | 'Nicosia' | 'Kyrenia';
export type RentPaymentFrequency = 'Monthly' | '3 Months' | '6 Months' | 'Yearly';

export interface Property {
  id: string;
  title: string;
  description: string;
  price: number;
  currency: 'GBP';
  type: PropertyType;
  city: LocationCity;
  neighborhood: string;
  furnished: FurnishedStatus;
  bedrooms: number;
  bathrooms: number;
  squareMeters: number;
  
  // Financials
  depositMonths: number;
  commissionMonths: number;
  rentPaymentFrequency: RentPaymentFrequency;
  dues: number;
  
  // Amenities & Distances
  amenities: string[];
  distanceToUniMeters?: number;
  universityName?: string;
  
  // Media
  imageUrls: string[];
  
  // Relations
  agentId: string;
  
  // Metadata
  availableFrom: string;
  createdAt: string;
  updatedAt: string;
  featured?: boolean;
}

export type LifestyleHabit = 'Early Bird' | 'Night Owl' | 'Smoker' | 'Non-smoker' | 'Pet Friendly' | 'No Pets' | 'Quiet' | 'Social' | 'Tidy' | 'Relaxed';
export type RoommateGenderPreference = 'Male' | 'Female' | 'Any';

export interface RoommateProfile {
  id: string;
  userId: string;
  name: string;
  age: number;
  gender: 'Male' | 'Female' | 'Other';
  occupation: 'Student' | 'Professional';
  university?: string;
  budget: number;
  lookingForCity: LocationCity[];
  moveInDate: string;
  durationMonths: number;
  bio: string;
  habits: LifestyleHabit[];
  genderPreference: RoommateGenderPreference;
  avatarUrl: string;
  createdAt: string;
}
