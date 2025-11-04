export interface ServiceInterface {
  readonly id: string;
  readonly price: number;
  readonly durationMinutes: number;
  readonly trainerId: string;
  readonly serviceTypeId: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly deletedAt?: Date;
}

