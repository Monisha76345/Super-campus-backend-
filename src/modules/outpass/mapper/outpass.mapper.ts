import { OutpassResDto } from "../dto/response/outpass.res.dto";
import { PassType } from "../entity/enums/pass-type.enum";
import { OutpassRequest } from "../entity/outpass.model";

export class OutpassMapper {
  static toResponse(row: OutpassRequest): OutpassResDto {
    return {
      id: row.id,
      studentId: row.studentId,
      studentName: row.studentName ?? null,
      usn: row.usn ?? null,
      roomNumber: row.roomNumber ?? null,
      parentPhone: row.parentPhone ?? null,
      passType: row.passType || PassType.OUTPASS,
      destination: row.destination,
      reason: row.reason,
      departureTime: row.departureTime instanceof Date ? row.departureTime.toISOString() : new Date(row.departureTime).toISOString(),
      returnTime: row.returnTime instanceof Date ? row.returnTime.toISOString() : new Date(row.returnTime).toISOString(),
      status: row.status,
      reviewedBy: row.reviewedBy ?? null,
      reviewedAt: row.reviewedAt ? (row.reviewedAt instanceof Date ? row.reviewedAt.toISOString() : new Date(row.reviewedAt).toISOString()) : null,
      rejectionReason: row.rejectionReason ?? null,
      actualExitTime: row.actualExitTime ? (row.actualExitTime instanceof Date ? row.actualExitTime.toISOString() : new Date(row.actualExitTime).toISOString()) : null,
      actualEntryTime: row.actualEntryTime ? (row.actualEntryTime instanceof Date ? row.actualEntryTime.toISOString() : new Date(row.actualEntryTime).toISOString()) : null,
      qrToken: row.qrToken ?? null,
      createdAt: row.createdAt instanceof Date ? row.createdAt.toISOString() : new Date(row.createdAt).toISOString(),
      updatedAt: row.updatedAt instanceof Date ? row.updatedAt.toISOString() : new Date(row.updatedAt).toISOString(),
    };
  }
}
