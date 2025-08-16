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

/** Browse list: hide finished tasks. */
export async function getTasks() {
  const { data, error } = await supabase
    .from("tasks")
    .select(`
      id, title, description, reward, location, category, deadline, contact,
      latitude, longitude, image_url, poster_wallet, poster_email, worker_wallet,
      status, tx_hash, created_at
    `)
    .neq("status", "completed")
    .neq("status", "paid")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
}

/** Accept an OPEN task — race-safe and clear if nothing matched. */
export async function acceptTask(taskId, workerWallet) {
  const { data, error } = await supabase
    .from("tasks")
    .update({ worker_wallet: workerWallet, status: "accepted" })
    .eq("id", taskId)
    .eq("status", "open")       // important: ensure it's still open
    .select()
    .maybeSingle();             // don’t throw “multiple/none” automatically

  if (error) throw error;
  if (!data) {
    // Either: not found, already accepted, completed, or blocked by RLS.
    throw new Error(
      "Task could not be accepted. It may already be taken or your session lacks permission."
    );
  }
  return data;
}

/** Worker submits work from ACCEPTED → SUBMITTED, for the assigned worker only. */
export async function submitWork(taskId, workerWallet) {
  const { data, error } = await supabase
    .from("tasks")
    .update({ status: "submitted" })
    .eq("id", taskId)
    .eq("status", "accepted")
    .eq("worker_wallet", workerWallet)
    .select()
    .maybeSingle();

  if (error) throw error;
  if (!data) {
    throw new Error(
      "Submit failed. Only the assigned worker can submit while status is 'accepted'."
    );
  }
  return data;
}

/** Optional helpers when you wire poster review + payout */
export async function markCompleted(taskId) {
  const { data, error } = await supabase
    .from("tasks")
    .update({ status: "completed" })
    .eq("id", taskId)
    .select()
    .maybeSingle();

  if (error) throw error;
  if (!data) throw new Error("Could not mark completed.");
  return data;
}

export async function markPaid(taskId) {
  const { data, error } = await supabase
    .from("tasks")
    .update({ status: "paid" })
    .eq("id", taskId)
    .select()
    .maybeSingle();

  if (error) throw error;
  if (!data) throw new Error("Could not mark paid.");
  return data;
}
