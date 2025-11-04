import { Entity, PrimaryGeneratedColumn, Column, ManyToMany } from "typeorm";
import { TrainerProfile } from "../../trainer-profiles/entities/trainer-profile.entity";

@Entity({ name: "specializations" })
export class Specialization {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "varchar", length: 255, unique: true })
  name: string;

  @ManyToMany(() => TrainerProfile, (trainerProfile) => trainerProfile.specializations)
  trainerProfiles: TrainerProfile[];
}
