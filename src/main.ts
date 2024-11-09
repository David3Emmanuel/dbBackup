import * as express from "express";
import { dumpSchemaValidator, validate } from "./validators";
import { dumpHandler } from "./db-handlers/globalhander";

const app = express();

// understand json request.
app.use(express.json());

app.post("/dump", validate(dumpSchemaValidator), dumpHandler);

const PORT = 9000;
app.listen(PORT, () => {
  console.log(`Server started on ${PORT}`);
});
