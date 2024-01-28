import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { ReactNode } from 'react';

import { Link } from 'react-router-dom';

export function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '6px 12px',
          backgroundColor: '',
          boxShadow: '0 2px 10px rgba(0, 0, 0, 0.2)',
        }}
      >
        <div>
          <Link to="/">
            <img src="/assets/meta.png" height={70} alt="Solana Logo" />
          </Link>
        </div>
        <div>
          <WalletMultiButton />
        </div>
      </div>
      <div style={{ flexGrow: 1, padding: '6px' }}>{children}</div>
    </div>
  );
}
