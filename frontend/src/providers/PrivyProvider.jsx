import { PrivyProvider } from '@privy-io/react-auth';

const PrivyWrapper = ({ children }) => {
  return (
    <PrivyProvider
      appId={import.meta.env.VITE_PRIVY_APP_ID}
      config={{
        loginMethods: ['email'],
        appearance: {
          theme: 'light',
          accentColor: '#6366F1',
        },
      }}
    >
      {children}
    </PrivyProvider>
  );
};

export default PrivyWrapper;
