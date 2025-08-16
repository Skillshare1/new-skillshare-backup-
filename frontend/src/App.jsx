import React from 'react';
import { usePrivy } from '@privy-io/react-auth';
import Home from "./pages/Home";
import Landing from "./pages/Landing";

function App() {
  const { ready, authenticated } = usePrivy();

  if (!ready) return null;

  const handleStart = () => {
    // This will trigger the wallet connection flow
    // You can customize this based on your needs
    console.log('Launching SkillSnap...');
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {!authenticated ? (
        <Landing onStart={handleStart} />
      ) : (
        <Home />
      )}
    </div>
  );
}

export default App;
