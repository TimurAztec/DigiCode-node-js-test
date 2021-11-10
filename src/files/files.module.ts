import { Module, OnModuleInit } from "@nestjs/common";
import { FilesController } from './files.controller';
import { FilesService } from './files.service';

@Module({
  controllers: [FilesController],
  providers: [FilesService]
})
export class FilesModule implements OnModuleInit{

  constructor(private filesService: FilesService) {
  }

  onModuleInit(): any {
    this.filesService.enableScanner();
  }
}
