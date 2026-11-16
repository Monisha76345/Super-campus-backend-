import { randomUUID } from "crypto";
import { BadRequestException, Injectable, Logger, NotFoundException } from "@nestjs/common";
import { TenantContextService } from "src/core/tenant/tenant-context.service";
import { UserService } from "src/modules/user/service/user.service";
import { CreateOutpassReqDto } from "../dto/request/create-outpass.req.dto";
import { GateScanReqDto } from "../dto/request/gate-scan.req.dto";
import { UpdateOutpassStatusReqDto } from "../dto/request/update-outpass-status.req.dto";
import { GateScanResDto } from "../dto/response/gate-scan.res.dto";
import { OutpassResDto } from "../dto/response/outpass.res.dto";
import { OutpassStatus } from "../entity/enums/outpass-status.enum";
import { PassType } from "../entity/enums/pass-type.enum";
import { OutpassRequest } from "../entity/outpass.model";
import { OutpassMapper } from "../mapper/outpass.mapper";
import { OutpassDataService } from "./outpass-data.service";
import { SmsNotificationService } from "./sms-notification.service";

@Injectable()
export class OutpassService {
  private readonly logger = new Logger(OutpassService.name);

  constructor(
    private readonly data: OutpassDataService,
    private readonly user: UserService,
    private readonly tenantContext: TenantContextService,
    private readonly sms: SmsNotificationService,
  ) {}

  async create(userId: string, body: CreateOutpassReqDto): Promise<OutpassResDto> {
    const namespace = this.tenantContext.getTenantId();
    const departure = new Date(body.departureTime);
    const returnTime = new Date(body.returnTime);

    if (isNaN(departure.getTime()) || isNaN(returnTime.getTime())) {
      throw new BadRequestException("Invalid departure or return timestamp");
    }

    if (returnTime <= departure) {
      throw new BadRequestException("Return time must be after departure time");
    }

    // Retrieve student profile and info through UserService (respecting layer boundaries)
    const student = await this.user.getStudentForOutpass(userId);

    if (!student.isHostelite) {
      throw new BadRequestException("Outpass requests are only permitted for registered hostelite students");
    }

    // If return is on another day or after 10:00 PM, it is strictly classified as LEAVE
    const isSameDay =
      departure.getFullYear() === returnTime.getFullYear() &&
      departure.getMonth() === returnTime.getMonth() &&
      departure.getDate() === returnTime.getDate();

    const returnHour = returnTime.getHours();
    const returnMinute = returnTime.getMinutes();
    const isPast10Pm = returnHour > 22 || (returnHour === 22 && returnMinute > 0);

    let effectivePassType = body.passType ?? PassType.OUTPASS;
    if (!isSameDay || isPast10Pm) {
      effectivePassType = PassType.LEAVE;
    }

    const outpass = new OutpassRequest();
    outpass.id = randomUUID();
    outpass.studentId = userId;
    outpass.studentName = student.fullName;
    outpass.usn = student.usn;
    outpass.roomNumber = body.roomNumber ?? null;
    outpass.parentPhone = body.parentPhone?.trim() || null;
    outpass.passType = effectivePassType;
    outpass.destination = body.destination.trim();
    outpass.reason = body.reason.trim();
    outpass.departureTime = departure;
    outpass.returnTime = returnTime;
    outpass.status = OutpassStatus.PENDING;
    outpass.qrToken = randomUUID();
    outpass.createdBy = userId;

    const saved = await this.data.save(namespace, outpass);
    this.logger.log(`Created outpass request ${saved.id} for student ${userId} on ${namespace}`);
    return OutpassMapper.toResponse(saved);
  }

  async getMyRequests(userId: string): Promise<OutpassResDto[]> {
    const namespace = this.tenantContext.getTenantId();
    const rows = await this.data.findByStudentId(namespace, userId);
    return rows.map(OutpassMapper.toResponse);
  }

  async getAdminRequests(): Promise<OutpassResDto[]> {
    const namespace = this.tenantContext.getTenantId();
    const rows = await this.data.findAll(namespace, 100);
    return rows.map(OutpassMapper.toResponse);
  }

  async getById(userId: string, id: string): Promise<OutpassResDto> {
    const namespace = this.tenantContext.getTenantId();
    const row = await this.data.findById(namespace, id);
    if (!row) {
      throw new NotFoundException("Outpass request not found");
    }
    return OutpassMapper.toResponse(row);
  }

  async cancel(userId: string, id: string): Promise<OutpassResDto> {
    const namespace = this.tenantContext.getTenantId();
    const row = await this.data.findById(namespace, id);
    if (!row) {
      throw new NotFoundException("Outpass request not found");
    }
    if (row.studentId !== userId) {
      throw new BadRequestException("You can only cancel your own outpass request");
    }
    if (row.status !== OutpassStatus.PENDING) {
      throw new BadRequestException("Only pending outpass requests can be cancelled");
    }

    row.status = OutpassStatus.CANCELLED;
    row.updatedBy = userId;
    const saved = await this.data.save(namespace, row);
    this.logger.log(`Cancelled outpass ${saved.id} by student ${userId} on ${namespace}`);
    return OutpassMapper.toResponse(saved);
  }

  async review(actorId: string, id: string, body: UpdateOutpassStatusReqDto): Promise<OutpassResDto> {
    const namespace = this.tenantContext.getTenantId();
    const row = await this.data.findById(namespace, id);
    if (!row) {
      throw new NotFoundException("Outpass request not found");
    }
    if (row.status !== OutpassStatus.PENDING) {
      throw new BadRequestException("This outpass request is no longer pending");
    }

    row.status = body.status;
    row.reviewedBy = actorId;
    row.reviewedAt = new Date();
    row.rejectionReason = body.status === OutpassStatus.REJECTED ? body.rejectionReason ?? null : null;
    row.updatedBy = actorId;

    const saved = await this.data.save(namespace, row);
    this.logger.log(`Reviewed outpass ${saved.id}: status=${saved.status} by admin ${actorId} on ${namespace}`);
    return OutpassMapper.toResponse(saved);
  }

  async gateScan(actorId: string, body: GateScanReqDto): Promise<GateScanResDto> {
    const namespace = this.tenantContext.getTenantId();
    const token = body.qrToken.trim();
    const row = await this.data.findByQrTokenOrId(namespace, token);
    if (!row) {
      throw new NotFoundException("Invalid QR token: No matching outpass found.");
    }

    // Auto-detect scan action if not explicitly supplied
    let action = body.scanType;
    if (!action) {
      if (row.status === OutpassStatus.APPROVED) {
        action = "EXIT";
      } else if (row.status === OutpassStatus.ACTIVE) {
        action = "ENTRY";
      } else {
        throw new BadRequestException(
          `Cannot scan outpass: Current status is '${row.status}'. Only APPROVED (for exit) or ACTIVE (for entry) passes can be scanned at the gate.`
        );
      }
    }

    const now = new Date();
    let messageText = "";
    let smsSent = false;

    if (action === "EXIT") {
      if (row.status !== OutpassStatus.APPROVED) {
        throw new BadRequestException(
          `Cannot log EXIT: Outpass status must be 'APPROVED' (Current status: '${row.status}').`
        );
      }
      row.status = OutpassStatus.ACTIVE;
      row.actualExitTime = now;
      row.updatedBy = actorId;

      if (row.parentPhone) {
        const smsRes = await this.sms.sendExitAlert({
          parentPhone: row.parentPhone,
          studentName: row.studentName || "Student",
          usn: row.usn,
          destination: row.destination,
          exitTime: now,
          expectedReturnTime: row.returnTime,
        });
        smsSent = smsRes.success;
        messageText = smsRes.text;
      } else {
        messageText = `Checked OUT successfully at hostel gate. (No parent phone registered)`;
      }
    } else {
      // ENTRY
      if (row.status !== OutpassStatus.ACTIVE) {
        throw new BadRequestException(
          `Cannot log ENTRY: Outpass status must be 'ACTIVE' (Current status: '${row.status}').`
        );
      }
      const isOverdue = now > new Date(row.returnTime);
      row.status = isOverdue ? OutpassStatus.OVERDUE : OutpassStatus.COMPLETED;
      row.actualEntryTime = now;
      row.updatedBy = actorId;

      if (row.parentPhone) {
        const smsRes = await this.sms.sendEntryAlert({
          parentPhone: row.parentPhone,
          studentName: row.studentName || "Student",
          usn: row.usn,
          entryTime: now,
          isOverdue,
        });
        smsSent = smsRes.success;
        messageText = smsRes.text;
      } else {
        messageText = `Checked IN safely to hostel. (No parent phone registered)`;
      }
    }

    const saved = await this.data.save(namespace, row);
    this.logger.log(`Gate scan ${action} recorded for outpass ${saved.id}. Status: ${saved.status}. Parent SMS sent: ${smsSent}`);

    return {
      actionTaken: action,
      outpass: OutpassMapper.toResponse(saved),
      parentPhone: saved.parentPhone ?? null,
      smsSent,
      messageText,
    };
  }
}
