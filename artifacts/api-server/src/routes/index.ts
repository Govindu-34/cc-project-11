import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import employeesRouter from "./employees";
import attendanceRouter from "./attendance";
import myAttendanceRouter from "./my-attendance";
import statsRouter from "./stats";
import leavesRouter from "./leaves";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(myAttendanceRouter);
router.use(employeesRouter);
router.use(attendanceRouter);
router.use(statsRouter);
router.use(leavesRouter);

export default router;
