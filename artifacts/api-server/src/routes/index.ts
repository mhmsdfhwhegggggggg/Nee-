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
  import registrationFormConfigRouter from "./registration-form-config";
  import trainingFormRouter from "./training-form";
  import nassirRouter from "./nassir";
  import universitiesRouter from "./universities";
  import universitySpecialtiesRouter from "./university-specialties";
  import facebookWebhookRouter from "./webhooks/facebook";
  import whatsappWebhookRouter from "./webhooks/whatsapp";
  import telegramWebhookRouter from "./webhooks/telegram";
import trainerApplicationRouter from "./trainer-application";
import trainingSurveyRouter from "./training-survey";

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
  router.use(registrationFormConfigRouter);
  router.use(trainingFormRouter);
  router.use(nassirRouter);
  router.use(universitiesRouter);
  router.use(universitySpecialtiesRouter);
  router.use(facebookWebhookRouter);
  router.use(whatsappWebhookRouter);
  router.use(telegramWebhookRouter);
  router.use(trainerApplicationRouter);
  router.use(trainingSurveyRouter);

  export default router;
  