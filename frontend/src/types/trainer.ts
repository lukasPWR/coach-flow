// Trainer Directory Types

/**
 * Representation of a specialization badge/option
 */
export interface SpecializationBadge {
  id: string
  name: string
}

/**
 * Trainer summary for list display
 */
export interface TrainerSummary {
  id: string
  name: string
  city: string
  description: string
  profilePictureUrl: string
  specializations: SpecializationBadge[]
}

/**
 * Option for specialization select filter
 */
export interface SpecializationOption {
  value: string // UUID
  label: string
}

/**
 * Filter state for trainer directory
 */
export interface TrainerFiltersState {
  city: string
  specializationId: string | null
}

/**
 * Pagination state for trainer list
 */
export interface TrainersPaginationState {
  currentPage: number
  limit: number
  total: number
  hasMore: boolean
}

/**
 * Query parameters for GET /trainers endpoint
 */
export interface GetTrainersQueryParams {
  page?: number
  limit?: number
  city?: string
  specializationId?: string
}

/**
 * Response from GET /trainers endpoint
 */
export interface GetTrainersResponse {
  data: TrainerSummary[]
  meta: {
    total: number
    page: number
    limit: number
  }
}

// --- Trainer Profile View Types ---

/**
 * DTO from API (response from /trainers/:id)
 */
export interface TrainerProfileDto {
  id: string
  name: string
  city: string
  description: string
  profilePictureUrl: string
  specializations: Array<{
    id: string
    name: string
  }>
  services: Array<{
    id: string
    name: string
    price: number
    durationMinutes: number
  }>
}

/**
 * ViewModel for Service (used in components)
 */
export interface TrainerServiceViewModel {
  id: string
  name: string
  priceFormatted: string // e.g. "150.00 PLN"
  durationFormatted: string // e.g. "1h 30m"
}

/**
 * ViewModel for Trainer Profile
 */
export interface TrainerProfileViewModel extends Omit<TrainerProfileDto, 'services'> {
  services: TrainerServiceViewModel[]
  initials: string // Calculated from name
}
