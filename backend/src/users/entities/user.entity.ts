import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  OneToOne,
  OneToMany,
} from "typeorm";
import { TrainerProfile } from "../../trainer-profiles/entities/trainer-profile.entity";
import { Service } from "../../services/entities/service.entity";

export enum UserRole {
  CLIENT = "CLIENT",
  TRAINER = "TRAINER",
  ADMIN = "ADMIN",
}

@Entity({ name: "users" })
export class User {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "varchar", length: 255 })
  name: string;

  @Column({ type: "varchar", length: 255, unique: true })
  email: string;

  @Column({ type: "varchar", length: 255, select: false })
  password: string;

  @Column({
    type: "enum",
    enum: UserRole,
    default: UserRole.CLIENT,
  })
  role: UserRole;

  @OneToOne(() => TrainerProfile, (trainerProfile) => trainerProfile.user, {
    nullable: true,
  })
  trainerProfile: TrainerProfile;

  @OneToMany(() => Service, (service) => service.trainer)
  services: Service[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;
}
