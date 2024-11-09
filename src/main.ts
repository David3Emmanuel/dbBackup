import * as express from "express";

const app = express();


// understand json request.
app.use(express.json());


app.post("/dump", (req, res) => {
  console.log(req.body);
  return res.send(req.body);
})


const PORT = 9000;
app.listen(PORT, () => {
  console.log(`Server started on ${PORT}`);
})