import { Request, Response } from "express";
import { Backup } from "../validators";
import { DbKind } from "../types";
import { postgresHandler } from "./postgres";
import { mongoHandler } from "./mongo";

export const dumpHandler = async (req: Request, res: Response) => {
  const scheduledBackups = req.body.parameters as Backup[];

  let results: any[] = [];
  for (let backup of scheduledBackups) {
    if (backup.dbKind == DbKind.Postgres) {
      let result = await postgresHandler(backup);
      results.push(result);
    // } else if (backup.dbKind == DbKind.Mongodb) {
    //   let result = await mongoHandler(backup);
    //   results.push(result);
    }
  }
};
