"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongodb_1 = require("mongodb");
const fs = __importStar(require("fs"));
let mongoClient;
let filesCollection;
let tasksCollection;
let TaskWaiter;
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        // @ts-ignore
        mongoClient = yield mongodb_1.MongoClient.connect('mongodb://mongo:27017', { useUnifiedTopology: true });
        filesCollection = yield mongoClient.db("directory-scanner").collection("file");
        tasksCollection = yield mongoClient.db("directory-scanner").collection("task");
        waitForTasks();
    });
}
function waitForTasks() {
    TaskWaiter = setInterval(() => {
        tasksCollection.findOneAndDelete({}).then((modifyResult) => {
            if (modifyResult.ok && modifyResult.value) {
                const taskData = modifyResult.value;
                if (taskData && taskData.eventType) {
                    killTaskWaiter();
                    if (taskData.eventType == "add") {
                        const text = fs.readFileSync(taskData.path).toString();
                        createFile(Object.assign(Object.assign({}, taskData), { text })).then((newFile) => {
                            process.send({ task: taskData.eventType, result: newFile });
                            waitForTasks();
                        });
                    }
                    if (taskData.eventType == "change") {
                        const text = fs.readFileSync(taskData.path).toString();
                        updateFile(Object.assign(Object.assign({}, taskData), { text })).then((updatedFile) => {
                            process.send({ task: taskData.eventType, result: updatedFile });
                            waitForTasks();
                        });
                    }
                    if (taskData.eventType == "unlink") {
                        removeFile(taskData.path).then((removedFile) => {
                            process.send({ task: taskData.eventType, result: removedFile });
                            waitForTasks();
                        });
                    }
                }
            }
        });
    }, 1);
}
function killTaskWaiter() {
    clearInterval(TaskWaiter);
}
function createFile(fileData) {
    return __awaiter(this, void 0, void 0, function* () {
        const file = new Object();
        file.path = fileData.path;
        file.name = fileData.name;
        file.text = fileData.text;
        file.size = fileData.size;
        file.created_at = fileData.created_at;
        file.updated_at = fileData.updated_at;
        return yield filesCollection.insertOne(file);
    });
}
function updateFile(fileData) {
    return __awaiter(this, void 0, void 0, function* () {
        const file = new Object();
        file.path = fileData.path;
        file.name = fileData.name;
        file.text = fileData.text;
        file.size = fileData.size;
        file.created_at = fileData.created_at;
        file.updated_at = fileData.updated_at;
        const replacedFile = yield filesCollection.findOneAndReplace({ path: fileData.path }, file);
        if (!replacedFile.value) {
            return yield filesCollection.insertOne(file);
        }
        return replacedFile;
    });
}
function removeFile(path) {
    return __awaiter(this, void 0, void 0, function* () {
        return yield filesCollection.findOneAndDelete({ path });
    });
}
main().catch(err => console.error(err));
