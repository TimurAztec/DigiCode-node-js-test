import { HttpException, HttpStatus, Injectable, UnauthorizedException } from "@nestjs/common";
import { UsersService } from "../users/users.service";
import { CreateUserDto } from "../users/dto/create-user.dto";
import { JwtService } from "@nestjs/jwt";
import * as crypto from "crypto";

@Injectable()
export class AuthService {

  constructor(
    private usersService: UsersService,
    private jwtService: JwtService
  ) {
  }

  public async signin(userDto: CreateUserDto) {
    const user = await this.usersService.getOneUser({email: userDto.email});
    const clientPassword = await crypto.createHash("sha256").update(userDto.password).digest("hex");
    let tokenPayload;
    if (user && (clientPassword == user.password)) {
      tokenPayload = {
        email: user.email,
        id: user.id,
      };
    } else {
      throw new UnauthorizedException({message: 'Bad creds'});
    }
    return { token: this.jwtService.sign(tokenPayload) };
  }

  public async signup(userDto: CreateUserDto) {
    const candidate = await this.usersService.getOneUser({email: userDto.email});
    if (candidate) {
      throw  new HttpException("User already exist!", HttpStatus.BAD_REQUEST);
    }
    const hash = await crypto.createHash("sha256").update(userDto.password).digest("hex");
    const user = await this.usersService.create({ ...userDto, password: hash });
    const tokenPayload = {
      email: user.email,
      id: user.id,
    };
    return { token: this.jwtService.sign(tokenPayload) };
  }

}
