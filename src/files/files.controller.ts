import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { FilesService } from "./files.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";

@Controller('files')
export class FilesController {

  constructor(private filesService: FilesService) {
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  async getFiles(@Query() queryParams) {
    return this.filesService.getFiles(queryParams);
  }

}
