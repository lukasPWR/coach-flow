import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { User } from "../../users/entities/user.entity";
import { ServiceType } from "../../service-types/entities/service-type.entity";

@Entity({ name: "services" })
export class Service {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "decimal", precision: 10, scale: 2 })
  price: number;

  @Column({ type: "int" })
  durationMinutes: number;

  @Column({ type: "uuid" })
  trainerId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: "trainerId" })
  trainer: User;

  @Column({ type: "uuid" })
  serviceTypeId: string;

  @ManyToOne(() => ServiceType)
  @JoinColumn({ name: "serviceTypeId" })
  serviceType: ServiceType;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;
}
