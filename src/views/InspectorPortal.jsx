import React, { useContext, useState } from 'react';
import { AuctionContext } from '../context/AuctionContext';

const DEFECT_TYPES = ['None', 'Gores', 'Penyok', 'Karat'];
const DEFECT_LEVELS = ['Rendah', 'Sedang', 'Tinggi'];

const VEHICLE_ZONES = [
  '1 Sudut Depan', '2 Sudut Belakang', '3 Depan', '4 Belakang', 
  '5 Atas', '6 Kiri 1', '7 Kiri 2', '8 Kanan 1', '9 Kanan 2'
];

export const InspectorPortal = () => {
  const { cars, submitInspection, activeUser } = useContext(AuctionContext);
  const [inspectingCar, setInspectingCar] = useState(null);

  // Inspection form states
  const [isSalvage, setIsSalvage] = useState(false);
  const [basePrice, setBasePrice] = useState(100000000);
  const [note, setNote] = useState('');
  
  // Defect logs: array of { zone, defect, level, thickness }
  const [defects, setDefects] = useState(
    VEHICLE_ZONES.map(zone => ({ zone, defect: 'None', level: 'Rendah', thickness: 12 }))
  );

  // Condition checks
  const [checks, setChecks] = useState({
    kunci: 'Ya', kunciUtama: 'Ya', sumKunci: 1, remot: 'Ya', remoteUtama: 1,
    bukuManual: 'Ya', bukuServis: 'Ya', banCadangan: 'Ya', dongkrak: 'Ya',
    tapeMobil: 'Ya', tipeTape: 'Analog', mesinBekerja: 'Ya',
    langsamStabil: 'Ya', powerWindow: 'OK', ac: 'OK', warningLamp: 'OK', lampuSein: 'OK'
  });

  const pendingCars = cars.filter(c => c.status === 'NEW');

  const startInspection = (car) => {
    setInspectingCar(car);
    setIsSalvage(false);
    setBasePrice(100000000);
    setNote('');
    setDefects(VEHICLE_ZONES.map(zone => ({ zone, defect: 'None', level: 'Rendah', thickness: 12 })));
    setChecks({
      kunci: 'Ya', kunciUtama: 'Ya', sumKunci: 1, remot: 'Ya', remoteUtama: 1,
      bukuManual: 'Ya', bukuServis: 'Ya', banCadangan: 'Ya', dongkrak: 'Ya',
      tapeMobil: 'Ya', tipeTape: 'Analog', mesinBekerja: 'Ya',
      langsamStabil: 'Ya', powerWindow: 'OK', ac: 'OK', warningLamp: 'OK', lampuSein: 'OK'
    });
  };

  const handleDefectChange = (index, field, value) => {
    setDefects(prev => prev.map((d, i) => i === index ? { ...d, [field]: value } : d));
  };

  const handleCheckChange = (field, value) => {
    setChecks(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveInspection = () => {
    // Filter actual defects (excluding 'None')
    const activeDefects = defects
      .filter(d => d.defect !== 'None')
      .map(d => {
        let scoreImpact = 0;
        if (d.defect === 'Gores') scoreImpact = d.level === 'Rendah' ? 1 : d.level === 'Sedang' ? 2 : 3;
        else if (d.defect === 'Penyok') scoreImpact = d.level === 'Rendah' ? 2 : d.level === 'Sedang' ? 3 : 4;
        else if (d.defect === 'Karat') scoreImpact = d.level === 'Rendah' ? 3 : d.level === 'Sedang' ? 5 : 8;
        return {
          area: d.zone,
          defect: d.defect,
          level: d.level,
          scoreImpact
        };
      });

    submitInspection(inspectingCar.id, activeDefects, checks, isSalvage, parseFloat(basePrice), note);
    alert('Inspeksi berhasil disimpan! Status mobil dirubah ke YARD.');
    setInspectingCar(null);
  };

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h1>Inspector Portal</h1>
        <p>Petugas Inspeksi: <strong>{activeUser.name}</strong></p>
      </div>

      {!inspectingCar ? (
        <div className="glass-card">
          <h2>Daftar Antrean Inspeksi Masuk</h2>
          <p style={{ marginBottom: '16px' }}>Mobil-mobil berikut baru saja masuk dari penjemputan dealer dan siap dinilai.</p>
          
          {pendingCars.length === 0 ? (
            <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--text-muted)' }}>
              Tidak ada antrean inspeksi saat ini. Semua mobil telah selesai dinilai.
            </div>
          ) : (
            <div className="table-container">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>No Polisi</th>
                    <th>Pabrikan</th>
                    <th>Model / Tipe</th>
                    <th>Tahun / Odo</th>
                    <th>Dealer Asal</th>
                    <th>Tindakan</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingCars.map(c => (
                    <tr key={c.id}>
                      <td style={{ fontWeight: 'bold' }}>{c.plateNo}</td>
                      <td>{c.maker}</td>
                      <td>{c.model} {c.type}</td>
                      <td>{c.year} / {Number(c.odometer || 0).toLocaleString()} km</td>
                      <td>{c.sellerName}</td>
                      <td>
                        <button className="btn-primary" onClick={() => startInspection(c)}>
                          Mulai Inspeksi
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px', marginBottom: '24px' }}>
            <div>
              <h2>Inspeksi Kendaraan: {inspectingCar.maker} {inspectingCar.model} ({inspectingCar.plateNo})</h2>
              <p>Masukkan penilaian eksterior, kelengkapan surat/kunci, dan tes kelistrikan mesin.</p>
            </div>
            <button className="btn-secondary" onClick={() => setInspectingCar(null)}>Kembali ke Antrean</button>
          </div>

          {/* Salvage Checklist Override */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(239, 68, 68, 0.1)', padding: '16px', borderRadius: '8px', border: '1px solid var(--danger-glow)', marginBottom: '24px' }}>
            <input 
              type="checkbox" 
              id="salvage-checkbox"
              style={{ width: '20px', height: '20px', cursor: 'pointer' }}
              checked={isSalvage}
              onChange={(e) => setIsSalvage(e.target.checked)}
            />
            <label htmlFor="salvage-checkbox" style={{ fontWeight: 'bold', color: 'var(--danger)', cursor: 'pointer' }}>
              Unit Rongsokan / Bekas Tabrakan Berat (Salvage/Accident Car)
            </label>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', marginLeft: '10px' }}>
              (*Mencentang ini akan langsung memberikan Grade F dan memotong 60% harga pasar lelang.)
            </span>
          </div>

          <div className="form-group" style={{ maxWidth: '300px', marginBottom: '24px' }}>
            <label>Harga Dasar Pasar Lelang (Base Market Price)</label>
            <input 
              type="number" 
              className="form-control"
              value={basePrice}
              onChange={(e) => setBasePrice(e.target.value)}
            />
          </div>

          {!isSalvage && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
              
              {/* DEFECT CHECKER SECTION */}
              <div>
                <h3 style={{ marginBottom: '16px', color: 'var(--primary)' }}>1. Lembar Cek Bodi & Cat</h3>
                <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
                  
                  {/* Defects Form Inputs */}
                  <div style={{ flexGrow: 1, minWidth: '400px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr 1fr', gap: '12px', fontWeight: 'bold', color: 'var(--text-muted)', paddingBottom: '8px', borderBottom: '1px solid var(--border-color)', marginBottom: '12px' }}>
                      <div>Sektor Bodi</div>
                      <div>Kerusakan</div>
                      <div>Tingkatan</div>
                      <div>Ketebalan Cat (mil)</div>
                    </div>
                    {defects.map((d, index) => (
                      <div key={index} style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr 1fr', gap: '12px', marginBottom: '12px', alignItems: 'center' }}>
                        <div style={{ fontSize: '13px', fontWeight: '600' }}>{d.zone}</div>
                        <select 
                          className="form-control" 
                          style={{ padding: '6px 12px' }}
                          value={d.defect}
                          onChange={(e) => handleDefectChange(index, 'defect', e.target.value)}
                        >
                          {DEFECT_TYPES.map(type => <option key={type} value={type}>{type}</option>)}
                        </select>
                        <select 
                          className="form-control" 
                          style={{ padding: '6px 12px' }}
                          value={d.level}
                          disabled={d.defect === 'None'}
                          onChange={(e) => handleDefectChange(index, 'level', e.target.value)}
                        >
                          {DEFECT_LEVELS.map(lvl => <option key={lvl} value={lvl}>{lvl}</option>)}
                        </select>
                        <input 
                          type="number" 
                          className="form-control" 
                          style={{ padding: '6px 12px' }}
                          value={d.thickness}
                          onChange={(e) => handleDefectChange(index, 'thickness', e.target.value)}
                        />
                      </div>
                    ))}
                  </div>

                  {/* Visual Reference Map (Diagram placeholder) */}
                  <div style={{ width: '320px', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '20px', background: 'rgba(255,255,255,0.01)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                    <h4 style={{ marginBottom: '12px', fontSize: '14px', color: 'var(--text-muted)' }}>Peta Sektor Mobil</h4>
                    <svg viewBox="0 0 200 400" style={{ width: '150px', height: 'auto', fill: 'none', stroke: 'rgba(255,255,255,0.2)', strokeWidth: 2 }}>
                      {/* Car Body outline */}
                      <rect x="50" y="80" width="100" height="240" rx="30" />
                      <rect x="45" y="110" width="5" height="40" rx="2" />
                      <rect x="150" y="110" width="5" height="40" rx="2" />
                      <rect x="45" y="240" width="5" height="40" rx="2" />
                      <rect x="150" y="240" width="5" height="40" rx="2" />
                      
                      {/* Grid Sections */}
                      <line x1="50" y1="130" x2="150" y2="130" />
                      <line x1="50" y1="210" x2="150" y2="210" />
                      <line x1="50" y1="290" x2="150" y2="290" />
                      <line x1="100" y1="130" x2="100" y2="290" />

                      {/* Labels */}
                      <text x="100" y="60" fill="var(--text-muted)" fontSize="10" textAnchor="middle">1. Front Corner</text>
                      <text x="100" y="110" fill="var(--text-muted)" fontSize="10" textAnchor="middle">3. Depan</text>
                      <text x="75" y="170" fill="var(--text-muted)" fontSize="10" textAnchor="middle">6. Kiri 1</text>
                      <text x="125" y="170" fill="var(--text-muted)" fontSize="10" textAnchor="middle">8. Kanan 1</text>
                      <text x="75" y="250" fill="var(--text-muted)" fontSize="10" textAnchor="middle">7. Kiri 2</text>
                      <text x="125" y="250" fill="var(--text-muted)" fontSize="10" textAnchor="middle">9. Kanan 2</text>
                      <text x="100" y="315" fill="var(--text-muted)" fontSize="10" textAnchor="middle">4. Belakang</text>
                      <text x="100" y="370" fill="var(--text-muted)" fontSize="10" textAnchor="middle">2. Rear Corner</text>
                      <text x="100" y="200" fill="var(--primary)" fontSize="12" fontWeight="bold" textAnchor="middle">5. Atas</text>
                    </svg>
                  </div>
                </div>
              </div>

              {/* SURAT & KELENGKAPAN CHECKLIST */}
              <div>
                <h3 style={{ marginBottom: '16px', color: 'var(--primary)' }}>2. Cek Kelengkapan & Mekanikal</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '20px' }}>
                  
                  {/* Keys & manuals */}
                  <div className="glass-card" style={{ padding: '16px' }}>
                    <h4 style={{ marginBottom: '12px', fontSize: '14px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>Surat & Akses</h4>
                    
                    <div className="form-group" style={{ marginBottom: '12px' }}>
                      <label>Kunci Kontak</label>
                      <select className="form-control" style={{ padding: '6px 12px' }} value={checks.kunci} onChange={(e) => handleCheckChange('kunci', e.target.value)}>
                        <option value="Ya">Ada (Lengkap)</option>
                        <option value="Tidak">Tidak Ada</option>
                      </select>
                    </div>

                    <div className="form-group" style={{ marginBottom: '12px' }}>
                      <label>Kunci Utama</label>
                      <select className="form-control" style={{ padding: '6px 12px' }} value={checks.kunciUtama} onChange={(e) => handleCheckChange('kunciUtama', e.target.value)}>
                        <option value="Ya">Orisinil</option>
                        <option value="Tidak">Duplikat</option>
                      </select>
                    </div>

                    <div className="form-group" style={{ marginBottom: '12px' }}>
                      <label>Remot Keyless</label>
                      <select className="form-control" style={{ padding: '6px 12px' }} value={checks.remot} onChange={(e) => handleCheckChange('remot', e.target.value)}>
                        <option value="Ya">Ada</option>
                        <option value="Tidak">Tidak Ada</option>
                      </select>
                    </div>
                  </div>

                  {/* Manual / Servis */}
                  <div className="glass-card" style={{ padding: '16px' }}>
                    <h4 style={{ marginBottom: '12px', fontSize: '14px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>Dokumen & Ban</h4>

                    <div className="form-group" style={{ marginBottom: '12px' }}>
                      <label>Buku Manual</label>
                      <select className="form-control" style={{ padding: '6px 12px' }} value={checks.bukuManual} onChange={(e) => handleCheckChange('bukuManual', e.target.value)}>
                        <option value="Ya">Ada</option>
                        <option value="Tidak">Tidak Ada</option>
                      </select>
                    </div>

                    <div className="form-group" style={{ marginBottom: '12px' }}>
                      <label>Buku Servis</label>
                      <select className="form-control" style={{ padding: '6px 12px' }} value={checks.bukuServis} onChange={(e) => handleCheckChange('bukuServis', e.target.value)}>
                        <option value="Ya">Ada</option>
                        <option value="Tidak">Tidak Ada</option>
                      </select>
                    </div>

                    <div className="form-group" style={{ marginBottom: '12px' }}>
                      <label>Ban Cadangan / Dongkrak</label>
                      <select className="form-control" style={{ padding: '6px 12px' }} value={checks.banCadangan} onChange={(e) => handleCheckChange('banCadangan', e.target.value)}>
                        <option value="Ya">Ada</option>
                        <option value="Tidak">Tidak Ada</option>
                      </select>
                    </div>
                  </div>

                  {/* Engine electricals */}
                  <div className="glass-card" style={{ padding: '16px' }}>
                    <h4 style={{ marginBottom: '12px', fontSize: '14px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>Mesin & Kelistrikan</h4>

                    <div className="form-group" style={{ marginBottom: '12px' }}>
                      <label>Fungsi Mesin / Langsam</label>
                      <select className="form-control" style={{ padding: '6px 12px' }} value={checks.mesinBekerja} onChange={(e) => handleCheckChange('mesinBekerja', e.target.value)}>
                        <option value="Ya">Bekerja Baik & Langsam Stabil</option>
                        <option value="Tidak">Kasar / Tidak Stabil</option>
                      </select>
                    </div>

                    <div className="form-group" style={{ marginBottom: '12px' }}>
                      <label>Air Conditioning (AC)</label>
                      <select className="form-control" style={{ padding: '6px 12px' }} value={checks.ac} onChange={(e) => handleCheckChange('ac', e.target.value)}>
                        <option value="OK">Dingin (OK)</option>
                        <option value="Not OK">Tidak Dingin (Not OK)</option>
                      </select>
                    </div>

                    <div className="form-group" style={{ marginBottom: '12px' }}>
                      <label>Dashboard Power Window</label>
                      <select className="form-control" style={{ padding: '6px 12px' }} value={checks.powerWindow} onChange={(e) => handleCheckChange('powerWindow', e.target.value)}>
                        <option value="OK">Berfungsi Semua (OK)</option>
                        <option value="Not OK">Macat (Not OK)</option>
                      </select>
                    </div>
                  </div>

                </div>
              </div>
            </div>
          )}

          {/* Notes area */}
          <div className="form-group" style={{ marginTop: '24px' }}>
            <label>Catatan Tambahan Inspektur (Kondisi Khusus)</label>
            <textarea 
              rows="3" 
              className="form-control" 
              placeholder="Contoh: Ban cadangan kempes, baret bodi sisi kanan dekat lampu utama..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', gap: '12px', marginTop: '32px', justifyContent: 'flex-end' }}>
            <button className="btn-secondary" onClick={() => setInspectingCar(null)}>Batal</button>
            <button className="btn-primary" onClick={handleSaveInspection}>Simpan & Terbitkan Grade</button>
          </div>
        </div>
      )}
    </div>
  );
};
