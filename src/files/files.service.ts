import { Injectable } from '@nestjs/common';
import * as ChildProcess from "child_process";
import * as NodePath from "path";
import { ChildProcessWithoutNullStreams } from "child_process";
import { getMongoManager } from "typeorm";
import { MongoEntityManager } from "typeorm/entity-manager/MongoEntityManager";
import { File as FileEntity } from "./file.entity";
import * as chokidar from "chokidar";
import * as os from "os";
import { Task } from "./task.entity";
import { FilesModuleNames } from "./misc/files-module-names";

@Injectable()
export class FilesService {

  protected workers: ChildProcessWithoutNullStreams[] = [];
  protected mongoManager: MongoEntityManager = getMongoManager();
  protected FSWatcher: chokidar.FSWatcher;

  public async getFiles(params?: any) {
    let searchParams = {};
    if (params.path) {
      const searchPath = NodePath.join(process.env.WORKING_DIRECTORY, params.path);
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
    return await this.mongoManager.find(FileEntity, searchParams);
  }

  public async enableScanner(): Promise<void> {
    await this.mongoManager.deleteMany(FileEntity, {});
    this.FSWatcher = chokidar.watch(process.env.WORKING_DIRECTORY, {
      ignored: process.env.EXCLUDED_DIRECTORIES,
      persistent: true,
      ignoreInitial: false
    });

    this.FSWatcher
      .on(FilesModuleNames.ScanEvents.Create, (path, stats) => {
        const task: any = new Task();
          task.eventType = FilesModuleNames.ScanEvents.Create;
          task.path = path;
          task.name = NodePath.basename(path);
          task.size = stats.size;
          task.created_at = stats.birthtime;
          task.updated_at = stats.mtime;
        this.mongoManager.save(task);
      })
      .on(FilesModuleNames.ScanEvents.Update, (path, stats) => {
        const task: any = new Task();
          task.eventType = FilesModuleNames.ScanEvents.Update;
          task.path = path;
          task.name = NodePath.basename(path);
          task.size = stats.size;
          task.created_at = stats.birthtime;
          task.updated_at = stats.mtime;
        this.mongoManager.save(task);
      })
      .on(FilesModuleNames.ScanEvents.Delete, (path, stats) => {
        const task: any = new Task();
          task.eventType = FilesModuleNames.ScanEvents.Delete;
          task.path = path;
        this.mongoManager.save(task);
      });

    for (let i = 1; i <= os.cpus().length; i++) {
      let worker = ChildProcess.fork("./worker-script/main.js");
      this.workers.push(worker);
      worker.on("message", (data: any) => {
        console.log('\x1b[36m%s\x1b[0m', `Worker(#${i}) report: `);
        console.log(data);
      });
    }
  }

}
