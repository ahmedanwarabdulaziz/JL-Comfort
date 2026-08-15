export interface SampleRequestItem {
  fabricId: string;
  name: string;
  sku: string;
  imageUrl: string;
}

export type SampleRequestStatus = 'pending' | 'shipped';

export interface SampleRequestAddress {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  zip: string;
  country: string;
}

export interface SampleRequest {
  id: string;
  items: SampleRequestItem[];
  name: string;
  email: string;
  phone?: string;
  address: SampleRequestAddress;
  status: SampleRequestStatus;
  createdAt: Date;
}

export interface SampleRequestInput {
  items: SampleRequestItem[];
  name: string;
  email: string;
  phone?: string;
  address: SampleRequestAddress;
}
