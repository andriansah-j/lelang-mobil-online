import React, { useContext, useState } from 'react';
import { AuctionContext } from '../context/AuctionContext';

export const SellerPortal = () => {
  const { APP_CONFIG, cars, activeUser, addCarRequest, confirmRecommendationPrice } = useContext(AuctionContext);
  const [activeTab, setActiveTab] = useState('inventory'); // inventory, request_pickup
  
  // Form State for Request Pickup
  const [plateNo, setPlateNo] = useState('');
  const [maker, setMaker] = useState('Toyota');
  const [model, setModel] = useState('');
  const [type, setType] = useState('');
  const [color, setColor] = useState('Hitam');
  const [year, setYear] = useState('');
  const [transmission, setTransmission] = useState('A/T');
  const [fuel, setFuel] = useState('Bensin');
  const [cc, setCc] = useState('');
  const [odometer, setOdometer] = useState('');
  const [stnk, setStnk] = useState('Ada');
  const [pickupAddress, setPickupAddress] = useState(activeUser.address || '');

  // Confirm Price Modal State
  const [selectedCar, setSelectedCar] = useState(null);
  const [requestedPriceInput, setRequestedPriceInput] = useState('');

  const sellerCars = cars.filter(c => c.sellerId === activeUser.id);

  const handleRequestPickup = (e) => {
    e.preventDefault();
    if (!plateNo || !model || !type || !year || !cc || !odometer || !pickupAddress) {
      alert('Semua kolom wajib diisi!');
      return;
    }

    addCarRequest({
      plateNo: plateNo.replace(/\s+/g, '').toUpperCase(),
      maker,
      model,
      type,
      color,
      year: parseInt(year),
      cc: parseInt(cc),
      transmission,
      fuel,
      odometer: parseInt(odometer),
      stnk,
      pickupAddress
    }, activeUser.id);

    alert('Permintaan penjemputan berhasil dikirim!');
    
    // Reset Form
    setPlateNo('');
    setModel('');
    setType('');
    setYear('');
    setCc('');
    setOdometer('');
    setActiveTab('inventory');
  };

  const openConfirmModal = (car) => {
    setSelectedCar(car);
    setRequestedPriceInput(car.inspection.recommendedPrice);
  };

  const handleConfirmPrice = () => {
    if (!requestedPriceInput) return;
    confirmRecommendationPrice(selectedCar.id, requestedPriceInput);
    alert('Harga starting lelang berhasil dikonfirmasi!');
    setSelectedCar(null);
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1>Seller Dashboard</h1>
          <p>Selamat datang, <strong>{activeUser.name}</strong> dari <strong>{activeUser.company}</strong></p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button 
            className={`btn-secondary ${activeTab === 'inventory' ? 'active' : ''}`}
            style={activeTab === 'inventory' ? { borderColor: 'var(--primary)', color: 'var(--primary)' } : {}}
            onClick={() => setActiveTab('inventory')}
          >
            Stok Kendaraan
          </button>
          <button 
            className={`btn-primary ${activeTab === 'request_pickup' ? 'active' : ''}`}
            onClick={() => setActiveTab('request_pickup')}
          >
            Minta Penjemputan Mobil
          </button>
        </div>
      </div>

      {activeTab === 'inventory' ? (
        <div className="glass-card">
          <h2>Daftar Inventaris Kendaraan Anda</h2>
          {sellerCars.length === 0 ? (
            <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--text-muted)' }}>
              Tidak ada kendaraan terdaftar. Silakan buat permintaan penjemputan baru.
            </div>
          ) : (
            <div className="table-container">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>No Polisi</th>
                    <th>Mobil</th>
                    <th>Warna / Tahun</th>
                    <th>Odometer</th>
                    <th>Status</th>
                    <th>Harga Rekomendasi</th>
                    <th>Harga Awal / Terbentuk</th>
                    <th>Tindakan</th>
                  </tr>
                </thead>
                <tbody>
                  {sellerCars.map(c => (
                    <tr key={c.id}>
                      <td style={{ fontWeight: 'bold' }}>{c.plateNo}</td>
                      <td>{c.maker} {c.model} {c.type}</td>
                      <td>{c.color} / {c.year}</td>
                      <td>{Number(c.odometer || 0).toLocaleString()} km</td>
                      <td>
                        <span className={`badge badge-${c.status.toLowerCase().replace('_complete', '')}`}>
                          {c.status}
                        </span>
                      </td>
                      <td>
                        {c.inspection ? `Rp ${Number(c.inspection.recommendedPrice).toLocaleString()}` : '-'}
                      </td>
                      <td>
                        {c.status === 'SOLD' ? (
                          <span style={{ color: 'var(--success)', fontWeight: 'bold' }}>
                            Rp {Number(c.closingPrice || 0).toLocaleString()}
                          </span>
                        ) : c.startPrice > 0 ? (
                          `Rp ${Number(c.startPrice).toLocaleString()}`
                        ) : (
                          '-'
                        )}
                      </td>
                      <td>
                        {c.status === 'YARD' && c.inspection && (
                          <button 
                            className="btn-primary" 
                            style={{ padding: '6px 12px', fontSize: '12px' }}
                            onClick={() => openConfirmModal(c)}
                          >
                            Konfirmasi Harga
                          </button>
                        )}
                        {c.status === 'NEW' && (
                          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Menunggu Inspeksi</span>
                        )}
                        {c.status === 'STOCK' && (
                          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Menunggu Jadwal Lelang</span>
                        )}
                        {c.status === 'ALLOCATED' && (
                          <span style={{ fontSize: '12px', color: 'var(--primary)' }}>Dialokasikan ke Lot {c.lot}</span>
                        )}
                        {c.status === 'SOLD' && (
                          <span style={{ fontSize: '12px', color: 'var(--success)' }}>Lunas</span>
                        )}
                        {c.status === 'UNSOLD' && (
                          <span style={{ fontSize: '12px', color: 'var(--danger)' }}>Tidak Terjual</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        <div className="glass-card" style={{ maxWidth: '800px', margin: '0 auto' }}>
          <h2>Formulir Permintaan Penjemputan (Pickup Request)</h2>
          <p style={{ marginBottom: '24px' }}>Semua kolom wajib diisi. Kendaraan akan dijemput oleh tim {APP_CONFIG.appName} untuk dibersihkan dan diinspeksi.</p>
          
          <form onSubmit={handleRequestPickup}>
            <div className="form-row">
              <div className="form-group">
                <label>Nomor Polisi (Tanpa Spasi)*</label>
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="Contoh: B1234AGH" 
                  value={plateNo}
                  onChange={(e) => setPlateNo(e.target.value)}
                  required 
                />
              </div>
              <div className="form-group">
                <label>Pabrikan*</label>
                <select 
                  className="form-control"
                  value={maker}
                  onChange={(e) => setMaker(e.target.value)}
                >
                  <option value="Toyota">Toyota</option>
                  <option value="Honda">Honda</option>
                  <option value="Suzuki">Suzuki</option>
                  <option value="Daihatsu">Daihatsu</option>
                  <option value="Mitsubishi">Mitsubishi</option>
                  <option value="Nissan">Nissan</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Model Mobil*</label>
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="Contoh: Avanza, Brio, Vios" 
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  required 
                />
              </div>
              <div className="form-group">
                <label>Tipe Model*</label>
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="Contoh: 1.3G M/T, E A/T" 
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  required 
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Warna*</label>
                <select 
                  className="form-control"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                >
                  <option value="Hitam">Hitam</option>
                  <option value="Silver">Silver</option>
                  <option value="Putih">Putih</option>
                  <option value="Abu-abu">Abu-abu</option>
                  <option value="Merah">Merah</option>
                  <option value="Biru">Biru</option>
                </select>
              </div>
              <div className="form-group">
                <label>Tahun Pembuatan*</label>
                <input 
                  type="number" 
                  className="form-control" 
                  placeholder="Contoh: 2017" 
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  required 
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Transmisi*</label>
                <select 
                  className="form-control"
                  value={transmission}
                  onChange={(e) => setTransmission(e.target.value)}
                >
                  <option value="A/T">A/T (Automatic)</option>
                  <option value="M/T">M/T (Manual)</option>
                  <option value="Other">Lainnya</option>
                </select>
              </div>
              <div className="form-group">
                <label>Bahan Bakar*</label>
                <select 
                  className="form-control"
                  value={fuel}
                  onChange={(e) => setFuel(e.target.value)}
                >
                  <option value="Bensin">Bensin</option>
                  <option value="Diesel">Diesel</option>
                  <option value="Hybrid">Hybrid</option>
                  <option value="Listrik">Listrik</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Kapasitas Mesin (cc)*</label>
                <input 
                  type="number" 
                  className="form-control" 
                  placeholder="Contoh: 1300" 
                  value={cc}
                  onChange={(e) => setCc(e.target.value)}
                  required 
                />
              </div>
              <div className="form-group">
                <label>Odometer (km)*</label>
                <input 
                  type="number" 
                  className="form-control" 
                  placeholder="Contoh: 45000" 
                  value={odometer}
                  onChange={(e) => setOdometer(e.target.value)}
                  required 
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Ketersediaan STNK*</label>
                <select 
                  className="form-control"
                  value={stnk}
                  onChange={(e) => setStnk(e.target.value)}
                >
                  <option value="Ada">Ada (Aktif)</option>
                  <option value="Tidak Ada">Tidak Ada</option>
                  <option value="Kedaluarsa">Ada (Mati Pajak)</option>
                </select>
              </div>
              <div className="form-group">
                <label>Alamat Penjemputan Dealer*</label>
                <input 
                  type="text" 
                  className="form-control" 
                  value={pickupAddress}
                  onChange={(e) => setPickupAddress(e.target.value)}
                  required 
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '24px', justifyContent: 'flex-end' }}>
              <button 
                type="button" 
                className="btn-secondary"
                onClick={() => setActiveTab('inventory')}
              >
                Batal
              </button>
              <button type="submit" className="btn-primary">
                Kirim Permintaan Penjemputan
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Confirm Price Modal */}
      {selectedCar && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">Konfirmasi Harga Rekomendasi</h3>
              <button 
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '20px', cursor: 'pointer' }}
                onClick={() => setSelectedCar(null)}
              >
                &times;
              </button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <p>Tim inspeksi kami telah menilai mobil Anda:</p>
                <div style={{ padding: '16px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  <div style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '8px' }}>
                    {selectedCar.maker} {selectedCar.model} {selectedCar.type} ({selectedCar.year})
                  </div>
                  <div style={{ display: 'flex', gap: '24px', fontSize: '14px' }}>
                    <div>Grade: <span style={{ color: 'var(--primary)', fontWeight: 'bold', fontSize: '16px' }}>{selectedCar.inspection.grade}</span></div>
                    <div>Score Inspeksi: <span style={{ fontWeight: 'bold' }}>{selectedCar.inspection.score}/100</span></div>
                  </div>
                  <div style={{ marginTop: '12px', fontSize: '15px' }}>
                    Harga Rekomendasi: <span style={{ color: 'var(--success)', fontWeight: 'bold' }}>Rp {Number(selectedCar.inspection.recommendedPrice).toLocaleString()}</span>
                  </div>
                </div>
                
                <div className="form-group">
                  <label>Harga Permintaan Anda (Starting Bid Lelang)*</label>
                  <input 
                    type="number" 
                    className="form-control"
                    value={requestedPriceInput}
                    onChange={(e) => setRequestedPriceInput(e.target.value)}
                    placeholder="Masukkan nominal harga lelang"
                  />
                  <small style={{ color: 'var(--text-muted)' }}>
                    Anda boleh mengikuti harga rekomendasi kami atau menyesuaikan ke nominal lain.
                  </small>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setSelectedCar(null)}>Batal</button>
              <button className="btn-primary" onClick={handleConfirmPrice}>Setujui & Konfirmasi</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
