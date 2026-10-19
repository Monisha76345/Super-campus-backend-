import { EntityManager } from "typeorm";
import { OutpassRequest } from "../entity/outpass.model";

export class OutpassRepository {
  constructor(private readonly manager: EntityManager) {}

  save(row: OutpassRequest): Promise<OutpassRequest> {
    return this.manager.getRepository(OutpassRequest).save(row);
  }

  findById(id: string): Promise<OutpassRequest | null> {
    return this.manager.getRepository(OutpassRequest).findOne({ where: { id } });
  }

  findByStudentId(studentId: string): Promise<OutpassRequest[]> {
    return this.manager.getRepository(OutpassRequest).find({
      where: { studentId },
      order: { createdAt: "DESC" },
    });
  }

  findAll(limit = 100): Promise<OutpassRequest[]> {
    return this.manager.getRepository(OutpassRequest).find({
      order: { createdAt: "DESC" },
      take: limit,
    });
  }

  findByQrTokenOrId(token: string): Promise<OutpassRequest | null> {
    return this.manager.getRepository(OutpassRequest).findOne({
      where: [{ qrToken: token }, { id: token }],
    });
  }
}
