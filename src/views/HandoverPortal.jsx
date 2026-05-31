import React, { useContext, useState } from 'react';
import { AuctionContext } from '../context/AuctionContext';

export const HandoverPortal = () => {
  const { APP_CONFIG, cars, updatePaymentStatus, submitHandover, activeUser } = useContext(AuctionContext);
  const [activeTab, setActiveTab] = useState('list'); // list, printing_bast
  
  // Handover modal state
  const [handoverCar, setHandoverCar] = useState(null);
  const [givenBy, setGivenBy] = useState(`Staf ${APP_CONFIG?.appName || 'Lelang Online'}`);
  const [receivedBy, setReceivedBy] = useState('');

  // Bast print preview state
  const [printCar, setPrintCar] = useState(null);

  const soldCars = cars.filter(c => c.status === 'SOLD' || c.status === 'HANDEOVER_COMPLETE');

  const handleSimulatePayment = (carId) => {
    updatePaymentStatus(carId, 'PAID');
    alert('Simulasi: Pembayaran telah dikonfirmasi lunas oleh sistem bank disbursement Virtual Account!');
  };

  const handleOpenHandover = (car) => {
    setHandoverCar(car);
    setGivenBy(activeUser.name || `Staf ${APP_CONFIG.appName}`);
    setReceivedBy(car.winnerName || '');
  };

  const handleSaveHandover = () => {
    if (!givenBy || !receivedBy) {
      alert('Nama pemberi dan penerima wajib diisi!');
      return;
    }
    submitHandover(handoverCar.id, givenBy, receivedBy);
    alert('Penyerahan barang berhasil dikonfirmasi!');
    setHandoverCar(null);
  };

  const handlePrintBast = (car) => {
    setPrintCar(car);
    setActiveTab('printing_bast');
  };

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h1>Post-Auction: Handover & BAST</h1>
        <p>Kelola penyelesaian pembayaran pemenang lelang dan proses serah terima unit kendaraan beserta BPKB.</p>
      </div>

      {activeTab === 'list' ? (
        <div className="glass-card">
          <h2>Daftar Penyelesaian Penyerahan Unit</h2>
          
          {soldCars.length === 0 ? (
            <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--text-muted)' }}>
              Tidak ada mobil yang terjual saat ini. Silakan jalankan lelang di Conductor Board.
            </div>
          ) : (
            <div className="table-container">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>No Polisi</th>
                    <th>Kendaraan</th>
                    <th>Pemenang (NIPL)</th>
                    <th>Harga Terbentuk</th>
                    <th>Pembayaran</th>
                    <th>Status Barang</th>
                    <th>Tindakan</th>
                  </tr>
                </thead>
                <tbody>
                  {soldCars.map(c => (
                    <tr key={c.id}>
                      <td style={{ fontWeight: 'bold' }}>{c.plateNo}</td>
                      <td>{c.maker} {c.model} {c.type}</td>
                      <td>{c.winnerName} ({c.winnerNipl})</td>
                      <td style={{ fontWeight: 'bold', color: 'var(--success)' }}>
                        Rp {c.closingPrice?.toLocaleString()}
                      </td>
                      <td>
                        <span style={{
                          padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold',
                          background: c.paymentStatus === 'PAID' ? 'var(--success-glow)' : 'rgba(239, 68, 68, 0.1)',
                          color: c.paymentStatus === 'PAID' ? 'var(--success)' : 'var(--danger)'
                        }}>
                          {c.paymentStatus}
                        </span>
                      </td>
                      <td>
                        <span className={`badge badge-${c.status.toLowerCase().replace('_complete', '')}`}>
                          {c.status === 'HANDEOVER_COMPLETE' ? 'SERAH TERIMA' : 'TERJUAL'}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          {c.paymentStatus === 'UNPAID' && (
                            <button className="btn-primary" style={{ padding: '6px 12px', fontSize: '12px' }} onClick={() => handleSimulatePayment(c.id)}>
                              Verifikasi Lunas (Bayar)
                            </button>
                          )}
                          {c.paymentStatus === 'PAID' && c.status === 'SOLD' && (
                            <button className="btn-primary" style={{ padding: '6px 12px', fontSize: '12px', background: 'var(--secondary)' }} onClick={() => handleOpenHandover(c)}>
                              Serah Terima Unit
                            </button>
                          )}
                          {c.status === 'HANDEOVER_COMPLETE' && (
                            <button className="btn-secondary" style={{ padding: '6px 12px', fontSize: '12px' }} onClick={() => handlePrintBast(c)}>
                              Cetak BAST Report
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        /* PRINTABLE BAST SCREEN */
        <div className="glass-card" style={{ maxWidth: '800px', margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px', alignItems: 'center' }}>
            <h2>Preview Berita Acara Serah Terima (BAST)</h2>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button className="btn-primary" onClick={() => window.print()}>Cetak / Print PDF</button>
              <button className="btn-secondary" onClick={() => setActiveTab('list')}>Kembali ke Daftar</button>
            </div>
          </div>

          <div className="bast-printable">
            <div className="bast-header">
              <div className="bast-title">{APP_CONFIG.corpName}</div>
              <div>{APP_CONFIG.appName} System</div>
              <div style={{ fontSize: '11px', color: '#6b7280' }}>DOKUMEN RESMI SERAH TERIMA</div>
            </div>

            <div style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '14px', marginBottom: '24px', textDecoration: 'underline' }}>
              BERITA ACARA SERAH TERIMA KENDARAAN (BAST)
            </div>

            <p style={{ color: '#1f2937', marginBottom: '16px' }}>
              Pada hari ini, tanggal <strong>{printCar.handoverDate}</strong>, bertempat di kantor pusat {APP_CONFIG.appName}, kami yang bertanda tangan di bawah ini menyatakan bahwa unit kendaraan lelang telah diserahterimakan dengan rincian berikut:
            </p>

            <table style={{ width: '100%', marginBottom: '20px', fontSize: '12px' }}>
              <tbody>
                <tr><td style={{ width: '160px', padding: '6px 0' }}>Nama Pemenang (Buyer):</td><td><strong>{printCar.winnerName}</strong></td></tr>
                <tr><td style={{ padding: '6px 0' }}>Uang Jaminan NIPL:</td><td>{printCar.winnerNipl}</td></tr>
                <tr><td style={{ padding: '6px 0' }}>Mobil / Tipe:</td><td>{printCar.maker} {printCar.model} {printCar.type} ({printCar.year})</td></tr>
                <tr><td style={{ padding: '6px 0' }}>Nomor Polisi:</td><td><strong>{printCar.plateNo}</strong></td></tr>
                <tr><td style={{ padding: '6px 0' }}>Harga Terbentuk:</td><td><strong>Rp {printCar.closingPrice?.toLocaleString()}</strong></td></tr>
                <tr><td style={{ padding: '6px 0' }}>Status Pembayaran:</td><td>LUNAS (Virtual Account Terverifikasi)</td></tr>
              </tbody>
            </table>

            <div style={{ fontWeight: 'bold', marginTop: '20px', marginBottom: '10px' }}>Checklist Kelengkapan Serah Terima:</div>
            <table className="bast-table">
              <thead>
                <tr>
                  <th>Item Kelengkapan</th>
                  <th>Status Penyerahan</th>
                </tr>
              </thead>
              <tbody>
                <tr><td>Kunci Kontak Utama</td><td>ADA (Orisinil)</td></tr>
                <tr><td>Buku Manual Kendaraan</td><td>ADA</td></tr>
                <tr><td>Buku Servis Berkala</td><td>ADA</td></tr>
                <tr><td>STNK Dokumen Asli</td><td>ADA</td></tr>
                <tr><td>Ban Cadangan / Ban Serep</td><td>ADA</td></tr>
                <tr><td>Perlengkapan Dongkrak</td><td>ADA</td></tr>
              </tbody>
            </table>

            <div className="bast-signatures">
              <div>
                <div>Yang Menyerahkan,</div>
                <div style={{ color: '#9ca3af', fontSize: '11px', marginTop: '4px' }}>{APP_CONFIG.appName} Inventory Team</div>
                <div className="bast-sig-space"></div>
                <div style={{ fontWeight: 'bold', textDecoration: 'underline' }}>{printCar.givenBy}</div>
                <div>Tanggal: {printCar.handoverDate}</div>
              </div>
              <div>
                <div>Yang Menerima (Pemenang),</div>
                <div style={{ color: '#9ca3af', fontSize: '11px', marginTop: '4px' }}>Pembeli Unit</div>
                <div className="bast-sig-space"></div>
                <div style={{ fontWeight: 'bold', textDecoration: 'underline' }}>{printCar.receivedBy}</div>
                <div>Tanggal: {printCar.handoverDate}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Handover Dialog Form */}
      {handoverCar && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h3 className="modal-title">Formulir Konfirmasi Serah Terima Kendaraan</h3>
              <button style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '20px', cursor: 'pointer' }} onClick={() => setHandoverCar(null)}>
                &times;
              </button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <p>Isi nama petugas gudang yang menyerahkan dan pembeli yang menerima unit:</p>
                <div className="form-group">
                  <label>Yang Menyerahkan ({APP_CONFIG.appName} Staff)*</label>
                  <input type="text" className="form-control" value={givenBy} onChange={(e) => setGivenBy(e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Yang Menerima (Pembeli / PIC)*</label>
                  <input type="text" className="form-control" value={receivedBy} onChange={(e) => setReceivedBy(e.target.value)} />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setHandoverCar(null)}>Batal</button>
              <button className="btn-primary" onClick={handleSaveHandover}>Konfirmasi Serah Terima</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
