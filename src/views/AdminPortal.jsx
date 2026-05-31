import React, { useContext, useState } from 'react';
import { AuctionContext } from '../context/AuctionContext';

export const AdminPortal = () => {
  const {
    cars,
    auctions,
    users,
    createAuction,
    assignCarToAuction,
    deallocateCar,
    addUser,
    updateUser,
    deleteUser,
    verifyBuyer,
    addCarDirect,
    updateCar,
    deleteCar,
    updateAuction,
    deleteAuction
  } = useContext(AuctionContext);

  const [activeTab, setActiveTab] = useState('auctions'); // auctions, stock, users, vehicles

  // Create Auction Form State
  const [cabang, setCabang] = useState('Jakarta');
  const [tanggal, setTanggal] = useState('');
  const [waktuMulai, setWaktuMulai] = useState('09:00');
  const [waktuSelesai, setWaktuSelesai] = useState('12:00');
  const [tipeLelang, setTipeLelang] = useState('By highest bid');
  const [tipeProduk, setTipeProduk] = useState('Mobil');
  const [pejabat, setPejabat] = useState('Ivan Mobil');

  // Allocation State
  const [allocatingCarId, setAllocatingCarId] = useState(null);
  const [allocatingAuctionId, setAllocatingAuctionId] = useState('');
  const [startPriceInput, setStartPriceInput] = useState('');
  const [laneInput, setLaneInput] = useState('A');
  const [lotInput, setLotInput] = useState('');

  // Add User Form State
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPhone, setNewUserPhone] = useState('');
  const [newUserRole, setNewUserRole] = useState('user');
  const [newUserType, setNewUserType] = useState('buyer'); // buyer, seller
  const [newUserCompany, setNewUserCompany] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('password');

  // Add/Edit Vehicle Form State
  const [plateNo, setPlateNo] = useState('');
  const [sellerId, setSellerId] = useState('');
  const [branch, setBranch] = useState('Jakarta');
  const [maker, setMaker] = useState('Toyota');
  const [model, setModel] = useState('');
  const [type, setType] = useState('');
  const [color, setColor] = useState('Hitam');
  const [year, setYear] = useState('');
  const [transmission, setTransmission] = useState('A/T');
  const [fuel, setFuel] = useState('Bensin');
  const [cc, setCc] = useState('');
  const [odometer, setOdometer] = useState('');
  const [note, setNote] = useState('');
  
  // Paperwork checklists (FSD basic car data)
  const [stnk, setStnk] = useState('Ada');
  const [bpkb, setBpkb] = useState('Ada');
  const [faktur, setFaktur] = useState('Ada');
  const [ktp, setKtp] = useState('Ada');
  const [kwitansi, setKwitansi] = useState('Ada');
  const [keur, setKeur] = useState('Ada');

  // Edit Vehicle Modal State
  const [editingCar, setEditingCar] = useState(null);

  // Edit Auction Modal State
  const [editingAuction, setEditingAuction] = useState(null);

  const handleCreateAuction = (e) => {
    e.preventDefault();
    if (!tanggal) {
      alert('Tanggal lelang wajib diisi!');
      return;
    }
    const name = `${cabang}-${tipeProduk}-${tanggal.split('-').reverse().join('/')}`;
    createAuction({
      name,
      branch: cabang,
      date: tanggal,
      startTime: waktuMulai,
      endTime: waktuSelesai,
      type: tipeLelang,
      productType: tipeProduk,
      auctioneer: pejabat
    });
    alert('Event lelang baru berhasil dibuat!');
    setTanggal('');
  };

  const handleSaveAllocation = (e) => {
    e.preventDefault();
    if (!allocatingAuctionId || !startPriceInput || !laneInput || !lotInput) {
      alert('Lengkapi alokasi lelang!');
      return;
    }

    const lotTaken = cars.some(
      c => c.auctionId === allocatingAuctionId && c.lane === laneInput && c.lot === parseInt(lotInput) && c.id !== allocatingCarId
    );

    if (lotTaken) {
      alert(`Peringatan: Nomor Lot ${lotInput} pada Jalur ${laneInput} untuk lelang ini sudah terisi oleh kendaraan lain!`);
      return;
    }

    assignCarToAuction(allocatingCarId, allocatingAuctionId, startPriceInput, laneInput, lotInput);
    alert('Alokasi Lot lelang disimpan!');
    setAllocatingCarId(null);
  };

  const handleAddUser = (e) => {
    e.preventDefault();
    if (!newUserName || !newUserEmail || !newUserPhone) {
      alert('Mohon isi Nama, Email, dan Telepon!');
      return;
    }
    
    if (users.some(u => u.email === newUserEmail)) {
      alert('Email sudah terdaftar!');
      return;
    }

    addUser({
      name: newUserName,
      email: newUserEmail,
      phone: newUserPhone,
      role: newUserRole,
      type: newUserRole === 'user' ? newUserType : '',
      company: newUserRole === 'user' && newUserType === 'seller' ? newUserCompany : '',
      password: newUserPassword
    });

    alert('User baru berhasil ditambahkan!');
    setNewUserName('');
    setNewUserEmail('');
    setNewUserPhone('');
    setNewUserCompany('');
  };

  // Add Vehicle CRUD Action
  const handleAddCar = (e) => {
    e.preventDefault();
    if (!plateNo || !model || !type || !year || !cc || !odometer) {
      alert('Mohon lengkapi data wajib kendaraan!');
      return;
    }

    const seller = users.find(u => u.id === sellerId);

    addCarDirect({
      plateNo: plateNo.replace(/\s+/g, '').toUpperCase(),
      sellerId: sellerId || 'usr-seller1', // fallback to default
      sellerName: seller ? seller.name : 'Reva Motor',
      branch,
      maker,
      model,
      type,
      color,
      year: parseInt(year),
      transmission,
      fuel,
      cc: parseInt(cc),
      odometer: parseInt(odometer),
      note,
      stnk,
      bpkb,
      faktur,
      ktp,
      kwitansi,
      keur
    });

    alert('Kendaraan lelang berhasil ditambahkan!');
    setPlateNo('');
    setModel('');
    setType('');
    setYear('');
    setCc('');
    setOdometer('');
    setNote('');
  };

  const startCarAllocation = (car) => {
    setAllocatingCarId(car.id);
    setAllocatingAuctionId(auctions[0]?.id || '');
    setStartPriceInput(car.requestPrice || car.inspection?.recommendedPrice || 100000000);
    setLaneInput('A');
    setLotInput(cars.filter(c => c.auctionId === auctions[0]?.id).length + 1);
  };

  const handleDeleteCar = (carId) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus kendaraan ini dari basis data?')) {
      deleteCar(carId);
      alert('Kendaraan berhasil dihapus!');
    }
  };

  const startEditingCar = (car) => {
    setEditingCar(car);
  };

  const handleUpdateCar = (e) => {
    e.preventDefault();
    updateCar(editingCar.id, editingCar);
    alert('Detail kendaraan berhasil diperbarui!');
    setEditingCar(null);
  };

  // Auction Delete CRUD Action
  const handleDeleteAuction = (auctionId) => {
    // Check if any car is allocated to this auction
    const hasAllocatedCars = cars.some(c => c.auctionId === auctionId);
    if (hasAllocatedCars) {
      alert('Peringatan: Tidak dapat menghapus event lelang ini karena ada kendaraan yang telah dialokasikan ke dalamnya!');
      return;
    }

    if (window.confirm('Apakah Anda yakin ingin menghapus jadwal lelang ini?')) {
      deleteAuction(auctionId);
      alert('Jadwal lelang berhasil dihapus!');
    }
  };

  const handleUpdateAuction = (e) => {
    e.preventDefault();
    updateAuction(editingAuction.id, editingAuction);
    alert('Jadwal lelang berhasil diperbarui!');
    setEditingAuction(null);
  };

  const sellers = users.filter(u => u.role === 'user' && u.type === 'seller');

  return (
    <div>
      {/* Tab selection menu */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1>Administration Panel</h1>
          <p>Kendalikan parameter data master, jadwal lelang, manajemen kendaraan, dan otorisasi pengguna.</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button 
            className={`btn-secondary ${activeTab === 'auctions' ? 'active' : ''}`}
            onClick={() => setActiveTab('auctions')}
          >
            Manajemen Lelang
          </button>
          <button 
            className={`btn-secondary ${activeTab === 'vehicles' ? 'active' : ''}`}
            onClick={() => setActiveTab('vehicles')}
          >
            Manajemen Kendaraan
          </button>
          <button 
            className={`btn-secondary ${activeTab === 'stock' ? 'active' : ''}`}
            onClick={() => setActiveTab('stock')}
          >
            Alokasi Stok Lelang
          </button>
          <button 
            className={`btn-secondary ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            Manajemen Pengguna (User)
          </button>
        </div>
      </div>

      {/* Tab 1: Auctions */}
      {activeTab === 'auctions' && (
        <div className="grid-cols-2">
          {/* Create Auction Form */}
          <div className="glass-card">
            <h2>Membuat Jadwal Lelang Baru</h2>
            <form onSubmit={handleCreateAuction}>
              <div className="form-row">
                <div className="form-group">
                  <label>Cabang Lokasi</label>
                  <select className="form-control" value={cabang} onChange={(e) => setCabang(e.target.value)}>
                    <option value="Jakarta">Jakarta (Cilincing)</option>
                    <option value="Bandung">Bandung</option>
                    <option value="Semarang">Semarang</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Tanggal Lelang*</label>
                  <input type="date" className="form-control" value={tanggal} onChange={(e) => setTanggal(e.target.value)} required />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Waktu Mulai</label>
                  <input type="time" className="form-control" value={waktuMulai} onChange={(e) => setWaktuMulai(e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Waktu Selesai</label>
                  <input type="time" className="form-control" value={waktuSelesai} onChange={(e) => setWaktuSelesai(e.target.value)} />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Tipe Lelang</label>
                  <select className="form-control" value={tipeLelang} onChange={(e) => setTipeLelang(e.target.value)}>
                    <option value="By highest bid">By highest bid (Naik-Naik)</option>
                    <option value="By time">Time-based Countdown</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Tipe Produk</label>
                  <select className="form-control" value={tipeProduk} onChange={(e) => setTipeProduk(e.target.value)}>
                    <option value="Mobil">Mobil</option>
                    <option value="Motor">Motor</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Pejabat Lelang / Pemandu (Conductor)</label>
                <select className="form-control" value={pejabat} onChange={(e) => setPejabat(e.target.value)}>
                  {users.filter(u => u.role === 'conductor admin').map(c => (
                    <option key={c.id} value={c.name}>{c.name}</option>
                  ))}
                </select>
              </div>

              <button type="submit" className="btn-primary" style={{ marginTop: '12px', width: '100%' }}>
                Terbitkan Event Lelang
              </button>
            </form>
          </div>

          {/* List Auctions */}
          <div className="glass-card">
            <h2>Daftar Event Lelang Terjadwal</h2>
            <div className="table-container" style={{ maxHeight: '420px', overflowY: 'auto' }}>
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Nama Lelang</th>
                    <th>Cabang</th>
                    <th>Tanggal / Jam</th>
                    <th>Status</th>
                    <th>Tindakan</th>
                  </tr>
                </thead>
                <tbody>
                  {auctions.map(a => (
                    <tr key={a.id}>
                      <td style={{ fontWeight: 'bold' }}>{a.name}</td>
                      <td>{a.branch}</td>
                      <td>{a.date} ({a.startTime})</td>
                      <td>
                        <span style={{
                          padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold',
                          background: a.status === 'Active' ? 'var(--success-glow)' : 'rgba(255,255,255,0.05)',
                          color: a.status === 'Active' ? 'var(--success)' : 'var(--text-muted)'
                        }}>
                          {a.status.toUpperCase()}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '4px' }}>
                          <button className="btn-secondary" style={{ padding: '4px 8px', fontSize: '11px' }} onClick={() => setEditingAuction(a)}>
                            Edit
                          </button>
                          <button className="btn-danger" style={{ padding: '4px 8px', fontSize: '11px' }} onClick={() => handleDeleteAuction(a.id)}>
                            Hapus
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Vehicles CRUD (Management Kendaraan Lelang) */}
      {activeTab === 'vehicles' && (
        <div className="grid-cols-2">
          {/* Add Vehicle Form */}
          <div className="glass-card">
            <h2>Input Data Awal Stok Kendaraan</h2>
            <form onSubmit={handleAddCar}>
              <div className="form-row">
                <div className="form-group">
                  <label>Nomor Polisi*</label>
                  <input type="text" className="form-control" value={plateNo} onChange={(e) => setPlateNo(e.target.value)} placeholder="B1234AGH" required />
                </div>
                <div className="form-group">
                  <label>Pemilik (Seller)*</label>
                  <select className="form-control" value={sellerId} onChange={(e) => setSellerId(e.target.value)}>
                    <option value="">Pilih Penjual/Dealer</option>
                    {sellers.map(s => <option key={s.id} value={s.id}>{s.name} ({s.company})</option>)}
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Cabang Registrasi*</label>
                  <select className="form-control" value={branch} onChange={(e) => setBranch(e.target.value)}>
                    <option value="Jakarta">Jakarta (Cilincing)</option>
                    <option value="Bandung">Bandung</option>
                    <option value="Semarang">Semarang</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Merek Pabrikan*</label>
                  <select className="form-control" value={maker} onChange={(e) => setMaker(e.target.value)}>
                    <option value="Toyota">Toyota</option>
                    <option value="Honda">Honda</option>
                    <option value="Suzuki">Suzuki</option>
                    <option value="Mitsubishi">Mitsubishi</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Model*</label>
                  <input type="text" className="form-control" value={model} onChange={(e) => setModel(e.target.value)} placeholder="Contoh: Avanza" required />
                </div>
                <div className="form-group">
                  <label>Tipe Model*</label>
                  <input type="text" className="form-control" value={type} onChange={(e) => setType(e.target.value)} placeholder="Contoh: 1.3G" required />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Warna*</label>
                  <select className="form-control" value={color} onChange={(e) => setColor(e.target.value)}>
                    <option value="Hitam">Hitam</option>
                    <option value="Silver">Silver</option>
                    <option value="Putih">Putih</option>
                    <option value="Abu-abu">Abu-abu</option>
                    <option value="Merah">Merah</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Tahun Pembuatan*</label>
                  <input type="number" className="form-control" value={year} onChange={(e) => setYear(e.target.value)} required />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Transmisi*</label>
                  <select className="form-control" value={transmission} onChange={(e) => setTransmission(e.target.value)}>
                    <option value="A/T">A/T (Automatic)</option>
                    <option value="M/T">M/T (Manual)</option>
                    <option value="Other">Lainnya</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Bahan Bakar*</label>
                  <select className="form-control" value={fuel} onChange={(e) => setFuel(e.target.value)}>
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
                  <input type="number" className="form-control" value={cc} onChange={(e) => setCc(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label>Odometer (km)*</label>
                  <input type="number" className="form-control" value={odometer} onChange={(e) => setOdometer(e.target.value)} required />
                </div>
              </div>

              {/* Paperwork fields */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', margin: '8px 0' }}>
                <div className="form-group">
                  <label>STNK</label>
                  <select className="form-control" style={{ padding: '6px' }} value={stnk} onChange={(e) => setStnk(e.target.value)}>
                    <option value="Ada">Ada</option>
                    <option value="Tidak Ada">Tidak Ada</option>
                    <option value="Kedaluarsa">Mati</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>BPKB</label>
                  <select className="form-control" style={{ padding: '6px' }} value={bpkb} onChange={(e) => setBpkb(e.target.value)}>
                    <option value="Ada">Ada</option>
                    <option value="Tidak Ada">Tidak Ada</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Faktur</label>
                  <select className="form-control" style={{ padding: '6px' }} value={faktur} onChange={(e) => setFaktur(e.target.value)}>
                    <option value="Ada">Ada</option>
                    <option value="Tidak Ada">Tidak Ada</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Catatan Unit</label>
                <textarea className="form-control" rows="2" value={note} onChange={(e) => setNote(e.target.value)} />
              </div>

              <button type="submit" className="btn-primary" style={{ width: '100%' }}>
                Daftarkan Unit Kendaraan
              </button>
            </form>
          </div>

          {/* Cars List CRUD */}
          <div className="glass-card">
            <h2>Daftar Seluruh Kendaraan</h2>
            <div className="table-container" style={{ maxHeight: '580px', overflowY: 'auto' }}>
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Unit</th>
                    <th>No Polisi</th>
                    <th>Seller</th>
                    <th>Status</th>
                    <th>Tindakan</th>
                  </tr>
                </thead>
                <tbody>
                  {cars.map(c => (
                    <tr key={c.id}>
                      <td>
                        <div style={{ fontWeight: 'bold' }}>{c.maker} {c.model}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Thn {c.year} | {c.color}</div>
                      </td>
                      <td style={{ fontWeight: '600' }}>{c.plateNo}</td>
                      <td>{c.sellerName}</td>
                      <td>
                        <span className={`badge badge-${c.status.toLowerCase().replace('_complete', '')}`}>
                          {c.status}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '4px' }}>
                          <button className="btn-secondary" style={{ padding: '4px 8px', fontSize: '11px' }} onClick={() => startEditingCar(c)}>
                            Edit
                          </button>
                          <button className="btn-danger" style={{ padding: '4px 8px', fontSize: '11px' }} onClick={() => handleDeleteCar(c.id)}>
                            Hapus
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Stock Allocations */}
      {activeTab === 'stock' && (
        <div className="glass-card">
          <h2>Alokasi Kendaraan Ke Jalur & Lot Lelang</h2>
          <p style={{ marginBottom: '16px' }}>Hanya mobil berstatus <strong>STOCK</strong> (setelah diinspeksi & dikonfirmasi oleh seller) yang dapat dialokasikan.</p>

          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>No Polisi</th>
                  <th>Mobil</th>
                  <th>Dealer Asal</th>
                  <th>Grade</th>
                  <th>Harga Rekomendasi</th>
                  <th>Status</th>
                  <th>Lokasi Alokasi</th>
                  <th>Tindakan</th>
                </tr>
              </thead>
              <tbody>
                {cars.filter(c => c.status !== 'NEW').map(c => (
                  <tr key={c.id}>
                    <td style={{ fontWeight: 'bold' }}>{c.plateNo}</td>
                    <td>{c.maker} {c.model} {c.type}</td>
                    <td>{c.sellerName}</td>
                    <td style={{ color: 'var(--primary)', fontWeight: 'bold' }}>{c.inspection?.grade || 'F'}</td>
                    <td>Rp {c.inspection?.recommendedPrice.toLocaleString()}</td>
                    <td>
                      <span className={`badge badge-${c.status.toLowerCase().replace('_complete', '')}`}>{c.status}</span>
                    </td>
                    <td>
                      {c.auctionId ? (
                        <span style={{ fontSize: '13px' }}>
                          Lelang ID: <strong>{c.auctionId.substring(4)}</strong> | Jalur: <strong>{c.lane}</strong> | Lot: <strong>{c.lot}</strong>
                        </span>
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Belum Terjadwal</span>
                      )}
                    </td>
                    <td>
                      {c.status === 'STOCK' && (
                        <button className="btn-primary" style={{ padding: '6px 12px', fontSize: '12px' }} onClick={() => startCarAllocation(c)}>
                          Jadwalkan Lelang
                        </button>
                      )}
                      {c.status === 'ALLOCATED' && (
                        <button className="btn-danger" style={{ padding: '6px 12px', fontSize: '12px' }} onClick={() => deallocateCar(c.id)}>
                          Batalkan Jadwal
                        </button>
                      )}
                      {(c.status === 'SOLD' || c.status === 'UNSOLD') && (
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Lelang Selesai</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 4: User Management CRUD */}
      {activeTab === 'users' && (
        <div className="grid-cols-2">
          {/* User Create Form */}
          <div className="glass-card">
            <h2>Tambah Pengguna Baru</h2>
            <form onSubmit={handleAddUser}>
              <div className="form-group">
                <label>Nama Lengkap*</label>
                <input type="text" className="form-control" value={newUserName} onChange={(e) => setNewUserName(e.target.value)} placeholder="Contoh: Joko Widodo" required />
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Alamat Email*</label>
                  <input type="email" className="form-control" value={newUserEmail} onChange={(e) => setNewUserEmail(e.target.value)} placeholder="email@domain.com" required />
                </div>
                <div className="form-group">
                  <label>Nomor HP*</label>
                  <input type="tel" className="form-control" value={newUserPhone} onChange={(e) => setNewUserPhone(e.target.value)} placeholder="08xxxx" required />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Sandi Awal*</label>
                  <input type="text" className="form-control" value={newUserPassword} onChange={(e) => setNewUserPassword(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label>Peran Sektor (Role)*</label>
                  <select className="form-control" value={newUserRole} onChange={(e) => setNewUserRole(e.target.value)}>
                    <option value="admin">Super Admin</option>
                    <option value="inspector admin">Inspector Admin</option>
                    <option value="conductor admin">Conductor Admin</option>
                    <option value="user">User (Customer)</option>
                  </select>
                </div>
              </div>

              {newUserRole === 'user' && (
                <div className="form-row">
                  <div className="form-group">
                    <label>Tipe Customer</label>
                    <select className="form-control" value={newUserType} onChange={(e) => setNewUserType(e.target.value)}>
                      <option value="buyer">Pembeli (Buyer)</option>
                      <option value="seller">Penjual (Seller)</option>
                    </select>
                  </div>
                  {newUserType === 'seller' && (
                    <div className="form-group">
                      <label>Nama Perusahaan Dealer</label>
                      <input type="text" className="form-control" value={newUserCompany} onChange={(e) => setNewUserCompany(e.target.value)} placeholder="PT Maju Mundur" />
                    </div>
                  )}
                </div>
              )}

              <button type="submit" className="btn-primary" style={{ marginTop: '12px', width: '100%' }}>
                Daftarkan User
              </button>
            </form>
          </div>

          {/* Users List Table */}
          <div className="glass-card">
            <h2>Daftar Pengguna Aktif</h2>
            <div className="table-container" style={{ maxHeight: '420px', overflowY: 'auto' }}>
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Nama</th>
                    <th>Role / Tipe</th>
                    <th>Status</th>
                    <th>Tindakan</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id}>
                      <td>
                        <div style={{ fontWeight: 'bold' }}>{u.name}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{u.email}</div>
                      </td>
                      <td>
                        <span style={{ fontSize: '12px', textTransform: 'capitalize' }}>
                          {u.role === 'user' ? `${u.type}` : u.role}
                        </span>
                      </td>
                      <td>
                        <span style={{
                          padding: '3px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 'bold',
                          background: u.status === 'active' ? 'var(--success-glow)' : u.status === 'pending_verification' ? 'var(--warning-glow)' : 'rgba(255,0,0,0.1)',
                          color: u.status === 'active' ? 'var(--success)' : u.status === 'pending_verification' ? 'var(--warning)' : 'var(--danger)'
                        }}>
                          {u.status}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '4px' }}>
                          {u.status === 'pending_verification' && (
                            <button className="btn-primary" style={{ padding: '4px 8px', fontSize: '10px' }} onClick={() => verifyBuyer(u.id, true)}>
                              Approve
                            </button>
                          )}
                          {u.status === 'active' && u.id !== 'usr-admin' && (
                            <button className="btn-secondary" style={{ padding: '4px 8px', fontSize: '10px' }} onClick={() => updateUser(u.id, { status: 'deactivated' })}>
                              Suspend
                            </button>
                          )}
                          {u.status === 'deactivated' && (
                            <button className="btn-secondary" style={{ padding: '4px 8px', fontSize: '10px', color: 'var(--success)' }} onClick={() => updateUser(u.id, { status: 'active' })}>
                              Activate
                            </button>
                          )}
                          {u.id !== 'usr-admin' && (
                            <button className="btn-danger" style={{ padding: '4px 8px', fontSize: '10px' }} onClick={() => deleteUser(u.id)}>
                              Hapus
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Allocation Edit Modal */}
      {allocatingCarId && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h3 className="modal-title">Jadwalkan Kendaraan Ke Sesi Lelang</h3>
              <button style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '20px', cursor: 'pointer' }} onClick={() => setAllocatingCarId(null)}>
                &times;
              </button>
            </div>
            <form onSubmit={handleSaveAllocation}>
              <div className="modal-body">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div className="form-group">
                    <label>Pilih Event Lelang Aktif</label>
                    <select className="form-control" value={allocatingAuctionId} onChange={(e) => setAllocatingAuctionId(e.target.value)}>
                      {auctions.map(a => <option key={a.id} value={a.id}>{a.name} ({a.branch})</option>)}
                    </select>
                  </div>
                  
                  <div className="form-group">
                    <label>Harga Mulai Lelang (Rp)*</label>
                    <input type="number" className="form-control" value={startPriceInput} onChange={(e) => setStartPriceInput(e.target.value)} required />
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Jalur (Lane A - E)</label>
                      <select className="form-control" value={laneInput} onChange={(e) => setLaneInput(e.target.value)}>
                        <option value="A">Lane A</option>
                        <option value="B">Lane B</option>
                        <option value="C">Lane C</option>
                        <option value="D">Lane D</option>
                        <option value="E">Lane E</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>No. Lot Kendaraan*</label>
                      <input type="number" className="form-control" value={lotInput} onChange={(e) => setLotInput(e.target.value)} placeholder="Contoh: 1, 2" required />
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setAllocatingCarId(null)}>Batal</button>
                <button type="submit" className="btn-primary">Simpan Alokasi</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Vehicle Modal */}
      {editingCar && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h3 className="modal-title">Edit Detail Kendaraan</h3>
              <button style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '20px', cursor: 'pointer' }} onClick={() => setEditingCar(null)}>
                &times;
              </button>
            </div>
            <form onSubmit={handleUpdateCar}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="form-row">
                  <div className="form-group">
                    <label>Nomor Polisi</label>
                    <input type="text" className="form-control" value={editingCar.plateNo} onChange={(e) => setEditingCar({ ...editingCar, plateNo: e.target.value })} required />
                  </div>
                  <div className="form-group">
                    <label>Cabang Registrasi</label>
                    <select className="form-control" value={editingCar.branch} onChange={(e) => setEditingCar({ ...editingCar, branch: e.target.value })}>
                      <option value="Jakarta">Jakarta</option>
                      <option value="Bandung">Bandung</option>
                      <option value="Semarang">Semarang</option>
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Merek Pabrikan</label>
                    <input type="text" className="form-control" value={editingCar.maker} onChange={(e) => setEditingCar({ ...editingCar, maker: e.target.value })} required />
                  </div>
                  <div className="form-group">
                    <label>Model</label>
                    <input type="text" className="form-control" value={editingCar.model} onChange={(e) => setEditingCar({ ...editingCar, model: e.target.value })} required />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Tipe Model</label>
                    <input type="text" className="form-control" value={editingCar.type} onChange={(e) => setEditingCar({ ...editingCar, type: e.target.value })} required />
                  </div>
                  <div className="form-group">
                    <label>Tahun Pembuatan</label>
                    <input type="number" className="form-control" value={editingCar.year} onChange={(e) => setEditingCar({ ...editingCar, year: parseInt(e.target.value) })} required />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Transmisi</label>
                    <select className="form-control" value={editingCar.transmission} onChange={(e) => setEditingCar({ ...editingCar, transmission: e.target.value })}>
                      <option value="A/T">A/T</option>
                      <option value="M/T">M/T</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Odometer (km)</label>
                    <input type="number" className="form-control" value={editingCar.odometer} onChange={(e) => setEditingCar({ ...editingCar, odometer: parseInt(e.target.value) })} required />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                  <div className="form-group">
                    <label>STNK</label>
                    <select className="form-control" style={{ padding: '6px' }} value={editingCar.stnk} onChange={(e) => setEditingCar({ ...editingCar, stnk: e.target.value })}>
                      <option value="Ada">Ada</option>
                      <option value="Tidak Ada">Tidak Ada</option>
                      <option value="Kedaluarsa">Mati</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>BPKB</label>
                    <select className="form-control" style={{ padding: '6px' }} value={editingCar.bpkb || 'Ada'} onChange={(e) => setEditingCar({ ...editingCar, bpkb: e.target.value })}>
                      <option value="Ada">Ada</option>
                      <option value="Tidak Ada">Tidak Ada</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Faktur</label>
                    <select className="form-control" style={{ padding: '6px' }} value={editingCar.faktur || 'Ada'} onChange={(e) => setEditingCar({ ...editingCar, faktur: e.target.value })}>
                      <option value="Ada">Ada</option>
                      <option value="Tidak Ada">Tidak Ada</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setEditingCar(null)}>Batal</button>
                <button type="submit" className="btn-primary">Simpan Perubahan</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Auction Modal */}
      {editingAuction && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h3 className="modal-title">Edit Jadwal Lelang</h3>
              <button style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '20px', cursor: 'pointer' }} onClick={() => setEditingAuction(null)}>
                &times;
              </button>
            </div>
            <form onSubmit={handleUpdateAuction}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="form-group">
                  <label>Nama Lelang</label>
                  <input type="text" className="form-control" value={editingAuction.name} onChange={(e) => setEditingAuction({ ...editingAuction, name: e.target.value })} required />
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label>Cabang Lokasi</label>
                    <select className="form-control" value={editingAuction.branch} onChange={(e) => setEditingAuction({ ...editingAuction, branch: e.target.value })}>
                      <option value="Jakarta">Jakarta</option>
                      <option value="Bandung">Bandung</option>
                      <option value="Semarang">Semarang</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Tanggal Lelang</label>
                    <input type="date" className="form-control" value={editingAuction.date} onChange={(e) => setEditingAuction({ ...editingAuction, date: e.target.value })} required />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Waktu Mulai</label>
                    <input type="time" className="form-control" value={editingAuction.startTime} onChange={(e) => setEditingAuction({ ...editingAuction, startTime: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>Waktu Selesai</label>
                    <input type="time" className="form-control" value={editingAuction.endTime} onChange={(e) => setEditingAuction({ ...editingAuction, endTime: e.target.value })} />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Tipe Lelang</label>
                    <select className="form-control" value={editingAuction.type} onChange={(e) => setEditingAuction({ ...editingAuction, type: e.target.value })}>
                      <option value="By highest bid">By highest bid</option>
                      <option value="By time">Time-based</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Tipe Produk</label>
                    <select className="form-control" value={editingAuction.productType} onChange={(e) => setEditingAuction({ ...editingAuction, productType: e.target.value })}>
                      <option value="Mobil">Mobil</option>
                      <option value="Motor">Motor</option>
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Pemandu (Conductor)</label>
                    <select className="form-control" value={editingAuction.auctioneer} onChange={(e) => setEditingAuction({ ...editingAuction, auctioneer: e.target.value })}>
                      {users.filter(u => u.role === 'conductor admin').map(c => (
                        <option key={c.id} value={c.name}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Status Lelang</label>
                    <select className="form-control" value={editingAuction.status} onChange={(e) => setEditingAuction({ ...editingAuction, status: e.target.value })}>
                      <option value="Scheduled">Scheduled</option>
                      <option value="Active">Active</option>
                      <option value="Finished">Finished</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setEditingAuction(null)}>Batal</button>
                <button type="submit" className="btn-primary">Simpan Perubahan</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
