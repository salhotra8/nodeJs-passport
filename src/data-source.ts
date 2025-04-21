import "reflect-metadata";
import { DataSource } from "typeorm";
import { User } from "./entity/User";

export const AppDataSource = new DataSource({
  type: "mysql",
  url:process.env.DB_URL,
  host: "mysql-3bf6cbf1-f5url-ca43.j.aivencloud.com",
  port: 26589,
  username: "nodejs",
  password: process.env.REMOTE_DB_PASSWORD,
  database: "remoteDatabase",
  synchronize: true,
  logging: false,
  entities: [User],
});

