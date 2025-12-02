import { Router } from "express";
import { requireRole } from "../middlewares/role";
import { container, TYPES } from "../container";
import { UserController } from "../controllers/userController";

const userRouter = Router();

const userController = container.get<UserController>(TYPES.UserController);

userRouter.post("/", requireRole("ADMIN"), (req, res) => userController.createUser(req, res));

export default userRouter;