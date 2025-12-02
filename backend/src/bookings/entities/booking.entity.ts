import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { User } from "../../users/entities/user.entity";
import { Service } from "../../services/entities/service.entity";

export enum BookingStatus {
  PENDING = "PENDING",
  ACCEPTED = "ACCEPTED",
  REJECTED = "REJECTED",
  CANCELLED = "CANCELLED",
}

@Entity({ name: "bookings" })
export class Booking {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "timestamp" })
  startTime: Date;

  @Column({ type: "timestamp" })
  endTime: Date;

  @Column({
    type: "enum",
    enum: BookingStatus,
    default: BookingStatus.PENDING,
  })
  status: BookingStatus;

  @Column({ type: "timestamp", nullable: true })
  reminderSentAt: Date;

  @Column({ type: "uuid" })
  clientId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: "clientId" })
  client: User;

  @Column({ type: "uuid" })
  trainerId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: "trainerId" })
  trainer: User;

  @Column({ type: "uuid" })
  serviceId: string;

  @ManyToOne(() => Service)
  @JoinColumn({ name: "serviceId" })
  service: Service;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
