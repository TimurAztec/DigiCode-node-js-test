import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { UsersService } from "./users.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";

@Controller('users')
export class UsersController {

  constructor(private usersService: UsersService) {
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  async getUsers(@Query() queryParams) {
    return await this.usersService.getManyUsers(queryParams);
  }

}
