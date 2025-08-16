import React, { useState, useEffect } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { supabase } from "../lib/supabase";
import { addTask } from "../lib/taskService";
import { getContract } from "../utils/useContract";
import { ethers } from "ethers";

const TaskForm = ({ onTaskPosted }) => {
  const { user, ready } = usePrivy();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [form, setForm] = useState({
    title: "",
    description: "",
    reward: "",            // ETH, e.g. 0.01
    location: "",
    category: "",
    deadline: "",          // yyyy-mm-dd
    contact: "",
    latitude: "",
    longitude: "",
    image: null,
  });

  useEffect(() => {
    // optional preload location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) =>
          setForm((f) => ({
            ...f,
            latitude: String(pos.coords.latitude),
            longitude: String(pos.coords.longitude),
          })),
        () => {}
      );
    }
  }, []);

  const onChange = (e) => {
    const { name, value, files } = e.target;
    setForm((f) => ({ ...f, [name]: files ? files[0] : value }));
  };

  const uploadImage = async () => {
    if (!form.image) return null;
    const fileName = `${Date.now()}-${form.image.name}`;
    const { error } = await supabase
      .storage
      .from("task-images")
      .upload(fileName, form.image);
    if (error) throw error;
    const { data } = supabase.storage.from("task-images").getPublicUrl(fileName);
    return data.publicUrl || null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!ready) return;
    if (!user?.wallet?.address) return alert("Connect wallet first");
    if (!form.title || !form.description || !form.reward) return alert("Fill required fields");

    setIsSubmitting(true);
    try {
      // 1) Blockchain tx (stake)
      const contract = await getContract();
      const deadlineUnix = form.deadline
        ? Math.floor(new Date(`${form.deadline}T00:00:00Z`).getTime() / 1000)
        : 0;

      const tx = await contract.createTask(
        form.title,
        form.description,
        form.location || "",
        form.category || "",
        deadlineUnix,
        { value: ethers.parseEther(String(form.reward)) }
      );
      const receipt = await tx.wait();
      const txHash = receipt?.hash || tx?.hash || "";

      // 2) Upload image (if any)
      const image_url = await uploadImage();

      // 3) DB insert
      await addTask({
        title: form.title,
        description: form.description,
        reward: form.reward,
        location: form.location,
        category: form.category,
        deadline: form.deadline || null,
        contact: form.contact,
        latitude: form.latitude ? Number(form.latitude) : null,
        longitude: form.longitude ? Number(form.longitude) : null,
        image_url,
        // poster identity
        poster_wallet: user?.wallet?.address || "",
        poster_email: user?.email?.address || "",
        // legacy fields (keep for compatibility)
        wallet: user?.wallet?.address || "",
        email: user?.email?.address || "",
        // status + chain
        status: "open",
        tx_hash: txHash,
        created_at: new Date().toISOString(),
      });

      alert("Task posted ✅");
      setForm({
        title: "",
        description: "",
        reward: "",
        location: "",
        category: "",
        deadline: "",
        contact: "",
        latitude: "",
        longitude: "",
        image: null,
      });
      onTaskPosted && onTaskPosted();
    } catch (err) {
      console.error(err);
      alert(`Failed: ${err.message || err}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!ready) return null;

  return (
    <form onSubmit={handleSubmit} className="space-y-4 bg-black text-white p-6 rounded-lg">
      <h2 className="text-xl font-bold">Post a New Task</h2>

      {["title","description","reward","location","category","deadline","contact"].map((f) => (
        <input
          key={f}
          name={f}
          type={f === "deadline" ? "date" : "text"}
          value={form[f]}
          onChange={onChange}
          placeholder={f[0].toUpperCase()+f.slice(1)}
          className="bg-gray-800 text-white px-4 py-2 rounded w-full"
          required={["title","description","reward"].includes(f)}
        />
      ))}

      <div className="grid grid-cols-2 gap-4">
        <input
          name="latitude" value={form.latitude} onChange={onChange}
          placeholder="Latitude" className="bg-gray-800 text-white px-4 py-2 rounded w-full"
        />
        <input
          name="longitude" value={form.longitude} onChange={onChange}
          placeholder="Longitude" className="bg-gray-800 text-white px-4 py-2 rounded w-full"
        />
      </div>

      <input type="file" name="image" onChange={onChange} accept="image/*" className="text-white" />

      <button
        type="submit"
        disabled={isSubmitting}
        className={`px-4 py-2 rounded text-white w-full ${isSubmitting ? "bg-gray-600" : "bg-green-600 hover:bg-green-700"}`}
      >
        {isSubmitting ? "Posting…" : "Post Task"}
      </button>
    </form>
  );
};

export default TaskForm;
