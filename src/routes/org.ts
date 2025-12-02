import { Router } from "express";
import { container, TYPES } from "../container";
import { OrgController } from "../controllers/orgControllers";

const orgRouter = Router();

const orgController = container.get<OrgController>(TYPES.OrgController);

orgRouter.post("/", (req, res) => orgController.createOrg(req, res));
orgRouter.get("/:orgId/customers", (req, res) => orgController.getCustomers(req, res));

export default orgRouter;