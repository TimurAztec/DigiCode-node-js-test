import { Injectable } from '@nestjs/common';
import * as ChildProcess from "child_process";
import * as path from "path";
import { ChildProcessWithoutNullStreams } from "child_process";
import { getMongoManager } from "typeorm";
import { MongoEntityManager } from "typeorm/entity-manager/MongoEntityManager";
import { File as FileEntity } from "./file.entity";

@Injectable()
export class FilesService {

  protected scanner: ChildProcessWithoutNullStreams;
  protected mongoManager: MongoEntityManager = getMongoManager();

  public async enableScanner(): Promise<void> {
    await this.mongoManager.deleteMany(FileEntity, {})
    // console.log(this.mongoManager.remove(FileEntity));
    this.scanner = ChildProcess.spawn("node", ["./directory-scanner-script/main.js", path.join(process.env.WORKING_DIRECTORY, 'static')]);
    this.scanner.stdout.on('data', (data) => {
      try {
        const scanEvent = JSON.parse(data.toString());
        console.log('Incoming scan event: ', scanEvent);
        if (scanEvent.eventType == "add") this.createFile(scanEvent);
        if (scanEvent.eventType == "change") this.updateFile(scanEvent);
        if (scanEvent.eventType == "unlink") this.removeFile(scanEvent.path);
      } catch (e) {
        console.error('\x1b[31m', data.toString(), e);
      }
    });
  }

  protected async createFile(fileData): Promise<any> {
    const file = new FileEntity();
    file.path = fileData.path;
    file.name = fileData.name;
    file.text = fileData.text;
    file.size = fileData.size;
    file.created_at = fileData.created_at;
    file.updated_at = fileData.updated_at;
    return await this.mongoManager.save(file);
  }

  protected async updateFile(fileData): Promise<any> {
    const file = new FileEntity();
    file.path = fileData.path;
    file.name = fileData.name;
    file.text = fileData.text;
    file.size = fileData.size;
    file.created_at = fileData.created_at;
    file.updated_at = fileData.updated_at;
    return await this.mongoManager.findOneAndReplace(FileEntity, {path: fileData.path} ,file);
  }

  protected async removeFile(path: string): Promise<any> {
    return await this.mongoManager.findOneAndDelete(FileEntity, { path });
  }

}
