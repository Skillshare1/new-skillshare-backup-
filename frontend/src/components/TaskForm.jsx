// src/components/TaskForm.jsx
import React, { useState, useEffect } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { supabase } from "../lib/supabase";
import { addTask } from "../lib/taskService";

export default function TaskForm({ onTaskPosted }) {
  const { ready, user, login, linkWallet, authenticated } = usePrivy();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({
    title: "", description: "", reward: "",
    location: "", category: "", deadline: "",
    contact: "", latitude: "", longitude: "", image: null,
  });

  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setForm(f => ({
        ...f,
        latitude: String(pos.coords.latitude),
        longitude: String(pos.coords.longitude),
      })),
      () => {}
    );
  }, []);

  const onChange = (e) => {
    const { name, value, files } = e.target;
    setForm(f => ({ ...f, [name]: files ? files[0] : value }));
  };

  const ensureWallet = async () => {
    if (!ready) throw new Error("Auth not ready yet.");
    if (!authenticated) { await login(); throw new Error("Connect wallet then submit again."); }
    if (!user?.wallet?.address) { await linkWallet(); throw new Error("Wallet linked, submit again."); }
    return user.wallet.address;
  };

  const uploadImage = async () => {
    if (!form.image) return null;
    const fileName = `${Date.now()}-${form.image.name}`;
    const { error } = await supabase.storage.from("task-images").upload(fileName, form.image);
    if (error) throw error;
    const { data } = supabase.storage.from("task-images").getPublicUrl(fileName);
    return data.publicUrl || null;
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      const poster = await ensureWallet();
      const image_url = await uploadImage();

      await addTask({
        title: form.title, description: form.description, reward: form.reward,
        location: form.location, category: form.category, deadline: form.deadline || null,
        contact: form.contact, latitude: form.latitude ? Number(form.latitude) : null,
        longitude: form.longitude ? Number(form.longitude) : null, image_url,
        poster_wallet: poster, poster_email: user?.email?.address || "",
        status: "open", tx_hash: `db-${Date.now()}`, created_at: new Date().toISOString(),
      });

      alert("Task posted ✅");
      setForm({
        title: "", description: "", reward: "", location: "",
        category: "", deadline: "", contact: "", latitude: "", longitude: "", image: null,
      });
      onTaskPosted && onTaskPosted();
    } catch (err) {
      console.error(err); alert(err.message || "Failed to post.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4 bg-black text-white p-6 rounded-lg">
      <h2 className="text-xl font-bold">Post a New Task</h2>
      <input name="title" value={form.title} onChange={onChange} placeholder="Title" className="bg-gray-800 px-4 py-2 rounded w-full" required />
      <textarea name="description" value={form.description} onChange={onChange} placeholder="Description" className="bg-gray-800 px-4 py-2 rounded w-full" required />
      <div className="grid grid-cols-2 gap-4">
        <input name="reward" value={form.reward} onChange={onChange} placeholder="Reward (ETH)" className="bg-gray-800 px-4 py-2 rounded w-full" required />
        <input name="deadline" type="date" value={form.deadline} onChange={onChange} className="bg-gray-800 px-4 py-2 rounded w-full" />
        <input name="location" value={form.location} onChange={onChange} placeholder="Location" className="bg-gray-800 px-4 py-2 rounded w-full" />
        <input name="category" value={form.category} onChange={onChange} placeholder="Category" className="bg-gray-800 px-4 py-2 rounded w-full" />
        <input name="contact" value={form.contact} onChange={onChange} placeholder="Contact (email/handle)" className="bg-gray-800 px-4 py-2 rounded w-full" />
        <input name="latitude" value={form.latitude} onChange={onChange} placeholder="Latitude" className="bg-gray-800 px-4 py-2 rounded w-full" />
        <input name="longitude" value={form.longitude} onChange={onChange} placeholder="Longitude" className="bg-gray-800 px-4 py-2 rounded w-full" />
      </div>
      <input type="file" name="image" onChange={onChange} accept="image/*" className="text-white" />
      <button disabled={isSubmitting} className={`px-4 py-2 rounded w-full ${isSubmitting ? "bg-gray-600" : "bg-green-600 hover:bg-green-700"}`}>
        {isSubmitting ? "Posting…" : "Post Task"}
      </button>
    </form>
  );
}
