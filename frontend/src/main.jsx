import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';

// Ensure dark mode is applied globally
if (typeof document !== 'undefined') {
  document.documentElement.classList.add('dark');
}

import { PrivyProvider } from '@privy-io/react-auth';
import { WagmiProvider, createConfig, http } from 'wagmi';
import { mainnet } from 'wagmi/chains';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const wagmiConfig = createConfig({
  chains: [mainnet],
  transports: {
    [mainnet.id]: http(),
  },
});

const queryClient = new QueryClient();
document.documentElement.classList.add('dark');

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <PrivyProvider
      appId={import.meta.env.VITE_PRIVY_APP_ID}
      config={{ loginMethods: ['wallet'], appearance: { theme: 'dark' } }}
    >
      <WagmiProvider config={wagmiConfig}>
        <QueryClientProvider client={queryClient}>
          <App />
        </QueryClientProvider>
      </WagmiProvider>
    </PrivyProvider>
  </React.StrictMode>
);
