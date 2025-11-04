import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
  ManyToMany,
  JoinTable,
} from "typeorm";
import { User } from "../../users/entities/user.entity";
import { Specialization } from "../../specializations/entities/specialization.entity";

@Entity({ name: "trainer_profiles" })
export class TrainerProfile {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "text", nullable: true })
  description: string;

  @Column({ type: "varchar", length: 255, nullable: true })
  city: string;

  @Column({ type: "varchar", length: 500, nullable: true })
  profilePictureUrl: string;

  @Column({ type: "uuid" })
  userId: string;

  @OneToOne(() => User, (user) => user.trainerProfile)
  @JoinColumn({ name: "userId" })
  user: User;

  @ManyToMany(() => Specialization, (specialization) => specialization.trainerProfiles)
  @JoinTable({
    name: "trainer_specializations",
    joinColumn: { name: "trainerId", referencedColumnName: "id" },
    inverseJoinColumn: { name: "specializationId", referencedColumnName: "id" },
  })
  specializations: Specialization[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
