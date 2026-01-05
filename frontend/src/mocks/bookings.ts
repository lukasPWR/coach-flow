import { BookingStatus, type BookingDto } from '@/types/bookings'

export const mockBookings: BookingDto[] = [
  {
    id: '1',
    startTime: new Date(Date.now() + 86400000 * 2).toISOString(), // +2 days
    endTime: new Date(Date.now() + 86400000 * 2 + 3600000).toISOString(),
    status: BookingStatus.ACCEPTED,
    trainer: {
      id: 't1',
      name: 'Jan Kowalski',
      profilePictureUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jan',
    },
    service: {
      id: 's1',
      name: 'Trening Personalny',
      price: 150,
      durationMinutes: 60,
    },
    clientId: 'c1',
    trainerId: 't1',
    serviceId: 's1',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '2',
    startTime: new Date(Date.now() + 86400000 * 5).toISOString(), // +5 days
    endTime: new Date(Date.now() + 86400000 * 5 + 3600000).toISOString(),
    status: BookingStatus.PENDING,
    trainer: {
      id: 't2',
      name: 'Anna Nowak',
      profilePictureUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Anna',
    },
    service: {
      id: 's2',
      name: 'Konsultacja Dietetyczna',
      price: 200,
      durationMinutes: 45,
    },
    clientId: 'c1',
    trainerId: 't2',
    serviceId: 's2',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '3',
    startTime: new Date(Date.now() - 86400000 * 2).toISOString(), // -2 days
    endTime: new Date(Date.now() - 86400000 * 2 + 3600000).toISOString(),
    status: BookingStatus.ACCEPTED, // Completed in past
    trainer: {
      id: 't1',
      name: 'Jan Kowalski',
      profilePictureUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jan',
    },
    service: {
      id: 's1',
      name: 'Trening Personalny',
      price: 150,
      durationMinutes: 60,
    },
    clientId: 'c1',
    trainerId: 't1',
    serviceId: 's1',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '4',
    startTime: new Date(Date.now() - 86400000 * 5).toISOString(), // -5 days
    endTime: new Date(Date.now() - 86400000 * 5 + 3600000).toISOString(),
    status: BookingStatus.CANCELLED,
    trainer: {
      id: 't3',
      name: 'Piotr Zieliński',
      profilePictureUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Piotr',
    },
    service: {
      id: 's3',
      name: 'Plan Treningowy',
      price: 100,
      durationMinutes: 30,
    },
    clientId: 'c1',
    trainerId: 't3',
    serviceId: 's3',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
]
