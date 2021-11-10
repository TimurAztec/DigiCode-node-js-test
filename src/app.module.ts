import { Module, OnModuleInit } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { join } from "path";
import { ServeStaticModule } from '@nestjs/serve-static';
import { ConfigModule } from "@nestjs/config";
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { FilesModule } from './files/files.module';
import { Connection, getConnectionManager } from "typeorm";

@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'static'),
    }),
    ConfigModule.forRoot({
      envFilePath: '.env'
    }),
    TypeOrmModule.forRoot({
      type: 'mongodb',
      host: 'localhost',
      port: 27017,
      database: 'directory-scanner',
      useUnifiedTopology: true,
      synchronize: true,
      entities: [join(__dirname, '**', '*.entity.{ts,js}')]
    }),
    AuthModule,
    UsersModule,
    AuthModule,
    FilesModule
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
