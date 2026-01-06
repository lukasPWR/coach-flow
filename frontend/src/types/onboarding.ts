export interface CreateTrainerProfileDto {
  description: string
  city: string
  profilePictureUrl?: string
  specializationIds: string[]
}

export interface CreateServiceDto {
  serviceTypeId: string
  price: number
  durationMinutes: number
  trainerId?: string // Optional for form, required for API payload if backend demands it
}

export interface ServiceResponseDto {
  id: string
  price: number
  durationMinutes: number
  serviceTypeId: string
  serviceType?: {
    id: string
    name: string
  }
}

export interface CreateUnavailabilityDto {
  startTime: string // ISO Date String
  endTime: string // ISO Date String
}

export interface UnavailabilityResponseDto {
  id: string
  startTime: string
  endTime: string
}

export interface ServiceType {
  id: string
  name: string
}

export interface Specialization {
  id: string
  name: string
}

export interface OnboardingState {
  currentStep: number
  isLoading: boolean
  profileCreated: boolean
  profileData: CreateTrainerProfileDto
  addedServices: ServiceResponseDto[]
}
