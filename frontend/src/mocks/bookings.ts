import { BookingStatus, type BookingDto } from '@/types/bookings'

export const mockBookings: BookingDto[] = [
  {
    id: '1',
    startTime: new Date(Date.now() + 86400000 * 2).toISOString(), // +2 days
    endTime: new Date(Date.now() + 86400000 * 2 + 3600000).toISOString(),
    status: BookingStatus.ACCEPTED,
    client: {
      id: 'c1',
      name: 'Maria Wiśniewska',
      profilePictureUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Maria',
    },
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
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '2',
    startTime: new Date(Date.now() + 86400000 * 5).toISOString(), // +5 days
    endTime: new Date(Date.now() + 86400000 * 5 + 3600000).toISOString(),
    status: BookingStatus.PENDING,
    client: {
      id: 'c2',
      name: 'Tomasz Lewandowski',
      profilePictureUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Tomasz',
    },
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
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '3',
    startTime: new Date(Date.now() - 86400000 * 2).toISOString(), // -2 days
    endTime: new Date(Date.now() - 86400000 * 2 + 3600000).toISOString(),
    status: BookingStatus.ACCEPTED, // Completed in past
    client: {
      id: 'c1',
      name: 'Maria Wiśniewska',
      profilePictureUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Maria',
    },
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
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '4',
    startTime: new Date(Date.now() - 86400000 * 5).toISOString(), // -5 days
    endTime: new Date(Date.now() - 86400000 * 5 + 3600000).toISOString(),
    status: BookingStatus.CANCELLED,
    client: {
      id: 'c3',
      name: 'Katarzyna Dąbrowska',
      profilePictureUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Katarzyna',
    },
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
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
]
