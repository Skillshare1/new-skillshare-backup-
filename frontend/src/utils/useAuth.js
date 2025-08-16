// frontend/utils/useAuth.js
import { usePrivy } from '@privy-io/react-auth';

export const useAuth = () => {
  const { user, authenticated } = usePrivy();

  return {
    walletAddress: user?.wallet?.address || '',
    isAuthenticated: authenticated,
    userEmail: user?.email?.address || '',
  };
};
