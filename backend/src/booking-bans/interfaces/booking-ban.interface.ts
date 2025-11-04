export interface BookingBanInterface {
  readonly id: string;
  readonly bannedUntil: Date;
  readonly clientId: string;
  readonly trainerId: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

