import { Injectable } from '@nestjs/common';
import { getMongoManager } from "typeorm";
import { User } from "./user.entity";
import { CreateUserDto } from "./dto/create-user.dto";
import { MongoEntityManager } from "typeorm/entity-manager/MongoEntityManager";

@Injectable()
export class UsersService {

  protected mongoManager: MongoEntityManager = getMongoManager();

  constructor() {

  }

  public async create(newUserData: CreateUserDto) {
    const newUser = new User();
    newUser.email = newUserData.email;
    newUser.password = newUserData.password;
    return this.mongoManager.save(newUser);
  }

  public async getManyUsers(params?: any) {
    console.log(await this.mongoManager.collectionIndexes(User));
    return this.mongoManager.find(User, params ? params : {});
  }

  public async getOneUser(params: any) {
    return this.mongoManager.findOne(User, params);
  }

}
