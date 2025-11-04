export interface TrainerProfileInterface {
  readonly id: string;
  readonly description?: string;
  readonly city?: string;
  readonly profilePictureUrl?: string;
  readonly userId: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

