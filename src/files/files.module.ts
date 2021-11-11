import { forwardRef, Module, OnModuleInit } from "@nestjs/common";
import { FilesController } from './files.controller';
import { FilesService } from './files.service';
import { AuthModule } from "../auth/auth.module";

@Module({
  controllers: [FilesController],
  providers: [FilesService],
  imports: [
    forwardRef(() => AuthModule)
  ]
})
export class FilesModule implements OnModuleInit{

  constructor(private filesService: FilesService) {
  }

  onModuleInit(): any {
    this.filesService.enableScanner();
  }
}
