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
import nassirRouter from "./nassir";
import facebookWebhookRouter from "./webhooks/facebook";
import whatsappWebhookRouter from "./webhooks/whatsapp";
import telegramWebhookRouter from "./webhooks/telegram";

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
router.use(nassirRouter);
router.use(facebookWebhookRouter);
router.use(whatsappWebhookRouter);
router.use(telegramWebhookRouter);

export default router;
