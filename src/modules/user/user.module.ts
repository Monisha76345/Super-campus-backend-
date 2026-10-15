import { Module, OnModuleInit } from "@nestjs/common";
import { DocumentUploaderModule } from "src/common/document-uploader/document-uploader.module";
import { registerEntities } from "src/core/database/entities.registry";
import { ProfileController } from "./controller/profile.controller";
import { UserController } from "./controller/user.controller";
import { CampusDirectory } from "./entity/campus-directory.model";
import { GlobalLogin } from "./entity/global-login.model";
import { ImportBatch } from "./entity/import-batch.model";
import { UserProfile } from "./entity/profile.model";
import { UserAccount } from "./entity/user.model";
import { ProfileService } from "./service/profile.service";
import { RoleSchemaService } from "./service/role-schema.service";
import { UserDataService } from "./service/user-data.service";
import { UserService } from "./service/user.service";

@Module({
  imports: [DocumentUploaderModule],
  controllers: [UserController, ProfileController],
  providers: [UserDataService, UserService, ProfileService, RoleSchemaService],
  exports: [UserService],
})
export class UserModule implements OnModuleInit {
  onModuleInit(): void {
    registerEntities([CampusDirectory, UserAccount, ImportBatch, GlobalLogin, UserProfile]);
  }
}
