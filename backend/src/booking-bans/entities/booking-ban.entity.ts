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

@Entity({ name: "booking_bans" })
export class BookingBan {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "timestamptz" })
  bannedUntil: Date;

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

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
