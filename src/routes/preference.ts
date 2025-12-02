import { Router } from "express";
import { requireRole } from "../middlewares/role";
import { container, TYPES } from "../container";
import { PreferenceController } from "../controllers/prefernceController";

const prefRouter = Router();

const preferenceController = container.get<PreferenceController>(TYPES.PreferenceController);

prefRouter.post("/decision", (req, res) => preferenceController.setNotification(req, res));
prefRouter.patch("/groups", requireRole("CUSTOMER"), (req, res) => preferenceController.updateGroupPref(req, res));
prefRouter.patch("/topics", requireRole("CUSTOMER"), (req, res) => preferenceController.updateTopicPref(req, res));
prefRouter.get("/users/:userId", (req, res) => preferenceController.getUserPref(req, res));

export default prefRouter;