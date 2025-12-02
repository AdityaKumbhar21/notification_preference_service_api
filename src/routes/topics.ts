import { Router } from "express";
import { requireRole } from "../middlewares/role";
import { container, TYPES } from "../container";
import { TopicController } from "../controllers/topicController";

const topicRouter = Router();

const topicController = container.get<TopicController>(TYPES.TopicController);

topicRouter.post("/create", requireRole("ADMIN"), (req, res) => topicController.createTopic(req, res));

export default topicRouter;