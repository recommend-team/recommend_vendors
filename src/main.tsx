import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { App } from './App';
import './index.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Vendors are on patchy mobile data; a brief cache beats a spinner.
      staleTime: 30_000,
      retry: 1,
      // Orders change while the app sits in a pocket, so a returning vendor should get
      // fresh data — unlike the customer app, where refetching mid-conversation is noise.
      refetchOnWindowFocus: true,
    },
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>,
);
