import { Router, type IRouter } from "express";
import healthRouter from "./health";
import registrationsRouter from "./registrations";
import newsRouter from "./news";
import partnersRouter from "./partners";
import teamRouter from "./team";
import statsRouter from "./stats";
import slidesRouter from "./slides";
import adminRouter from "./admin";
import contactInfoRouter from "./contact-info";
import trainingFormRouter from "./training-form";

const router: IRouter = Router();

router.use(healthRouter);
router.use(registrationsRouter);
router.use(newsRouter);
router.use(partnersRouter);
router.use(teamRouter);
router.use(statsRouter);
router.use(slidesRouter);
router.use(adminRouter);
router.use(contactInfoRouter);
router.use(trainingFormRouter);

export default router;
