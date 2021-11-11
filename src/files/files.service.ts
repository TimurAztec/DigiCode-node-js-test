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

  public async getFiles(params?: any) {
    let searchParams = {};
    if (params.path) {
      const searchPath = path.join(process.env.WORKING_DIRECTORY, params.path);
      await this.mongoManager.dropCollectionIndexes(FileEntity);
      await this.mongoManager.createCollectionIndex(FileEntity, {path: "text"});
      searchParams = {
        ...searchParams,
        $text: { $search: ("\"" + searchPath + "\"") }
      }
    }
    if (params.name) {
      await this.mongoManager.dropCollectionIndexes(FileEntity);
      await this.mongoManager.createCollectionIndex(FileEntity, {name: "text"});
      searchParams = {
        ...searchParams,
        $text: { $search: ("\"" + params.name + "\"") }
      }
    }
    if (params.text) {
      await this.mongoManager.dropCollectionIndexes(FileEntity);
      await this.mongoManager.createCollectionIndex(FileEntity, {text: "text"});
      searchParams = {
        ...searchParams,
        $text: { $search: ("\"" + params.text + "\"") }
      }
    }
    if (params.created_at) {
      let startDate = new Date(params.created_at);
      let endDate = new Date(params.created_at);
      endDate.setDate(endDate.getDate() + 1);
      searchParams = {
        ...searchParams,
        created_at: { $gte: startDate.toISOString(), $lte: endDate.toISOString() }
      }
    }
    if (params.updated_at) {
      let startDate = new Date(params.updated_at);
      let endDate = new Date(params.updated_at);
      endDate.setDate(endDate.getDate() + 1);
      searchParams = {
        ...searchParams,
        updated_at: { $gte: startDate.toISOString(), $lte: endDate.toISOString() }
      }
    }
    console.log(searchParams);
    return await this.mongoManager.find(FileEntity, searchParams);
  }

  public async enableScanner(): Promise<void> {
    await this.mongoManager.deleteMany(FileEntity, {});
    this.scanner = ChildProcess.spawn("node", ["./directory-scanner-script/main.js", process.env.WORKING_DIRECTORY]);
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
    const replacedFile = await this.mongoManager.findOneAndReplace(FileEntity, {path: fileData.path} ,file);
    if (!replacedFile.value) {
      return await this.mongoManager.save(file);
    }
    return replacedFile;
  }

  protected async removeFile(path: string): Promise<any> {
    return await this.mongoManager.findOneAndDelete(FileEntity, { path });
  }

}
