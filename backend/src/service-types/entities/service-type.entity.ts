import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity({ name: "service_types" })
export class ServiceType {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "varchar", length: 255, unique: true })
  name: string;
}
