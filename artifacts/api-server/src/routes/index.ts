import { Router, type IRouter } from "express";
import healthRouter from "./health";
import employeesRouter from "./employees";
import attendanceRouter from "./attendance";
import statsRouter from "./stats";

const router: IRouter = Router();

router.use(healthRouter);
router.use(employeesRouter);
router.use(attendanceRouter);
router.use(statsRouter);

export default router;
