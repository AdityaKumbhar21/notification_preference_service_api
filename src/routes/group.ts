import { Router } from "express";
import { requireRole } from "../middlewares/role";
import { container, TYPES } from "../container";
import { GroupController } from "../controllers/groupController";

const groupRouter = Router();

const groupController = container.get<GroupController>(TYPES.GroupController);

groupRouter.post("/create", requireRole("ADMIN"), (req, res) => groupController.createGroup(req, res));
groupRouter.get("/org/:orgId", requireRole("ADMIN"), (req, res) => groupController.fetchGroups(req, res));

export default groupRouter;