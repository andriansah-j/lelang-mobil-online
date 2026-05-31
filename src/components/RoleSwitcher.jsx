import React, { useContext } from 'react';
import { AuctionContext } from '../context/AuctionContext';

export const RoleSwitcher = () => {
  const { APP_CONFIG, users, activeUser, switchUser, cars, auctions } = useContext(AuctionContext);

  const activeAuctionCount = auctions.filter(a => a.status === 'Active').length;
  const pendingInspectionCount = cars.filter(c => c.status === 'NEW').length;
  const allocatedCarsCount = cars.filter(c => c.status === 'ALLOCATED').length;

  return (
    <header className="top-header">
      <div className="top-header-logo-group">
        <span className="top-header-title">{APP_CONFIG.appName} Auction Desk</span>
        
        {/* Mock mini dashboard statistics */}
        <div style={{ display: 'flex', gap: '16px', marginLeft: '24px', fontSize: '12px', borderLeft: '1px solid rgba(255,255,255,0.1)', paddingLeft: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#ff9800' }}></span>
            <span>{pendingInspectionCount} Baru</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#9c27b0' }}></span>
            <span>{allocatedCarsCount} Siap Lelang</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#4caf50' }}></span>
            <span>{activeAuctionCount} Lelang Aktif</span>
          </div>
        </div>
      </div>

      <div className="role-switcher-container">
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '2px' }}>
          <span style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Simulate Login As:
          </span>
          <select 
            className="role-switcher-select"
            value={activeUser.id}
            onChange={(e) => switchUser(e.target.value)}
          >
            {users.map(u => (
              <option key={u.id} value={u.id}>
                {u.name} ({u.role.toUpperCase() === 'USER' ? (u.type === 'buyer' ? 'BUYER' : 'SELLER') : u.role.toUpperCase()})
              </option>
            ))}
          </select>
        </div>
      </div>
    </header>
  );
};
