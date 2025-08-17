// src/components/TaskForm.jsx
import React, { useEffect, useState } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { addTask } from "../lib/taskService";
import { supabase } from "../lib/supabase";
import BackgroundGradient from "./ui/BackgroundGradient";

const init = {
  title: "",
  description: "",
  reward: "",
  category: "",
  location: "",
  deadline: "",
  contact: "",
  email: "",
  latitude: "",
  longitude: "",
  image_url: "",
};

export default function TaskForm({ onTaskPosted }) {
  const { user, authenticated, login } = usePrivy();
  const [values, setValues] = useState(init);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setError] = useState("");

  useEffect(() => {
    if (!file) return setPreview("");
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const posterWallet =
    user?.wallet?.address ||
    user?.linkedAccounts?.find((a) => a.type === "wallet")?.address ||
    "";

  const onChange = (e) => {
    const { name, value } = e.target;
    setValues((v) => ({ ...v, [name]: value }));
  };

  const pickGeo = () => {
    if (!navigator.geolocation) return alert("Geolocation not supported.");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setValues((v) => ({
          ...v,
          latitude: latitude.toString(),
          longitude: longitude.toString(),
        }));
      },
      () => alert("Unable to fetch location."),
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  async function uploadImageIfAny() {
    if (!file) return "";
    try {
      const path = `tasks/${Date.now()}-${file.name}`;
      const { error } = await supabase.storage.from("tasks").upload(path, file, {
        cacheControl: "3600",
        upsert: false,
      });
      if (error) throw error;
      const { data } = supabase.storage.from("tasks").getPublicUrl(path);
      return data?.publicUrl || "";
    } catch (err) {
      console.warn("image upload failed:", err?.message || err);
      return "";
    }
  }

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (!authenticated) return login();
    if (!values.title?.trim()) return setError("Title is required.");
    if (!values.reward?.trim()) return setError("Reward (in ETH) is required.");

    setLoading(true);
    try {
      const imageUrl = await uploadImageIfAny();
      const payload = {
        ...values,
        image_url: imageUrl || values.image_url || "",
        wallet: posterWallet || values.wallet || "",
        status: "open",
        tx_hash: values.tx_hash || null,
      };
      await addTask(payload);
      setValues(init);
      setFile(null);
      setPreview("");
      onTaskPosted?.();
    } catch (err) {
      setError(err?.message || "Failed to post task.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 text-white">
      <BackgroundGradient className="rounded-2xl">
        <div className="rounded-2xl p-6 sm:p-8">
          {/* header */}
          <div className="mb-6">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs ring-1 ring-white/15">
              <span className="size-2 rounded-full bg-emerald-400" />
              New · On-chain escrow
            </div>
            <h2 className="mt-3 text-2xl sm:text-3xl font-semibold tracking-tight">
              Post a Task
            </h2>
            <p className="mt-1 text-sm text-zinc-300">
              Describe the work, stake the reward later, and get a contributor fast.
            </p>
          </div>

          <form onSubmit={submit} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field>
                <Label>Title</Label>
                <Input
                  name="title"
                  placeholder="Fix API auth bug"
                  value={values.title}
                  onChange={onChange}
                  required
                />
              </Field>

              <Field>
                <Label>Reward (ETH)</Label>
                <Input
                  name="reward"
                  placeholder="0.02"
                  value={values.reward}
                  onChange={onChange}
                  required
                />
              </Field>

              <Field>
                <Label>Category</Label>
                <Input
                  name="category"
                  placeholder="Frontend · API · Docs…"
                  value={values.category}
                  onChange={onChange}
                />
              </Field>

              <Field>
                <Label>Deadline</Label>
                <Input
                  type="datetime-local"
                  name="deadline"
                  value={values.deadline}
                  onChange={onChange}
                />
              </Field>

              <Field>
                <Label>Contact Email</Label>
                <Input
                  type="email"
                  name="email"
                  placeholder="you@domain.com"
                  value={values.email}
                  onChange={onChange}
                />
              </Field>

              <Field>
                <Label>Contact (Alt)</Label>
                <Input
                  name="contact"
                  placeholder="@telegram or discord#0001"
                  value={values.contact}
                  onChange={onChange}
                />
              </Field>
            </div>

            <Field>
              <Label>Description</Label>
              <Textarea
                name="description"
                rows={5}
                placeholder="What needs to be done? Acceptance criteria, links, repo…"
                value={values.description}
                onChange={onChange}
              />
            </Field>

            <Field>
              <Label>Location (optional)</Label>
              <Input
                name="location"
                placeholder="Remote · NYC · EU…"
                value={values.location}
                onChange={onChange}
              />
            </Field>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Field>
                <Label>Latitude</Label>
                <Input
                  name="latitude"
                  placeholder="38.9072"
                  value={values.latitude}
                  onChange={onChange}
                />
              </Field>
              <Field>
                <Label>Longitude</Label>
                <Input
                  name="longitude"
                  placeholder="-77.0369"
                  value={values.longitude}
                  onChange={onChange}
                />
              </Field>
              <Field>
                <Label className="invisible">Pick location</Label>
                <button
                  type="button"
                  onClick={pickGeo}
                  className="h-[42px] w-full rounded-xl bg-zinc-900 hover:bg-zinc-800 text-sm font-medium ring-1 ring-white/10"
                >
                  Use my location
                </button>
              </Field>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field>
                <Label>Cover Image</Label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="block w-full text-sm file:mr-3 file:rounded-md file:border-0 file:bg-zinc-800 file:px-3 file:py-2 file:text-white hover:file:bg-zinc-700"
                />
              </Field>
              <Field>
                <Label>Or Image URL</Label>
                <Input
                  name="image_url"
                  placeholder="https://…"
                  value={values.image_url}
                  onChange={onChange}
                />
              </Field>
            </div>

            {preview && (
              <div className="overflow-hidden rounded-xl ring-1 ring-white/10">
                <img src={preview} alt="preview" className="max-h-56 w-full object-cover" />
              </div>
            )}

            <Field>
              <Label>Poster Wallet</Label>
              <Input value={posterWallet} readOnly placeholder="Connect wallet" />
            </Field>

            {errorMsg && <p className="text-sm text-red-400 -mt-2">{errorMsg}</p>}

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-gradient-to-r from-indigo-500 via-fuchsia-500 to-cyan-400 px-5 py-3 text-sm font-semibold text-black hover:opacity-95 disabled:opacity-60"
              >
                {loading ? "Posting…" : "Post Task"}
              </button>
            </div>
          </form>
        </div>
      </BackgroundGradient>
    </div>
  );
}

/* Presentational helpers */
function Field({ className = "", children }) {
  return <div className={`flex flex-col gap-1.5 ${className}`}>{children}</div>;
}
function Label({ className = "", children }) {
  return <label className={`text-xs text-zinc-400 ${className}`}>{children}</label>;
}
function Input(props) {
  return (
    <input
      {...props}
      className={[
        "h-[42px] rounded-xl bg-zinc-900 text-sm text-white",
        "placeholder:text-zinc-500",
        "ring-1 ring-white/10 focus:ring-2 focus:ring-indigo-500/60 outline-none",
        "px-3",
        props.className || "",
      ].join(" ")}
    />
  );
}
function Textarea(props) {
  return (
    <textarea
      {...props}
      className={[
        "rounded-xl bg-zinc-900 text-sm text-white",
        "placeholder:text-zinc-500",
        "ring-1 ring-white/10 focus:ring-2 focus:ring-indigo-500/60 outline-none",
        "px-3 py-2",
        props.className || "",
      ].join(" ")}
    />
  );
}
