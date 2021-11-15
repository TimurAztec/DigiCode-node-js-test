import { Injectable } from '@nestjs/common';
import * as ChildProcess from "child_process";
import * as NodePath from "path";
import { ChildProcessWithoutNullStreams } from "child_process";
import { getMongoManager } from "typeorm";
import { MongoEntityManager } from "typeorm/entity-manager/MongoEntityManager";
import { File as FileEntity } from "./file.entity";
import * as chokidar from "chokidar";
import * as os from "os";

@Injectable()
export class FilesService {

  protected workers: ChildProcessWithoutNullStreams[] = [];
  protected mongoManager: MongoEntityManager = getMongoManager();
  protected FSWatcher: chokidar.FSWatcher;
  protected taskQuery: any[] = [];

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
    console.log(searchParams);
    return await this.mongoManager.find(FileEntity, searchParams);
  }

  public async enableScanner(): Promise<void> {
    await this.mongoManager.deleteMany(FileEntity, {});
    this.FSWatcher = chokidar.watch(process.env.WORKING_DIRECTORY, {
      persistent: true,
      ignoreInitial: false
    });

    this.FSWatcher
      .on("add", (path, stats) => {
        const task: any = {
          eventType: "add",
          path: path,
          name: NodePath.basename(path),
          size: stats.size,
          created_at: stats.birthtime,
          updated_at: stats.mtime,
        }
        this.taskQuery.push(task);
      })
      .on("change", (path, stats) => {
        const task: any = {
          eventType: "change",
          path: path,
          name: NodePath.basename(path),
          size: stats.size,
          created_at: stats.birthtime,
          updated_at: stats.mtime,
        }
        this.taskQuery.push(task);
      })
      .on("unlink", (path, stats) => {
        const task: any = {
          eventType: "unlink",
          path: path
        }
        this.taskQuery.push(task);
      });

    for (let i = 1; i <= os.cpus().length; i++) {
      let worker = ChildProcess.fork("./worker-script/main.js", [process.env.WORKING_DIRECTORY]);
      this.workers.push(worker);
      worker.on("message", (data: any) => {
        if (data.state && data.state == "waiting") {
          if (this.taskQuery.length) {
            worker.send(this.taskQuery.shift());
          }
        } else {
          console.log(`Worker(${i})`, data);
        }
      });
    }
  }

}
