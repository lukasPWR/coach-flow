import { ref } from 'vue'
import { getTrainerById } from '@/lib/api/trainers'
import type {
  TrainerProfileViewModel,
  TrainerProfileDto,
  TrainerServiceViewModel,
} from '@/types/trainer'

export function useTrainerProfile(trainerId: string) {
  const trainer = ref<TrainerProfileViewModel | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat('pl-PL', {
      style: 'currency',
      currency: 'PLN',
      minimumFractionDigits: 2,
    }).format(price)
  }

  const formatDuration = (minutes: number): string => {
    if (minutes < 60) return `${minutes} min`
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`
  }

  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const mapToViewModel = (dto: TrainerProfileDto): TrainerProfileViewModel => {
    const services: TrainerServiceViewModel[] = dto.services.map((service) => ({
      id: service.id,
      name: service.name,
      durationMinutes: service.durationMinutes,
      priceFormatted: formatPrice(service.price),
      durationFormatted: formatDuration(service.durationMinutes),
    }))

    return {
      ...dto,
      services,
      initials: getInitials(dto.name),
    }
  }

  const loadTrainer = async () => {
    isLoading.value = true
    error.value = null
    try {
      const data = await getTrainerById(trainerId)
      trainer.value = mapToViewModel(data)
    } catch (e: unknown) {
      console.error('Failed to load trainer profile:', e)
      error.value = 'Nie udało się pobrać profilu trenera.'
      const axiosError = e as { response?: { status?: number } }
      if (axiosError.response?.status === 404) {
        error.value = 'Trener nie został znaleziony.'
      }
    } finally {
      isLoading.value = false
    }
  }

  return {
    trainer,
    isLoading,
    error,
    loadTrainer,
  }
}
