import React, { useContext, useState, useEffect } from 'react';
import { AuctionContext } from '../context/AuctionContext';

export const BuyerPortal = () => {
  const {
    APP_CONFIG,
    cars,
    auctions,
    users,
    niplTransactions,
    purchaseNIPL,
    placeBid,
    bids,
    addUser
  } = useContext(AuctionContext);

  // Authentication State inside Buyer Portal
  const [currentBuyer, setCurrentBuyer] = useState(null);
  const [authMode, setAuthMode] = useState('login'); // login, register, pending_approval
  
  // Login Form State
  const [loginEmail, setLoginEmail] = useState(`buyer@${APP_CONFIG.emailDomain}`); // default for quick testing
  const [loginPassword, setLoginPassword] = useState('password');
  const [loginError, setLoginError] = useState('');

  // Registration Form State
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regAgree, setRegAgree] = useState(false);
  const [regCaptcha, setRegCaptcha] = useState(false);

  // Dashboard Tabs State
  const [activeTab, setActiveTab] = useState('catalog'); // catalog, my_nipls, live_bid
  
  // Search Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [brandFilter, setBrandFilter] = useState('Semua');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  
  // Buy NIPL state
  const [niplType, setNiplType] = useState('Regular');
  const [showNiplModal, setShowNiplModal] = useState(false);
  const [pendingVa, setPendingVa] = useState(null);

  // Selected car for detail view
  const [viewingCar, setViewingCar] = useState(null);
  
  // Selected active auction for bidding
  const [activeAuction, setActiveAuction] = useState(null);

  // Auto-connect to active auction if exists
  useEffect(() => {
    const live = auctions.find(a => a.status === 'Active');
    if (live) {
      setActiveAuction(live);
    }
  }, [auctions]);

  // Find active car in bidding
  const activeCar = activeAuction 
    ? cars.filter(c => c.auctionId === activeAuction.id).sort((a,b) => a.lot - b.lot)[activeAuction.currentLotIndex]
    : null;

  // Filter cars for catalog search
  const filteredCars = cars.filter(c => {
    if (c.status === 'NEW' || c.status === 'YARD') return false;

    const matchesSearch = c.model.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          c.maker.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          c.plateNo.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesBrand = brandFilter === 'Semua' || c.maker === brandFilter;
    
    const price = c.startPrice || c.inspection?.recommendedPrice || 0;
    const matchesMinPrice = !minPrice || price >= parseFloat(minPrice);
    const matchesMaxPrice = !maxPrice || price <= parseFloat(maxPrice);

    return matchesSearch && matchesBrand && matchesMinPrice && matchesMaxPrice;
  });

  const handleLogin = (e) => {
    e.preventDefault();
    setLoginError('');

    if (!loginEmail || !loginPassword) {
      setLoginError('Email dan password wajib diisi!');
      return;
    }

    const foundUser = users.find(u => u.email === loginEmail && u.password === loginPassword);
    
    if (!foundUser) {
      setLoginError('Email atau password salah!');
      return;
    }

    if (foundUser.role !== 'user' || foundUser.type !== 'buyer') {
      setLoginError('Hanya akun Pembeli (Buyer) yang dapat masuk ke portal ini.');
      return;
    }

    if (foundUser.status === 'pending_verification') {
      setAuthMode('pending_approval');
      return;
    }

    if (foundUser.status === 'deactivated') {
      setLoginError('Akun Anda ditangguhkan (suspend). Hubungi admin.');
      return;
    }

    setCurrentBuyer(foundUser);
    setActiveTab('catalog');
  };

  const handleRegister = (e) => {
    e.preventDefault();
    if (!regName || !regEmail || !regPhone || !regPassword) {
      alert('Semua kolom wajib diisi!');
      return;
    }

    if (!regAgree) {
      alert('Anda harus menyetujui Syarat & Ketentuan.');
      return;
    }

    if (!regCaptcha) {
      alert('Selesaikan verifikasi captcha "Saya bukan robot".');
      return;
    }

    // Check duplication
    if (users.some(u => u.email === regEmail)) {
      alert('Email sudah digunakan!');
      return;
    }

    addUser({
      name: regName,
      email: regEmail,
      phone: regPhone,
      password: regPassword,
      role: 'user',
      type: 'buyer',
      status: 'pending_verification'
    });

    setAuthMode('pending_approval');
  };

  const handleBuyNIPL = () => {
    if (!currentBuyer) return;
    purchaseNIPL(currentBuyer.id, niplType);
    const vaCode = String(236600000000 + Math.floor(Math.random() * 999999));
    setPendingVa({
      va: vaCode,
      amount: niplType === 'Premium' ? 25000000 : 10000000,
      bank: 'Permata Bank',
      niplCode: (niplType === 'Premium' ? 'PRE' : 'REG') + 'XXX'
    });
    
    // Refresh local currentBuyer state to match updated nipls list in context
    setTimeout(() => {
      const updatedUser = users.find(u => u.id === currentBuyer.id);
      if (updatedUser) {
        setCurrentBuyer(updatedUser);
      }
    }, 100);
  };

  const handlePlaceBid = () => {
    if (!currentBuyer) return;
    const buyerInDb = users.find(u => u.id === currentBuyer.id);
    if (!buyerInDb.nipls || buyerInDb.nipls.length === 0) {
      alert('Anda belum memiliki NIPL! Silakan beli NIPL terlebih dahulu untuk melakukan bidding.');
      return;
    }

    if (!activeAuction || !activeCar) return;

    const currentPrice = activeAuction.currentBid || activeCar.startPrice;
    const newPrice = currentPrice + 1000000;
    
    const niplCode = buyerInDb.nipls[0];
    placeBid(activeAuction.id, activeCar.id, niplCode, currentBuyer.name, newPrice);
  };

  // Re-fetch current buyer NIPLs whenever transactions change
  const userNiplTx = currentBuyer ? niplTransactions.filter(t => t.buyerId === currentBuyer.id) : [];
  const activeCarBids = activeCar ? bids.filter(b => b.carId === activeCar.id).sort((a,b) => b.amount - a.amount) : [];

  // ==================== RENDER LOGIN / REGISTER ====================
  if (!currentBuyer) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '70vh', padding: '20px' }}>
        
        {authMode === 'login' && (
          <div className="glass-card" style={{ maxWidth: '400px', width: '100%' }}>
            <h2 style={{ textAlign: 'center', marginBottom: '8px' }}>Masuk Portal Pembeli</h2>
            <p style={{ textAlign: 'center', marginBottom: '24px' }}>Masukkan akun terdaftar untuk mulai menawar lelang.</p>
            
            {loginError && (
              <div style={{ padding: '10px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--danger-glow)', borderRadius: '8px', color: 'var(--danger)', fontSize: '13px', marginBottom: '16px', textAlign: 'center' }}>
                {loginError}
              </div>
            )}

            <form onSubmit={handleLogin}>
              <div className="form-group">
                <label>Alamat Email</label>
                <input 
                  type="email" 
                  className="form-control" 
                  value={loginEmail} 
                  onChange={(e) => setLoginEmail(e.target.value)} 
                  placeholder={`buyer@${APP_CONFIG.emailDomain}`}
                  required 
                />
              </div>
              <div className="form-group" style={{ marginBottom: '20px' }}>
                <label>Kata Sandi</label>
                <input 
                  type="password" 
                  className="form-control" 
                  value={loginPassword} 
                  onChange={(e) => setLoginPassword(e.target.value)} 
                  placeholder="******"
                  required 
                />
              </div>

              <button type="submit" className="btn-primary" style={{ width: '100%', padding: '12px' }}>
                Masuk Ke Akun
              </button>

              <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '13px', color: 'var(--text-muted)' }}>
                Belum terdaftar?{' '}
                <span 
                  style={{ color: 'var(--primary)', cursor: 'pointer', fontWeight: 'bold', textDecoration: 'underline' }}
                  onClick={() => setAuthMode('register')}
                >
                  Daftar Pembeli Baru
                </span>
              </div>
            </form>
          </div>
        )}

        {authMode === 'register' && (
          <div className="glass-card" style={{ maxWidth: '480px', width: '100%' }}>
            <h2 style={{ textAlign: 'center', marginBottom: '8px' }}>Registrasi Pembeli Online</h2>
            <p style={{ textAlign: 'center', marginBottom: '24px' }}>Isi formulir berikut untuk mengajukan verifikasi NIPL pembeli.</p>

            <form onSubmit={handleRegister}>
              <div className="form-group">
                <label>Nama Lengkap (Sesuai KTP)*</label>
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="Contoh: Budi Sukarjan" 
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  required 
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Alamat Email*</label>
                  <input 
                    type="email" 
                    className="form-control" 
                    placeholder="email@domain.com" 
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    required 
                  />
                </div>
                <div className="form-group">
                  <label>Nomor Handphone*</label>
                  <input 
                    type="tel" 
                    className="form-control" 
                    placeholder="08xxxx" 
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    required 
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '20px' }}>
                <label>Buat Kata Sandi Akun*</label>
                <input 
                  type="password" 
                  className="form-control" 
                  placeholder="Minimal 6 Karakter" 
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  required 
                />
              </div>

              {/* Syarat & Ketentuan Checkbox */}
              <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', marginBottom: '16px' }}>
                <input 
                  type="checkbox" 
                  id="agree-checkbox" 
                  style={{ marginTop: '4px', cursor: 'pointer' }}
                  checked={regAgree}
                  onChange={(e) => setRegAgree(e.target.checked)}
                />
                <label htmlFor="agree-checkbox" style={{ fontSize: '12px', color: 'var(--text-muted)', cursor: 'pointer' }}>
                  Saya menyetujui seluruh **Syarat & Ketentuan** yang berlaku di {APP_CONFIG.appName} System.
                </label>
              </div>

              {/* Captcha Simulation */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', marginBottom: '20px' }}>
                <input 
                  type="checkbox" 
                  id="captcha-checkbox" 
                  style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                  checked={regCaptcha}
                  onChange={(e) => setRegCaptcha(e.target.checked)}
                />
                <label htmlFor="captcha-checkbox" style={{ fontSize: '13px', fontWeight: 'bold', cursor: 'pointer' }}>
                  Saya bukan robot (reCAPTCHA)
                </label>
              </div>

              <button type="submit" className="btn-primary" style={{ width: '100%', padding: '12px' }}>
                Ajukan Pendaftaran Pembeli
              </button>

              <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '13px', color: 'var(--text-muted)' }}>
                Sudah punya akun?{' '}
                <span 
                  style={{ color: 'var(--primary)', cursor: 'pointer', fontWeight: 'bold', textDecoration: 'underline' }}
                  onClick={() => setAuthMode('login')}
                >
                  Masuk di sini
                </span>
              </div>
            </form>
          </div>
        )}

        {authMode === 'pending_approval' && (
          <div className="glass-card" style={{ maxWidth: '450px', width: '100%', textAlign: 'center', padding: '32px' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'var(--warning-glow)', color: 'var(--warning)', display: 'inline-flex', alignItems: 'center', justifySelf: 'center', justifyContent: 'center', marginBottom: '20px' }}>
              <svg width="36" height="36" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2>Menunggu Verifikasi Admin</h2>
            <p style={{ marginTop: '12px', marginBottom: '24px' }}>
              Pendaftaran berhasil! Akun Anda saat ini berstatus **pending_verification**. 
              Silakan hubungi atau gunakan simulator **Super Admin** untuk menyetujui akun ini di menu **Manajemen Pengguna**.
            </p>

            <button className="btn-primary" style={{ width: '100%' }} onClick={() => setAuthMode('login')}>
              Kembali ke Login
            </button>
          </div>
        )}

      </div>
    );
  }

  // ==================== RENDER BUYER DASHBOARD ====================
  const buyerInDb = users.find(u => u.id === currentBuyer.id);
  const buyerNipls = buyerInDb ? (buyerInDb.nipls || []) : [];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1>Buyer Portal</h1>
          <p>Selamat datang, <strong>{currentBuyer.name}</strong> | Saldo NIPL Aktif: <strong>{buyerNipls.join(', ') || 'Belum Ada'}</strong></p>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button className={`btn-secondary ${activeTab === 'catalog' ? 'active' : ''}`} onClick={() => { setActiveTab('catalog'); setViewingCar(null); }}>
            Katalog Mobil
          </button>
          <button className={`btn-secondary ${activeTab === 'my_nipls' ? 'active' : ''}`} onClick={() => setActiveTab('my_nipls')}>
            Beli NIPL / Deposit
          </button>
          {activeAuction && (
            <button className="btn-primary" style={{ animation: 'pulse 1s infinite alternate' }} onClick={() => setActiveTab('live_bid')}>
              🔴 Live Bidding Jalur {activeAuction.branch}
            </button>
          )}
          <button className="btn-danger" style={{ padding: '8px 12px', fontSize: '12px' }} onClick={() => setCurrentBuyer(null)}>
            Keluar (Logout)
          </button>
        </div>
      </div>

      {/* Tab 1: Catalog */}
      {activeTab === 'catalog' && !viewingCar && (
        <div style={{ display: 'flex', gap: '24px' }}>
          
          {/* Sidebar Search Filters */}
          <div className="glass-card" style={{ width: '280px', flexShrink: 0, height: 'fit-content' }}>
            <h3 style={{ marginBottom: '16px' }}>Filter Pencarian</h3>
            <div className="form-group">
              <label>Cari Mobil</label>
              <input type="text" className="form-control" placeholder="Contoh: Avanza" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            </div>

            <div className="form-group">
              <label>Pabrikan</label>
              <select className="form-control" value={brandFilter} onChange={(e) => setBrandFilter(e.target.value)}>
                <option value="Semua">Semua Merek</option>
                <option value="Toyota">Toyota</option>
                <option value="Honda">Honda</option>
                <option value="Suzuki">Suzuki</option>
                <option value="Mitsubishi">Mitsubishi</option>
              </select>
            </div>

            <div className="form-group">
              <label>Harga Min (Rp)</label>
              <input type="number" className="form-control" placeholder="0" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} />
            </div>

            <div className="form-group">
              <label>Harga Maks (Rp)</label>
              <input type="number" className="form-control" placeholder="200000000" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} />
            </div>

            <button className="btn-secondary" style={{ width: '100%', marginTop: '12px' }} onClick={() => {
              setSearchQuery('');
              setBrandFilter('Semua');
              setMinPrice('');
              maxPrice('');
            }}>
              Reset Filter
            </button>
          </div>

          {/* Cars List Grid */}
          <div style={{ flexGrow: 1 }}>
            <h2 style={{ marginBottom: '16px' }}>Hasil Pencarian ({filteredCars.length} Unit)</h2>
            {filteredCars.length === 0 ? (
              <div className="glass-card" style={{ padding: '60px 0', textAlign: 'center', color: 'var(--text-muted)' }}>
                Tidak ada mobil yang cocok dengan kriteria pencarian Anda.
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '20px' }}>
                {filteredCars.map(c => {
                  const price = c.startPrice || c.inspection?.recommendedPrice || 0;
                  return (
                    <div key={c.id} className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '16px' }}>
                      <div style={{ height: '140px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <svg width="48" height="48" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124l-.308-4.887a3.375 3.375 0 00-3.35-3.164h-10.72a3.375 3.375 0 00-3.35 3.164l-.308 4.887a1.125 1.125 0 001.09 1.124H3" />
                        </svg>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <span style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--primary)', fontWeight: 'bold' }}>{c.maker}</span>
                          <h3 style={{ fontSize: '16px', margin: '2px 0 0 0', fontFamily: 'Plus Jakarta Sans' }}>{c.model} {c.type}</h3>
                        </div>
                        <span style={{ fontSize: '12px', fontWeight: 'bold', padding: '2px 6px', background: 'rgba(0,240,255,0.1)', color: 'var(--primary)', borderRadius: '4px' }}>
                          Grade {c.inspection?.grade || 'F'}
                        </span>
                      </div>

                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                        Odometer: <strong>{c.odometer.toLocaleString()} km</strong> | Tahun: <strong>{c.year}</strong>
                      </div>

                      <div style={{ marginTop: 'auto', paddingTop: '12px', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Mulai Dari:</div>
                          <div style={{ fontWeight: '800', color: 'var(--success)', fontSize: '15px' }}>Rp {price.toLocaleString()}</div>
                        </div>
                        <button className="btn-secondary" style={{ padding: '6px 12px', fontSize: '12px' }} onClick={() => setViewingCar(c)}>
                          Detail Unit
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Catalog Item Detail */}
      {viewingCar && (
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px', marginBottom: '24px' }}>
            <div>
              <h2>Detail Kendaraan: {viewingCar.maker} {viewingCar.model} ({viewingCar.plateNo})</h2>
              <span className={`badge badge-${viewingCar.status.toLowerCase().replace('_complete', '')}`}>{viewingCar.status}</span>
            </div>
            <button className="btn-secondary" onClick={() => setViewingCar(null)}>Kembali ke Katalog</button>
          </div>

          <div className="grid-cols-2">
            <div>
              <h3>Informasi Teknis Mobil</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '16px' }}>
                <div className="form-group"><label>Merek / Pabrikan</label><div className="form-control" style={{ background: 'rgba(255,255,255,0.02)' }}>{viewingCar.maker}</div></div>
                <div className="form-group"><label>Model & Tipe</label><div className="form-control" style={{ background: 'rgba(255,255,255,0.02)' }}>{viewingCar.model} {viewingCar.type}</div></div>
                <div className="form-group"><label>Tahun Perakitan</label><div className="form-control" style={{ background: 'rgba(255,255,255,0.02)' }}>{viewingCar.year}</div></div>
                <div className="form-group"><label>Warna Eksterior</label><div className="form-control" style={{ background: 'rgba(255,255,255,0.02)' }}>{viewingCar.color}</div></div>
                <div className="form-group"><label>Odometer</label><div className="form-control" style={{ background: 'rgba(255,255,255,0.02)' }}>{viewingCar.odometer.toLocaleString()} km</div></div>
                <div className="form-group"><label>Bahan Bakar & Transmisi</label><div className="form-control" style={{ background: 'rgba(255,255,255,0.02)' }}>{viewingCar.fuel} / {viewingCar.transmission}</div></div>
                <div className="form-group"><label>Kapasitas Mesin</label><div className="form-control" style={{ background: 'rgba(255,255,255,0.02)' }}>{viewingCar.cc} cc</div></div>
                <div className="form-group"><label>Status Surat STNK</label><div className="form-control" style={{ background: 'rgba(255,255,255,0.02)' }}>{viewingCar.stnk}</div></div>
              </div>
            </div>

            <div>
              <h3>Hasil Penilaian Inspeksi</h3>
              {viewingCar.inspection ? (
                <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ display: 'flex', gap: '20px', background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                    <div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Score Total</div>
                      <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{viewingCar.inspection.score}/100</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Grade Akhir</div>
                      <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--primary)' }}>Grade {viewingCar.inspection.grade}</div>
                    </div>
                  </div>

                  <div style={{ fontSize: '13px' }}>
                    <h4 style={{ marginBottom: '8px', fontSize: '14px' }}>Daftar Kerusakan Bodi:</h4>
                    {viewingCar.inspection.defects && viewingCar.inspection.defects.length > 0 ? (
                      <ul>
                        {viewingCar.inspection.defects.map((def, idx) => (
                          <li key={idx} style={{ marginBottom: '4px', color: 'var(--text-muted)' }}>
                            Bodi <strong>{def.area}</strong>: {def.defect} level <strong>{def.level}</strong>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <span style={{ color: 'var(--success)' }}>Tidak ditemukan goresan atau baret berat pada bodi.</span>
                    )}
                  </div>

                  <div style={{ fontSize: '13px', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
                    <strong>Catatan Inspektur:</strong>
                    <p style={{ fontStyle: 'italic', marginTop: '6px' }}>"{viewingCar.inspection.note || 'Tidak ada catatan.'}"</p>
                  </div>
                </div>
              ) : (
                <div style={{ padding: '30px 0', textAlign: 'center', color: 'var(--text-muted)' }}>
                  Data inspeksi tidak tersedia untuk mobil ini.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Buy NIPL */}
      {activeTab === 'my_nipls' && (
        <div className="grid-cols-2">
          {/* Buy Form */}
          <div className="glass-card">
            <h2>Beli Nomor Identifikasi Peserta Lelang (NIPL)</h2>
            <p style={{ marginBottom: '24px' }}>Peserta lelang wajib memiliki NIPL sebagai uang jaminan deposit agar dapat menawar pada sirkuit lelang live.</p>
            
            <div className="form-group">
              <label>Pilih Tipe NIPL</label>
              <select className="form-control" value={niplType} onChange={(e) => setNiplType(e.target.value)}>
                <option value="Regular">Regular NIPL (Rp 10.000.000 - Deposit per mobil)</option>
                <option value="Premium">Premium NIPL (Rp 25.000.000 - Unlimited bid)</option>
              </select>
            </div>

            <button className="btn-primary" style={{ width: '100%', marginTop: '16px' }} onClick={handleBuyNIPL}>
              Ajukan Pembelian NIPL
            </button>
          </div>

          {/* Transactions List */}
          <div className="glass-card">
            <h2>Daftar Deposit / NIPL Anda</h2>
            {userNiplTx.length === 0 ? (
              <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--text-muted)' }}>
                Belum ada transaksi NIPL. Silakan beli untuk melakukan penawaran lelang.
              </div>
            ) : (
              <div className="table-container">
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>Tanggal</th>
                      <th>Kode NIPL</th>
                      <th>Tipe</th>
                      <th>Jumlah VA</th>
                      <th>Nominal</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {userNiplTx.map(t => (
                      <tr key={t.id}>
                        <td>{t.date}</td>
                        <td style={{ fontWeight: 'bold', color: 'var(--primary)' }}>{t.niplCode}</td>
                        <td>{t.type}</td>
                        <td>{t.va}</td>
                        <td>Rp {t.amount.toLocaleString()}</td>
                        <td>
                          <span className="badge badge-sold">{t.status}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 3: Live Bidding Console */}
      {activeTab === 'live_bid' && activeAuction && (
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px', marginBottom: '24px' }}>
            <div>
              <h2>Sesi Lelang Live: {activeAuction.name}</h2>
              <p>Mengudara Langsung dari Cabang: <strong>{activeAuction.branch}</strong></p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>STATUS LOT:</span>
                <span style={{ fontWeight: 'bold', color: activeAuction.lotStatus === 'COUNTDOWN' ? 'var(--warning)' : 'var(--primary)' }}>
                  {activeAuction.lotStatus}
                </span>
              </div>
            </div>
          </div>

          {activeCar ? (
            <div className="conductor-live-layout">
              {/* Active Car info panel */}
              <div className="glass-card" style={{ background: 'rgba(255,255,255,0.015)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <span style={{ fontSize: '12px', color: 'var(--primary)', fontWeight: 'bold' }}>LOT {activeCar.lot}</span>
                    <h2 style={{ fontSize: '24px' }}>{activeCar.maker} {activeCar.model} {activeCar.type}</h2>
                    <p>Odometer: {activeCar.odometer.toLocaleString()} km | Transmisi: {activeCar.transmission}</p>
                  </div>
                  <span style={{ fontSize: '20px', fontWeight: 'bold', padding: '4px 12px', background: 'rgba(0,240,255,0.1)', color: 'var(--primary)', borderRadius: '4px' }}>
                    Grade {activeCar.inspection?.grade || 'F'}
                  </span>
                </div>

                {/* Live bidding stats box */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', margin: '24px 0', padding: '24px', background: 'rgba(0,0,0,0.3)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                  <div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Harga Awal Lot:</div>
                    <div style={{ fontSize: '20px', fontWeight: 'bold' }}>Rp {activeCar.startPrice.toLocaleString()}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Tawaran Tertinggi Saat Ini:</div>
                    <div style={{ fontSize: '24px', fontWeight: '800', color: 'var(--success)' }}>
                      Rp {activeAuction.currentBid.toLocaleString()}
                    </div>
                  </div>
                </div>

                {/* Bidding Button Console */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center' }}>
                  {/* Status Banner */}
                  {activeAuction.highestBidderNipl ? (
                    buyerNipls.includes(activeAuction.highestBidderNipl) ? (
                      <div style={{ width: '100%', padding: '12px', background: 'var(--success-glow)', border: '1px solid var(--success)', borderRadius: '8px', color: 'var(--success)', fontWeight: 'bold', textAlign: 'center' }}>
                        🔥 ANDA MEMIMPIN LELANG LOT INI! (NIPL: {activeAuction.highestBidderNipl})
                      </div>
                    ) : (
                      <div style={{ width: '100%', padding: '12px', background: 'var(--warning-glow)', border: '1px solid var(--warning)', borderRadius: '8px', color: 'var(--warning)', fontWeight: 'bold', textAlign: 'center' }}>
                        ⚠️ ANDA TERTINGGAL! Bid tertinggi saat ini oleh NIPL: {activeAuction.highestBidderNipl}
                      </div>
                    )
                  ) : (
                    <div style={{ width: '100%', padding: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-muted)', textAlign: 'center' }}>
                      Belum ada penawaran bid untuk Lot ini.
                    </div>
                  )}

                  {activeAuction.lotStatus === 'BIDDING' || activeAuction.lotStatus === 'COUNTDOWN' ? (
                    <button 
                      className="btn-primary" 
                      style={{ width: '100%', padding: '16px', fontSize: '20px' }}
                      onClick={handlePlaceBid}
                    >
                      TAWAR SEKARANG (Tambahkan +Rp 1.000.000)
                    </button>
                  ) : activeAuction.lotStatus === 'SOLD' ? (
                    <div style={{ width: '100%', padding: '24px', background: 'rgba(16, 185, 129, 0.1)', border: '2px solid var(--success)', borderRadius: '12px', color: 'var(--success)', fontWeight: 'bold', fontSize: '20px', textAlign: 'center' }}>
                      🎉 UNIT TERJUAL!
                    </div>
                  ) : activeAuction.lotStatus === 'UNSOLD' ? (
                    <div style={{ width: '100%', padding: '24px', background: 'rgba(239, 68, 68, 0.1)', border: '2px solid var(--danger)', borderRadius: '12px', color: 'var(--danger)', fontWeight: 'bold', fontSize: '20px', textAlign: 'center' }}>
                      ❌ LOT LEWAT / TIDAK TERJUAL
                    </div>
                  ) : (
                    <div style={{ color: 'var(--text-muted)', padding: '20px 0' }}>Bidding belum dibuka oleh Conductor.</div>
                  )}
                </div>
              </div>

              {/* Live Bids log panel */}
              <div className="glass-card" style={{ background: 'rgba(255,255,255,0.015)' }}>
                <h3>Log Bid Sesi Ini</h3>
                <div style={{ margin: '16px 0 24px 0' }}>
                  {activeAuction.lotStatus === 'COUNTDOWN' && (
                    <div className="bidding-clock warning">
                      {activeAuction.countdown}
                    </div>
                  )}
                </div>
                
                <h4 style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '8px' }}>Histori Bid Terakhir:</h4>
                <div className="bid-history-list" style={{ maxHeight: '250px' }}>
                  {activeCarBids.length === 0 ? (
                    <div style={{ padding: '20px 0', textAlign: 'center', color: 'var(--text-muted)' }}>Belum ada log bid.</div>
                  ) : (
                    activeCarBids.map((b, idx) => (
                      <div key={b.id} className={`bid-history-item ${idx === 0 ? 'latest' : ''}`}>
                        <div>{b.buyerName} ({b.buyerNipl})</div>
                        <div>Rp {b.amount.toLocaleString()}</div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div style={{ padding: '60px 0', textAlign: 'center', color: 'var(--text-muted)' }}>
              Tidak ada kendaraan aktif saat ini di lelang ini. Menunggu Conductor mengaktifkan Lot berikutnya.
            </div>
          )}
        </div>
      )}

      {/* Buy NIPL Confirmation VA Modal */}
      {pendingVa && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '450px' }}>
            <div className="modal-header">
              <h3 className="modal-title">Tagihan Virtual Account NIPL</h3>
              <button style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '20px', cursor: 'pointer' }} onClick={() => setPendingVa(null)}>
                &times;
              </button>
            </div>
            <div className="modal-body" style={{ textAlign: 'center' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center' }}>
                <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'var(--success-glow)', color: 'var(--success)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="32" height="32" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3>Pemesanan NIPL Berhasil!</h3>
                <p>Transfer deposit jaminan Anda ke nomor rekening virtual bank berikut:</p>

                <div style={{ padding: '16px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)', borderRadius: '8px', width: '100%' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>BANK TUJUAN:</div>
                  <div style={{ fontWeight: 'bold', fontSize: '15px' }}>{pendingVa.bank}</div>
                  
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '12px' }}>NOMOR VIRTUAL ACCOUNT:</div>
                  <div style={{ fontWeight: 'bold', fontSize: '20px', color: 'var(--primary)', letterSpacing: '1px' }}>{pendingVa.va}</div>

                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '12px' }}>NOMINAL DEPOSIT:</div>
                  <div style={{ fontWeight: 'bold', fontSize: '18px', color: 'var(--success)' }}>Rp {pendingVa.amount.toLocaleString()}</div>
                </div>

                <small style={{ color: 'var(--text-muted)' }}>
                  Deposit Anda akan langsung terverifikasi secara otomatis oleh sistem Virtual Account bank.
                </small>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-primary" onClick={() => setPendingVa(null)}>Tutup & Selesai</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
