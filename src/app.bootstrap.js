import { port } from "../config/config.service.js";
import {
  globalErrorHandling,
  NotFoundException,
} from "./common/utils/index.js";
import { authenticateDB } from "./DB/index.js";
import { authRouter, userRouter } from "./modules/index.js";
import express from "express";
import cors from "cors";
async function bootstrap() {
  const app = express();
  //convert buffer data
  app.use(cors(), express.json());

  //DB connection

  await authenticateDB();

  //application routing
  app.use("/auth", authRouter);

  app.use("/user", userRouter);

  //invalid routing
  app.use("{/*dummy}", (req, res) => {
    NotFoundException("Invalid application routing");
  });

  //error-handling
  app.use(globalErrorHandling);

  app.listen(port, () => console.log(`Example app listening on port ${port}!`));
}
export default bootstrap;
