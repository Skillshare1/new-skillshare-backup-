// src/lib/taskService.js
import { supabase } from "./supabase";

/** Insert new task (no worker_wallet yet). */
export async function addTask(task) {
  const row = {
    title: task.title,
    description: task.description,
    reward: Number(task.reward ?? 0),
    location: task.location ?? "",
    category: task.category ?? "",
    deadline: task.deadline ?? null,
    contact: task.contact ?? "",
    latitude: task.latitude ? Number(task.latitude) : null,
    longitude: task.longitude ? Number(task.longitude) : null,
    image_url: task.image_url ?? null,
    poster_wallet: task.poster_wallet ?? task.wallet ?? "",
    poster_email: task.poster_email ?? task.email ?? "",
    status: task.status ?? "open",
    tx_hash: task.tx_hash ?? "",
    created_at: task.created_at ?? new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("tasks")
    .insert(row)
    .select()
    .maybeSingle();

  if (error) throw error;
  return data;
}

/** Delete a task (used if on-chain funding fails at posting) */
export async function deleteTask(taskId) {
  const { error } = await supabase.from("tasks").delete().eq("id", taskId);
  if (error) throw error;
}

/** Browse list: hide finished tasks. */
export async function getTasks() {
  const { data, error } = await supabase
    .from("tasks")
    .select(`
      id, title, description, reward, location, category, deadline, contact,
      latitude, longitude, image_url, poster_wallet, poster_email, worker_wallet,
      status, tx_hash, created_at,
      submission_url, submission_notes, submission_file_url, submitted_at,
      review_notes, approved_at, payout_tx_hash
    `)
    .neq("status", "completed")
    .neq("status", "paid")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
}

/** Assign a worker and move task to 'accepted'. (poster cannot accept own task) */
export async function acceptTask(taskId, workerWallet) {
  const { data, error } = await supabase
    .from("tasks")
    .update({ worker_wallet: workerWallet, status: "accepted" })
    .eq("id", taskId)
    .eq("status", "open")
    .neq("poster_wallet", workerWallet) // 🚫 poster ≠ worker
    .select()
    .maybeSingle();

  if (error) throw error;
  if (!data) {
    throw new Error(
      "Task could not be accepted. It may already be taken, you're the poster, or your session lacks permission."
    );
  }
  return data;
}

/** Worker submits work with details: ACCEPTED -> SUBMITTED */
export async function submitWork(taskId, workerWallet, { url, notes, fileUrl } = {}) {
  const patch = {
    status: "submitted",
    submission_url: url ?? null,
    submission_notes: notes ?? null,
    submission_file_url: fileUrl ?? null,
    submitted_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("tasks")
    .update(patch)
    .eq("id", taskId)
    .eq("status", "accepted")
    .eq("worker_wallet", workerWallet)
    .select()
    .maybeSingle();

  if (error) throw error;
  if (!data) throw new Error(
    "Submit failed. Only the assigned worker can submit while status is 'accepted'."
  );
  return data;
}

/** Poster approves: SUBMITTED -> COMPLETED */
export async function approveTask(taskId, reviewNotes) {
  const { data, error } = await supabase
    .from("tasks")
    .update({
      status: "completed",
      review_notes: reviewNotes ?? null,
      approved_at: new Date().toISOString(),
    })
    .eq("id", taskId)
    .eq("status", "submitted")
    .select()
    .maybeSingle();

  if (error) throw error;
  if (!data) throw new Error("Could not approve (task not in 'submitted').");
  return data;
}

/** Poster requests changes: SUBMITTED -> ACCEPTED */
export async function requestChanges(taskId, reviewNotes) {
  const { data, error } = await supabase
    .from("tasks")
    .update({
      status: "accepted",
      review_notes: reviewNotes ?? null,
    })
    .eq("id", taskId)
    .eq("status", "submitted")
    .select()
    .maybeSingle();

  if (error) throw error;
  if (!data) throw new Error("Could not request changes (task not in 'submitted').");
  return data;
}

/** After on-chain release succeeds: COMPLETED -> PAID */
export async function markPaid(taskId, payoutTxHash) {
  const { data, error } = await supabase
    .from("tasks")
    .update({ status: "paid", payout_tx_hash: payoutTxHash ?? null })
    .eq("id", taskId)
    .eq("status", "completed")
    .select()
    .maybeSingle();

  if (error) throw error;
  if (!data) throw new Error("Could not mark as paid (task not in 'completed').");
  return data;
}
