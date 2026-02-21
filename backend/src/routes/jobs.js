import { Router } from "express";
import { getJob, listJobs } from "../store/postgresStore.js";

export const jobsRouter = Router();

jobsRouter.get("/jobs", async (req, res) => {
  try {
    const parsed = Number(req.query.limit || 50);
    const limit = Number.isFinite(parsed) ? Math.min(Math.max(parsed, 1), 200) : 50;
    const jobs = await listJobs(limit);
    res.json({ jobs });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

jobsRouter.get("/jobs/:id", async (req, res) => {
  try {
    const job = await getJob(req.params.id);
    if (!job) return res.status(404).json({ error: "job not found" });
    return res.json(job);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});
