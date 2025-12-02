import "reflect-metadata";
import { Container } from "inversify";
import { PrismaClient } from "@prisma/client";
import { TYPES } from "./di-types";
import { DecisionService } from "./services/decision";
import { ValidationService } from "./services/validation";
import { UserController } from "./controllers/userController";
import { OrgController } from "./controllers/orgControllers";
import { GroupController } from "./controllers/groupController";
import { TopicController } from "./controllers/topicController";
import { PreferenceController } from "./controllers/prefernceController";


const container = new Container();


container.bind<PrismaClient>(TYPES.PrismaClient).toConstantValue(new PrismaClient());


container.bind<DecisionService>(TYPES.DecisionService).to(DecisionService).inSingletonScope();
container.bind<ValidationService>(TYPES.ValidationService).to(ValidationService).inSingletonScope();


container.bind<UserController>(TYPES.UserController).to(UserController).inSingletonScope();
container.bind<OrgController>(TYPES.OrgController).to(OrgController).inSingletonScope();
container.bind<GroupController>(TYPES.GroupController).to(GroupController).inSingletonScope();
container.bind<TopicController>(TYPES.TopicController).to(TopicController).inSingletonScope();
container.bind<PreferenceController>(TYPES.PreferenceController).to(PreferenceController).inSingletonScope();

export { container, TYPES };
