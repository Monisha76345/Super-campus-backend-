import { Column, Entity, PrimaryColumn } from "typeorm";

/** Lookup in the global database so login can find the campus from the email. */
@Entity("global_login")
export class GlobalLogin {
  @PrimaryColumn({ type: "varchar", length: 36 })
  id: string;

  @Column({ type: "varchar", length: 255 })
  loginId: string;

  @Column({ type: "varchar", length: 64 })
  tenantId: string;

  @Column({ type: "varchar", length: 36 })
  directoryId: string;
}
