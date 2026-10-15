import { EntityManager, IsNull, Not } from "typeorm";
import { CampusDirectory } from "../entity/campus-directory.model";
import { DirectoryRole } from "../entity/enums/directory-role.enum";
import { DirectoryStatus } from "../entity/enums/directory-status.enum";
import { GlobalLogin } from "../entity/global-login.model";
import { ImportBatch } from "../entity/import-batch.model";
import { UserProfile } from "../entity/profile.model";
import { UserAccount } from "../entity/user.model";

export class UserRepository {
  constructor(private readonly manager: EntityManager) {}

  saveDirectory(row: CampusDirectory): Promise<CampusDirectory> {
    return this.manager.getRepository(CampusDirectory).save(row);
  }

  findDirectoryById(id: string): Promise<CampusDirectory | null> {
    return this.manager.getRepository(CampusDirectory).findOne({ where: { id } });
  }

  findDirectoryByUsn(usn: string): Promise<CampusDirectory | null> {
    return this.manager.getRepository(CampusDirectory).findOne({ where: { usn } });
  }

  findDirectoryByCollegeEmail(collegeEmail: string): Promise<CampusDirectory | null> {
    return this.manager.getRepository(CampusDirectory).findOne({ where: { collegeEmail } });
  }

  findPendingAlumni(page: number, limit: number): Promise<[CampusDirectory[], number]> {
    return this.manager.getRepository(CampusDirectory).findAndCount({
      where: {
        role: DirectoryRole.ALUMNI,
        status: DirectoryStatus.PENDING,
        mobile: Not(IsNull()),
      },
      order: { updatedAt: "DESC" },
      skip: (page - 1) * limit,
      take: limit,
    });
  }

  saveUser(row: UserAccount): Promise<UserAccount> {
    return this.manager.getRepository(UserAccount).save(row);
  }

  findUserById(id: string): Promise<UserAccount | null> {
    return this.manager.getRepository(UserAccount).findOne({ where: { id } });
  }

  findUserByDirectoryId(directoryId: string): Promise<UserAccount | null> {
    return this.manager.getRepository(UserAccount).findOne({ where: { directoryId } });
  }

  findUserByLoginId(loginId: string): Promise<UserAccount | null> {
    return this.manager.getRepository(UserAccount).findOne({ where: { loginId } });
  }

  saveBatch(row: ImportBatch): Promise<ImportBatch> {
    return this.manager.getRepository(ImportBatch).save(row);
  }

  saveGlobalLogin(row: GlobalLogin): Promise<GlobalLogin> {
    return this.manager.getRepository(GlobalLogin).save(row);
  }

  findGlobalByLoginId(loginId: string): Promise<GlobalLogin | null> {
    return this.manager.getRepository(GlobalLogin).findOne({ where: { loginId } });
  }

  findGlobalByDirectory(tenantId: string, directoryId: string): Promise<GlobalLogin | null> {
    return this.manager.getRepository(GlobalLogin).findOne({ where: { tenantId, directoryId } });
  }

  async removeGlobalLogin(id: string): Promise<void> {
    await this.manager.getRepository(GlobalLogin).delete(id);
  }

  saveProfile(row: UserProfile): Promise<UserProfile> {
    return this.manager.getRepository(UserProfile).save(row);
  }

  findProfileByUserId(userId: string): Promise<UserProfile | null> {
    return this.manager.getRepository(UserProfile).findOne({ where: { userId } });
  }

  findProfileByHandle(handle: string): Promise<UserProfile | null> {
    return this.manager.getRepository(UserProfile).findOne({ where: { handle } });
  }
}
