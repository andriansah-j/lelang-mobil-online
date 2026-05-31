import React, { useContext, useState, useEffect } from 'react';
import { AuctionContext } from '../context/AuctionContext';

export const ConductorPortal = () => {
  const {
    cars,
    auctions,
    updateConductorState,
    nextLot,
    placeBid,
    bids,
    activeUser
  } = useContext(AuctionContext);

  const [selectedAuction, setSelectedAuction] = useState(null);

  // Active connected auction details
  const connectedAuction = selectedAuction 
    ? auctions.find(a => a.id === selectedAuction.id)
    : null;

  const carsInAuction = connectedAuction
    ? cars.filter(c => c.auctionId === connectedAuction.id).sort((a, b) => a.lot - b.lot)
    : [];

  const activeCar = connectedAuction && carsInAuction[connectedAuction.currentLotIndex]
    ? carsInAuction[connectedAuction.currentLotIndex]
    : null;

  // Countdown timer effect
  useEffect(() => {
    let timer;
    if (connectedAuction && connectedAuction.lotStatus === 'COUNTDOWN' && connectedAuction.countdown > 0) {
      timer = setTimeout(() => {
        const nextSec = connectedAuction.countdown - 1;
        updateConductorState(connectedAuction.id, nextSec === 0 ? 'SOLD' : 'COUNTDOWN', { countdown: nextSec });
      }, 1000);
    }
    return () => clearTimeout(timer);
  }, [connectedAuction]);

  const handleStartBidding = () => {
    if (!connectedAuction || !activeCar) return;
    updateConductorState(connectedAuction.id, 'BIDDING', { currentBid: activeCar.startPrice });
  };

  const handleOfflineBid = () => {
    if (!connectedAuction || !activeCar) return;
    // Increments current price by 1 million
    const nextAmount = (connectedAuction.currentBid || activeCar.startPrice) + 1000000;
    // Register as offline bidder
    placeBid(connectedAuction.id, activeCar.id, 'OFFLINE', 'Bidder Offline (Floor)', nextAmount);
  };

  const handlePreClosing = () => {
    if (!connectedAuction || !activeCar) return;
    updateConductorState(connectedAuction.id, 'COUNTDOWN', { countdown: 3 });
  };

  const handleSold = () => {
    if (!connectedAuction || !activeCar) return;
    // Set to SOLD
    updateConductorState(connectedAuction.id, 'SOLD');
  };

  const handleUnsold = () => {
    if (!connectedAuction || !activeCar) return;
    updateConductorState(connectedAuction.id, 'UNSOLD');
  };

  const handleNextLot = () => {
    if (!connectedAuction) return;
    nextLot(connectedAuction.id);
  };

  const activeCarBids = activeCar ? bids.filter(b => b.carId === activeCar.id).sort((a,b) => b.amount - a.amount) : [];

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h1>Conductor Live Bidding Console</h1>
        <p>Pemandu Lelang: <strong>{activeUser.name}</strong></p>
      </div>

      {!connectedAuction ? (
        <div className="glass-card">
          <h2>Pilih Sesi Jalur Lelang Aktif</h2>
          <p style={{ marginBottom: '16px' }}>Pilih lelang yang sedang aktif hari ini untuk mulai mengendalikan sirkuit lelang live.</p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
            {auctions.filter(a => a.status === 'Active' || a.status === 'Scheduled').map(auc => (
              <div key={auc.id} className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <span className="badge badge-allocated" style={{ width: 'fit-content' }}>
                  {auc.branch} ({auc.startTime})
                </span>
                <h3 style={{ fontSize: '18px' }}>{auc.name}</h3>
                <p>Pejabat Pemandu: <strong>{auc.auctioneer}</strong></p>
                <p>Total Kendaraan: <strong>{cars.filter(c => c.auctionId === auc.id).length} Unit</strong></p>
                
                <button className="btn-primary" style={{ marginTop: '12px' }} onClick={() => setSelectedAuction(auc)}>
                  Hubungkan ke Sirkuit Live
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Header Panel */}
          <div className="glass-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2>Mengendalikan Sirkuit: {connectedAuction.name}</h2>
              <p>Jalur Lokasi: <strong>{connectedAuction.branch}</strong> | Conductor: <strong>{connectedAuction.auctioneer}</strong></p>
            </div>
            <button className="btn-secondary" onClick={() => setSelectedAuction(null)}>Keluar Sesi</button>
          </div>

          <div className="conductor-live-layout">
            
            {/* Live Controller Console */}
            <div className="glass-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', marginBottom: '16px' }}>
                <div>
                  <span style={{ fontSize: '12px', color: 'var(--primary)', fontWeight: 'bold' }}>LOT AKTIF: {connectedAuction.currentLotIndex + 1} / {carsInAuction.length}</span>
                  {activeCar ? (
                    <h3 style={{ fontSize: '20px' }}>{activeCar.maker} {activeCar.model} {activeCar.type} ({activeCar.plateNo})</h3>
                  ) : (
                    <h3 style={{ fontSize: '20px', color: 'var(--text-muted)' }}>Semua Lot Selesai Terlelang</h3>
                  )}
                </div>
                {activeCar && (
                  <span className="badge badge-stock" style={{ fontSize: '13px' }}>
                    Grade {activeCar.inspection?.grade || 'F'}
                  </span>
                )}
              </div>

              {activeCar ? (
                <div>
                  {/* Stats Card */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', padding: '16px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', border: '1px solid var(--border-color)', marginBottom: '24px' }}>
                    <div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Harga Awal Start:</div>
                      <div style={{ fontWeight: 'bold', fontSize: '16px' }}>Rp {Number(activeCar.startPrice || 0).toLocaleString()}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Tawaran Bid Saat Ini:</div>
                      <div style={{ fontWeight: '800', fontSize: '20px', color: 'var(--success)' }}>
                        Rp {Number(connectedAuction.currentBid || 0).toLocaleString()}
                      </div>
                    </div>
                  </div>

                  {/* Bidding Buttons */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    
                    {connectedAuction.lotStatus === 'CLOSED' && (
                      <button className="btn-primary" style={{ padding: '16px', fontSize: '18px' }} onClick={handleStartBidding}>
                        🟢 Buka Lelang Lot Ini (Mulai Bidding)
                      </button>
                    )}

                    {(connectedAuction.lotStatus === 'BIDDING' || connectedAuction.lotStatus === 'COUNTDOWN') && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        
                        {/* Offline Hand-Raise Bidder */}
                        <button className="btn-primary" style={{ background: 'var(--secondary)', padding: '14px', fontSize: '16px', boxShadow: 'none' }} onClick={handleOfflineBid}>
                          ✋ Bidder Lantai Offline (Tambah +Rp 1.000.000)
                        </button>
                        
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                          <button className="btn-secondary" style={{ color: 'var(--warning)', borderColor: 'var(--warning-glow)' }} onClick={handlePreClosing}>
                            ⏰ Hitung Mundur (Pra-Penutupan)
                          </button>
                          <button className="btn-danger" onClick={handleUnsold}>
                            ❌ Lewati Lot Ini (Tidak Terjual)
                          </button>
                        </div>
                      </div>
                    )}

                    {connectedAuction.lotStatus === 'COUNTDOWN' && (
                      <div style={{ padding: '16px', background: 'var(--warning-glow)', border: '1px solid var(--warning)', borderRadius: '8px', color: 'var(--warning)', fontWeight: 'bold', textAlign: 'center', fontSize: '18px' }}>
                        Hitung Mundur Bidding: {connectedAuction.countdown} Detik
                      </div>
                    )}

                    {connectedAuction.lotStatus === 'SOLD' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'center' }}>
                        <div style={{ width: '100%', padding: '16px', background: 'var(--success-glow)', border: '2px solid var(--success)', borderRadius: '8px', color: 'var(--success)', fontWeight: 'bold', textAlign: 'center', fontSize: '16px' }}>
                          🏆 UNIT TERJUAL KEPADA {connectedAuction.highestBidderName} ({connectedAuction.highestBidderNipl}) seharga Rp {Number(connectedAuction.currentBid || 0).toLocaleString()}
                        </div>
                        <button className="btn-primary" style={{ width: '100%' }} onClick={handleNextLot}>
                          Lanjut ke Lot Berikutnya &raquo;
                        </button>
                      </div>
                    )}

                    {connectedAuction.lotStatus === 'UNSOLD' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'center' }}>
                        <div style={{ width: '100%', padding: '16px', background: 'rgba(239, 68, 68, 0.1)', border: '2px solid var(--danger)', borderRadius: '8px', color: 'var(--danger)', fontWeight: 'bold', textAlign: 'center', fontSize: '16px' }}>
                          Unit Tidak Terjual (Lewat)
                        </div>
                        <button className="btn-primary" style={{ width: '100%' }} onClick={handleNextLot}>
                          Lanjut ke Lot Berikutnya &raquo;
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--text-muted)' }}>
                  Semua kendaraan dalam sesi lelang ini telah selesai terlelang.
                </div>
              )}
            </div>

            {/* Bidding Logs Feed */}
            <div className="glass-card">
              <h3>Histori Penawaran (Bid Feed)</h3>
              <p style={{ marginBottom: '16px' }}>Bids yang masuk dari aplikasi pembeli (online) maupun sirkuit lantai lelang (offline).</p>
              
              <div className="bid-history-list" style={{ maxHeight: '350px' }}>
                {activeCarBids.length === 0 ? (
                  <div style={{ padding: '20px 0', textAlign: 'center', color: 'var(--text-muted)' }}>Belum ada log penawaran.</div>
                ) : (
                  activeCarBids.map((b, idx) => (
                    <div key={b.id} className={`bid-history-item ${idx === 0 ? 'latest' : ''}`}>
                      <div>{b.buyerName} ({b.buyerNipl})</div>
                      <div>Rp {Number(b.amount || 0).toLocaleString()}</div>
                    </div>
                  ))
                )}
              </div>
            </div>
            
          </div>
        </div>
      )}
    </div>
  );
};
