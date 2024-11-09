import { Backup } from "../validators";
import * as pg from "pg";

export const connectToDb = async (data: Partial<Backup>) => {
  //   console.log(data.password);
  const pool = new pg.Pool({
    user: data.username,
    host: data.host,
    database: data.databaseName,
    port: data.port,
    password: data.password,
  });

  const db = await pool.connect();
  return db;
};