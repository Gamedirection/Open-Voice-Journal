import { Router } from "express";
import { createNote, deleteNote, getNote, getRecording, listNotes, updateNote } from "../store/store.js";

export const notesRouter = Router();

function canAccessRecording(user, recording) {
  if (!user || !recording) return false;
  if (user.role === "admin") return true;
  return Boolean(recording.ownerUserId && recording.ownerUserId === user.id);
}

async function canAccessNote(user, note) {
  if (!user || !note) return false;
  if (user.role === "admin") return true;
  if (note.ownerUserId !== user.id) return false;
  if (!note.recordingId) return true;
  const recording = await getRecording(note.recordingId);
  return canAccessRecording(user, recording);
}

notesRouter.get("/notes", async (req, res) => {
  try {
    const recordingId = req.query.recordingId ? String(req.query.recordingId).trim() : null;
    const includeStandalone = String(req.query.includeStandalone || "true").toLowerCase() !== "false";
    const rows = await listNotes({
      ownerUserId: req.user?.role === "admin" ? "" : req.user?.id || "",
      recordingId,
      includeStandalone
    });
    if (req.user?.role === "admin") {
      if (!recordingId) return res.json({ notes: rows });
      const recording = await getRecording(recordingId);
      if (!recording || !canAccessRecording(req.user, recording)) return res.status(403).json({ error: "forbidden" });
      return res.json({ notes: rows });
    }
    return res.json({ notes: rows.filter((note) => note.ownerUserId === req.user?.id) });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

notesRouter.post("/notes", async (req, res) => {
  try {
    const recordingId = req.body?.recordingId ? String(req.body.recordingId).trim() : null;
    if (recordingId) {
      const recording = await getRecording(recordingId);
      if (!recording) return res.status(404).json({ error: "recording not found" });
      if (!canAccessRecording(req.user, recording)) return res.status(403).json({ error: "forbidden" });
    }
    const created = await createNote({
      ownerUserId: req.user.id,
      recordingId,
      title: String(req.body?.title || "").trim() || "Untitled note",
      markdown: String(req.body?.markdown || "")
    });
    return res.status(201).json({ note: created });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

notesRouter.get("/notes/:id", async (req, res) => {
  try {
    const note = await getNote(req.params.id);
    if (!note) return res.status(404).json({ error: "note not found" });
    if (!(await canAccessNote(req.user, note))) return res.status(403).json({ error: "forbidden" });
    return res.json({ note });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

notesRouter.patch("/notes/:id", async (req, res) => {
  try {
    const note = await getNote(req.params.id);
    if (!note) return res.status(404).json({ error: "note not found" });
    if (!(await canAccessNote(req.user, note))) return res.status(403).json({ error: "forbidden" });
    const nextRecordingId = req.body?.recordingId === undefined
      ? note.recordingId
      : (req.body?.recordingId ? String(req.body.recordingId).trim() : null);
    if (nextRecordingId) {
      const recording = await getRecording(nextRecordingId);
      if (!recording) return res.status(404).json({ error: "recording not found" });
      if (!canAccessRecording(req.user, recording)) return res.status(403).json({ error: "forbidden" });
    }
    const updated = await updateNote(note.id, {
      ...(req.body?.title !== undefined ? { title: String(req.body.title || "").trim() || note.title } : {}),
      ...(req.body?.markdown !== undefined ? { markdown: String(req.body.markdown || "") } : {}),
      ...(req.body?.recordingId !== undefined ? { recordingId: nextRecordingId } : {})
    });
    return res.json({ note: updated });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

notesRouter.delete("/notes/:id", async (req, res) => {
  try {
    const note = await getNote(req.params.id);
    if (!note) return res.status(404).json({ error: "note not found" });
    if (!(await canAccessNote(req.user, note))) return res.status(403).json({ error: "forbidden" });
    await deleteNote(note.id);
    return res.json({ deleted: true, noteId: note.id });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});
