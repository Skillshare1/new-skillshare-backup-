// src/pages/Home.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Navbar from '../components/Navbar';
import TaskCard from '../components/TaskCard';
import TaskMap from '../components/TaskMap';
import TaskForm from '../components/TaskForm';
import ErrorBoundary from '../components/ErrorBoundary';
import { getTasks } from '../lib/taskService';

export default function Home() {
  const [tasks, setTasks] = useState([]);
  const [activeTab, setActiveTab] = useState('browse'); // 'browse' | 'map' | 'post'
  const [search, setSearch] = useState('');

  const refreshTasks = useCallback(async () => {
    try {
      const data = await getTasks();
      setTasks(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch tasks', err);
    }
  }, []);

  useEffect(() => {
    refreshTasks();
  }, [refreshTasks]);

  const filtered = useMemo(() => {
    const q = (search || '').toLowerCase().trim();
    return (tasks || [])
      // hide finished from Browse/Map by default
      .filter(t => !['paid', 'completed'].includes((t.status || '').toLowerCase()))
      .filter(t => {
        if (!q) return true;
        return (
          (t.title || '').toLowerCase().includes(q) ||
          (t.description || '').toLowerCase().includes(q) ||
          (t.location || '').toLowerCase().includes(q)
        );
      });
  }, [tasks, search]);

  return (
    <div className="min-h-screen bg-[#0b0e13] text-white">
      {/* Fixed navbar */}
      <Navbar onPostClick={() => setActiveTab('post')} />

      {/* Top padding prevents overlap with the fixed navbar */}
      <main className="relative z-0 pt-24 md:pt-28 px-4 md:px-6 max-w-6xl mx-auto w-full">
        {/* Tabs */}
        <div className="flex items-center justify-center mb-6">
          <div className="inline-flex rounded-2xl bg-white/5 backdrop-blur border border-white/10 p-1">
            <button
              onClick={() => setActiveTab('browse')}
              className={`px-4 py-2 rounded-xl text-sm transition ${
                activeTab === 'browse' ? 'bg-white/15' : 'hover:bg-white/10'
              }`}
            >
              Browse
            </button>
            <button
              onClick={() => setActiveTab('map')}
              className={`px-4 py-2 rounded-xl text-sm transition ${
                activeTab === 'map' ? 'bg-white/15' : 'hover:bg-white/10'
              }`}
            >
              Map
            </button>
            <button
              onClick={() => setActiveTab('post')}
              className={`px-4 py-2 rounded-xl text-sm transition ${
                activeTab === 'post' ? 'bg-white/15' : 'hover:bg-white/10'
              }`}
            >
              Post Task
            </button>
          </div>
        </div>

        {/* Content */}
        <ErrorBoundary>
          {activeTab === 'post' && (
            <div className="max-w-2xl mx-auto">
              <TaskForm
                onSuccess={() => {
                  setActiveTab('browse');
                  refreshTasks();
                }}
              />
            </div>
          )}

          {activeTab === 'browse' && (
            <>
              <div className="mb-4">
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search tasks..."
                  className="w-full h-11 rounded-xl bg-white/5 border border-white/10 px-4 outline-none focus:border-white/20"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filtered.map((task) => (
                  <TaskCard
                    key={task.id ?? task.tx_hash ?? task.created_at}
                    task={task}
                  />
                ))}
                {filtered.length === 0 && (
                  <div className="col-span-full text-center text-white/60 py-10">
                    No tasks found.
                  </div>
                )}
              </div>
            </>
          )}

          {activeTab === 'map' && (
            <div className="rounded-xl overflow-hidden">
              <TaskMap tasks={filtered} />
            </div>
          )}
        </ErrorBoundary>
      </main>
    </div>
  );
}
