import { Column, CreateDateColumn, Entity, PrimaryColumn, UpdateDateColumn } from "typeorm";

export enum ConnectionStatus {
  PENDING = "PENDING",
  ACCEPTED = "ACCEPTED",
  REJECTED = "REJECTED",
}

@Entity("campus_connection")
export class CampusConnection {
  @PrimaryColumn({ type: "varchar", length: 36 })
  id: string;

  @Column({ name: "requester_user_id", type: "varchar", length: 36 })
  requesterUserId: string;

  @Column({ name: "receiver_user_id", type: "varchar", length: 36 })
  receiverUserId: string;

  @Column({
    type: "enum",
    enum: ConnectionStatus,
    default: ConnectionStatus.PENDING,
  })
  status: ConnectionStatus;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;
}
