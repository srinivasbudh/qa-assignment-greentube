export type PetStatus = 'available' | 'pending' | 'sold';

// Mirrors the subset of the Swagger Petstore schema used by this suite.
export type Pet = {
  id: number;
  category?: {
    id: number;
    name: string;
  };
  name: string;
  photoUrls: string[];
  tags?: Array<{
    id: number;
    name: string;
  }>;
  status: PetStatus;
};

export type ApiError = {
  code?: number;
  type?: string;
  message?: string;
};
