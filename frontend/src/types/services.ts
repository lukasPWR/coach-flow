// Service Types Module
export interface ServiceType {
  id: string
  name: string
}

// Service Entity
export interface Service {
  id: string
  trainerId: string
  serviceTypeId: string
  price: number
  durationMinutes: number
  createdAt: string
  updatedAt: string
  serviceType?: ServiceType // Optional populated relation
}

// Form Values
export interface ServiceFormValues {
  serviceTypeId: string
  price: number
  durationMinutes: number // 15-180 minutes, multiples of 15
}

// Create Service Payload (for API)
export interface CreateServicePayload {
  trainerId: string
  serviceTypeId: string
  price: number
  durationMinutes: number
}

// Update Service Payload (for API)
export interface UpdateServicePayload {
  price?: number
  durationMinutes?: number
}
