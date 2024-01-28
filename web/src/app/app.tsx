import { AppLayout } from './app-layout';
// import Home from './home';
import { PaymentPage } from './solana/payment';
import { ClusterProvider } from './cluster/cluster-data-access';
import { SolanaProvider } from './solana/solana-provider';
// import Shop from './shop';

export function App() {
  return (
    <ClusterProvider>
      <SolanaProvider>
        <AppLayout>
          <PaymentPage />
          {/* <Shop /> */}
        </AppLayout>
      </SolanaProvider>
    </ClusterProvider>
  );
}
