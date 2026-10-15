import { toMobileRole } from "src/core/auth/utils/mobile-role";
import { CampusDirectory } from "../entity/campus-directory.model";
import { DirectoryRole } from "../entity/enums/directory-role.enum";
import { ImportBatch } from "../entity/import-batch.model";
import { UserAccount } from "../entity/user.model";
import { DirectoryResDto } from "../dto/response/directory.res.dto";
import { ImportBatchResDto, ImportRowErrorResDto } from "../dto/response/import-batch.res.dto";
import { SessionAccount } from "../dto/response/session-account";

export class UserMapper {
  static toDirectory(row: CampusDirectory): DirectoryResDto {
    return {
      usn: row.usn,
      fullName: row.fullName,
      collegeEmail: row.collegeEmail,
      mobile: row.mobile ?? null,
      role: row.role,
      isHostelite: row.isHostelite,
      status: row.status,
    };
  }

  static toImportBatch(batch: ImportBatch, errors: ImportRowErrorResDto[]): ImportBatchResDto {
    return {
      id: batch.id,
      fileName: batch.fileName,
      status: batch.status,
      totalRows: batch.totalRows,
      createdCount: batch.createdCount,
      updatedCount: batch.updatedCount,
      skippedCount: batch.skippedCount,
      errorCount: batch.errorCount,
      errors,
    };
  }

  static toSession(tenantId: string, directory: CampusDirectory, user: UserAccount): SessionAccount {
    return {
      id: user.id,
      email: user.loginId,
      fullName: directory.fullName,
      role: directory.role,
      mobileRole: toMobileRole(directory.role),
      tenantId,
      hostelite: directory.role === DirectoryRole.STUDENT && directory.isHostelite,
      changePasswordRequired: user.changePasswordRequired,
    };
  }
}
