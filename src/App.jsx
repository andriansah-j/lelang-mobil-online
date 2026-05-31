import React, { useContext, useState } from 'react';
import { AuctionProvider, AuctionContext } from './context/AuctionContext';
import { RoleSwitcher } from './components/RoleSwitcher';
import { AdminPortal } from './views/AdminPortal';
import { SellerPortal } from './views/SellerPortal';
import { InspectorPortal } from './views/InspectorPortal';
import { BuyerPortal } from './views/BuyerPortal';
import { ConductorPortal } from './views/ConductorPortal';
import { HandoverPortal } from './views/HandoverPortal';

function AppContent() {
  const { APP_CONFIG, activeUser, logout, switchUser, users, addUser } = useContext(AuctionContext);
  const [activeMenu, setActiveMenu] = useState('main'); // Tracks current active view/tab in workspace

  // Login/Register Mode State for guest users
  const [authMode, setAuthMode] = useState('login'); // login, register, pending_approval
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [loginError, setLoginError] = useState('');

  // Register Form State
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regAgree, setRegAgree] = useState(false);

  // Automatically reset menu path when active user changes
  React.useEffect(() => {
    setActiveMenu('main');
  }, [activeUser]);

  // Handle Manual Credentials Login
  const handleManualLogin = (e) => {
    e.preventDefault();
    setLoginError('');

    if (!emailInput || !passwordInput) {
      setLoginError('Email dan password wajib diisi!');
      return;
    }

    const foundUser = users.find(u => u.email === emailInput && u.password === passwordInput);
    if (!foundUser) {
      setLoginError('Kombinasi email atau password salah!');
      return;
    }

    if (foundUser.status === 'pending_verification') {
      setAuthMode('pending_approval');
      return;
    }

    if (foundUser.status === 'deactivated') {
      setLoginError('Akun Anda sedang ditangguhkan. Hubungi Super Admin.');
      return;
    }

    switchUser(foundUser.id);
  };

  // Handle Self Registration for Buyers
  const handleSelfRegister = (e) => {
    e.preventDefault();
    if (!regName || !regEmail || !regPhone || !regPassword) {
      alert('Semua kolom wajib diisi!');
      return;
    }
    if (!regAgree) {
      alert('Anda harus menyetujui Syarat & Ketentuan.');
      return;
    }

    if (users.some(u => u.email === regEmail)) {
      alert('Email sudah terdaftar!');
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

  // Determine sidebar navigation links based on role
  const renderSidebarMenu = () => {
    const role = activeUser.role;
    
    if (role === 'admin') {
      return (
        <>
          <button 
            className={`sidebar-item-btn ${activeMenu === 'main' ? 'active' : ''}`}
            onClick={() => setActiveMenu('main')}
          >
            📊 Event Lelang & User
          </button>
          <button 
            className={`sidebar-item-btn ${activeMenu === 'handover' ? 'active' : ''}`}
            onClick={() => setActiveMenu('handover')}
          >
            📦 Post-Auction Handover
          </button>
        </>
      );
    } else if (role === 'inspector admin') {
      return (
        <button 
          className={`sidebar-item-btn ${activeMenu === 'main' ? 'active' : ''}`}
          onClick={() => setActiveMenu('main')}
        >
          🔍 Inspeksi Kendaraan
        </button>
      );
    } else if (role === 'conductor admin') {
      return (
        <button 
          className={`sidebar-item-btn ${activeMenu === 'main' ? 'active' : ''}`}
          onClick={() => setActiveMenu('main')}
        >
          🎙️ Sirkuit Lelang Live
        </button>
      );
    } else if (role === 'user') {
      if (activeUser.type === 'seller') {
        return (
          <button 
            className={`sidebar-item-btn ${activeMenu === 'main' ? 'active' : ''}`}
            onClick={() => setActiveMenu('main')}
          >
            🏢 Dashboard Penjual
          </button>
        );
      } else {
        return (
          <button 
            className={`sidebar-item-btn ${activeMenu === 'main' ? 'active' : ''}`}
            onClick={() => setActiveMenu('main')}
          >
            🛒 Katalog & Live Bid
          </button>
        );
      }
    }
  };

  // Render the core workspace content based on menu select & active user role
  const renderWorkspaceContent = () => {
    const role = activeUser.role;

    if (role === 'admin') {
      if (activeMenu === 'handover') {
        return <HandoverPortal />;
      }
      return <AdminPortal />;
    } else if (role === 'inspector admin') {
      return <InspectorPortal />;
    } else if (role === 'conductor admin') {
      return <ConductorPortal />;
    } else if (role === 'user') {
      if (activeUser.type === 'seller') {
        return <SellerPortal />;
      } else {
        return <BuyerPortal />;
      }
    }
  };

  // Get active role label
  const getRoleLabel = () => {
    if (activeUser.role === 'user') {
      return activeUser.type === 'seller' ? 'Seller Account' : 'Buyer Account';
    }
    return activeUser.role.toUpperCase();
  };

  // ==================== GLOBAL LOGIN / GUEST SCREEN ====================
  if (!activeUser) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'var(--bg-main)', padding: '20px' }}>
        
        {authMode === 'login' && (
          <div className="glass-card" style={{ maxWidth: '440px', width: '100%', padding: '32px' }}>
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <span style={{ fontSize: '32px' }}>🚗</span>
              <h2 style={{ fontFamily: 'Outfit', fontSize: '26px', marginTop: '8px' }}>{APP_CONFIG.appName} System</h2>
              <p>Portal Sistem Informasi & Sirkuit Lelang Mobil Terpadu</p>
            </div>

            {loginError && (
              <div style={{ padding: '10px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--danger-glow)', borderRadius: '8px', color: 'var(--danger)', fontSize: '13px', marginBottom: '16px', textAlign: 'center' }}>
                {loginError}
              </div>
            )}

            <form onSubmit={handleManualLogin}>
              <div className="form-group">
                <label>Alamat Email</label>
                <input 
                  type="email" 
                  className="form-control" 
                  value={emailInput} 
                  onChange={(e) => setEmailInput(e.target.value)} 
                  placeholder={`admin@${APP_CONFIG.emailDomain}`}
                  required 
                />
              </div>
              <div className="form-group" style={{ marginBottom: '24px' }}>
                <label>Kata Sandi</label>
                <input 
                  type="password" 
                  className="form-control" 
                  value={passwordInput} 
                  onChange={(e) => setPasswordInput(e.target.value)} 
                  placeholder="******"
                  required 
                />
              </div>

              <button type="submit" className="btn-primary" style={{ width: '100%', padding: '12px' }}>
                Masuk Sistem
              </button>

              <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '13px', color: 'var(--text-muted)' }}>
                Pembeli Baru?{' '}
                <span 
                  style={{ color: 'var(--primary)', cursor: 'pointer', fontWeight: 'bold', textDecoration: 'underline' }}
                  onClick={() => setAuthMode('register')}
                >
                  Daftar di sini
                </span>
              </div>
            </form>

            {/* Quick Developer Switcher */}
            <div style={{ marginTop: '32px', borderTop: '1px solid var(--border-color)', paddingTop: '20px' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px', fontWeight: 'bold', textAlign: 'center' }}>
                Quick Login Simulation Panel
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <button className="btn-secondary" style={{ padding: '6px', fontSize: '11px' }} onClick={() => switchUser('usr-admin')}>🔑 Admin</button>
                <button className="btn-secondary" style={{ padding: '6px', fontSize: '11px' }} onClick={() => switchUser('usr-insp1')}>🔍 Inspector</button>
                <button className="btn-secondary" style={{ padding: '6px', fontSize: '11px' }} onClick={() => switchUser('usr-cond1')}>🎙️ Conductor</button>
                <button className="btn-secondary" style={{ padding: '6px', fontSize: '11px' }} onClick={() => switchUser('usr-seller1')}>🏢 Seller</button>
                <button className="btn-secondary" style={{ padding: '6px', fontSize: '11px', gridColumn: 'span 2' }} onClick={() => switchUser('usr-buyer1')}>🛒 Buyer (Budi Sukarjan)</button>
              </div>
            </div>
          </div>
        )}

        {authMode === 'register' && (
          <div className="glass-card" style={{ maxWidth: '480px', width: '100%', padding: '32px' }}>
            <h2 style={{ textAlign: 'center', marginBottom: '8px', fontFamily: 'Outfit' }}>Pendaftaran Akun Baru</h2>
            <p style={{ textAlign: 'center', marginBottom: '24px' }}>Daftar sebagai pembeli lelang (Buyer) untuk berpartisipasi menawar.</p>

            <form onSubmit={handleSelfRegister}>
              <div className="form-group">
                <label>Nama Lengkap (Sesuai KTP)*</label>
                <input type="text" className="form-control" placeholder="Budi Sukarjan" value={regName} onChange={(e) => setRegName(e.target.value)} required />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Alamat Email*</label>
                  <input type="email" className="form-control" placeholder="email@domain.com" value={regEmail} onChange={(e) => setRegEmail(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label>Nomor HP*</label>
                  <input type="tel" className="form-control" placeholder="08xxxxx" value={regPhone} onChange={(e) => setRegPhone(e.target.value)} required />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '20px' }}>
                <label>Sandi Keamanan Akun*</label>
                <input type="password" className="form-control" placeholder="Minimal 6 karakter" value={regPassword} onChange={(e) => setRegPassword(e.target.value)} required />
              </div>

              <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', marginBottom: '20px' }}>
                <input type="checkbox" id="reg-agree" checked={regAgree} onChange={(e) => setRegAgree(e.target.checked)} style={{ marginTop: '4px', cursor: 'pointer' }} />
                <label htmlFor="reg-agree" style={{ fontSize: '12px', color: 'var(--text-muted)', cursor: 'pointer' }}>
                  Saya menyetujui seluruh aturan lelang dan verifikasi data kendaraan sesuai ketentuan {APP_CONFIG.appName}.
                </label>
              </div>

              <button type="submit" className="btn-primary" style={{ width: '100%', padding: '12px' }}>
                Ajukan Registrasi Akun
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
          <div className="glass-card" style={{ maxWidth: '440px', width: '100%', padding: '32px', textAlign: 'center' }}>
            <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'var(--warning-glow)', color: 'var(--warning)', display: 'inline-flex', alignItems: 'center', justifySelf: 'center', justifyContent: 'center', marginBottom: '20px' }}>
              <svg width="32" height="32" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2>Menunggu Verifikasi Admin</h2>
            <p style={{ marginTop: '12px', marginBottom: '24px' }}>
              Pendaftaran berhasil! Akun Anda sedang menunggu verifikasi oleh Admin.
              Gunakan simulation panel login sebagai **Admin** untuk menyetujui akun Anda terlebih dahulu.
            </p>
            <button className="btn-primary" style={{ width: '100%' }} onClick={() => setAuthMode('login')}>
              Kembali ke Halaman Login
            </button>
          </div>
        )}

      </div>
    );
  }

  // ==================== RENDER WORKSPACE SESSION ====================
  return (
    <div className="app-container">
      {/* Left Sidebar Menu */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          🚗 <span>{APP_CONFIG.appName}</span>
        </div>
        
        <nav className="sidebar-menu">
          {renderSidebarMenu()}
        </nav>

        {/* Profile Footer with Logout */}
        <div className="sidebar-footer" style={{ flexDirection: 'column', gap: '12px', alignItems: 'stretch', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div className="user-avatar">
              {activeUser.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
            </div>
            <div className="user-info">
              <span className="user-name">{activeUser.name}</span>
              <span className="user-role">{getRoleLabel()}</span>
            </div>
          </div>
          <button 
            className="btn-danger" 
            style={{ width: '100%', padding: '6px', fontSize: '11px', display: 'flex', gap: '6px' }}
            onClick={logout}
          >
            🔒 Keluar (Logout)
          </button>
        </div>
      </aside>

      {/* Right Content Panels */}
      <div style={{ flexGrow: 1 }}>
        <RoleSwitcher />
        <main className="workspace-panel">
          {renderWorkspaceContent()}
        </main>
      </div>
    </div>
  );
}

function App() {
  return (
    <AuctionProvider>
      <AppContent />
    </AuctionProvider>
  );
}

export default App;
