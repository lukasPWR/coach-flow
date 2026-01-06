import { api } from './client'
import type {
  UnavailabilityDto,
  CreateUnavailabilityDto,
  UpdateUnavailabilityDto,
} from '@/types/calendar'

export interface GetUnavailabilitiesParams {
  from?: string // ISO Date - początek zakresu
  to?: string // ISO Date - koniec zakresu
}

export const unavailabilitiesApi = {
  /**
   * Pobiera niedostępności trenera w danym zakresie dat
   * GET /unavailabilities?from={startISO}&to={endISO}
   */
  getUnavailabilities: async (
    params?: GetUnavailabilitiesParams
  ): Promise<UnavailabilityDto[]> => {
    const response = await api.get<UnavailabilityDto[]>('/unavailabilities', { params })
    return response.data
  },

  /**
   * Pobiera pojedynczą niedostępność
   * GET /unavailabilities/:id
   */
  getUnavailability: async (id: string): Promise<UnavailabilityDto> => {
    const response = await api.get<UnavailabilityDto>(`/unavailabilities/${id}`)
    return response.data
  },

  /**
   * Tworzy nową niedostępność
   * POST /unavailabilities
   */
  createUnavailability: async (data: CreateUnavailabilityDto): Promise<UnavailabilityDto> => {
    const response = await api.post<UnavailabilityDto>('/unavailabilities', data)
    return response.data
  },

  /**
   * Aktualizuje niedostępność (np. przy drag & drop)
   * PATCH /unavailabilities/:id
   */
  updateUnavailability: async (
    id: string,
    data: UpdateUnavailabilityDto
  ): Promise<UnavailabilityDto> => {
    const response = await api.patch<UnavailabilityDto>(`/unavailabilities/${id}`, data)
    return response.data
  },

  /**
   * Usuwa niedostępność
   * DELETE /unavailabilities/:id
   */
  deleteUnavailability: async (id: string): Promise<void> => {
    await api.delete(`/unavailabilities/${id}`)
  },
}

