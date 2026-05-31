-- ===========================================================================
-- LELANG ONLINE DATABASE SCHEMA (POSTGRESQL)
-- ===========================================================================

-- 1. DROP TABLES IF EXISTS (For clean initialization)
DROP TABLE IF EXISTS bids CASCADE;
DROP TABLE IF EXISTS nipl_transactions CASCADE;
DROP TABLE IF EXISTS inspections CASCADE;
DROP TABLE IF EXISTS cars CASCADE;
DROP TABLE IF EXISTS auctions CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- 2. USERS TABLE
CREATE TABLE users (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    phone VARCHAR(20) NOT NULL,
    password VARCHAR(100) NOT NULL,
    role VARCHAR(30) NOT NULL, -- 'admin', 'inspector admin', 'conductor admin', 'user'
    type VARCHAR(20), -- 'buyer', 'seller'
    status VARCHAR(30) NOT NULL DEFAULT 'active', -- 'active', 'pending_verification', 'deactivated', 'rejected'
    ktp VARCHAR(30),
    balance DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    company VARCHAR(100),
    address TEXT,
    branch VARCHAR(50),
    commission_rate DECIMAL(5, 2) DEFAULT 0.00,
    nipls TEXT[] DEFAULT '{}', -- Array of NIPL codes owned by user
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. AUCTIONS TABLE
CREATE TABLE auctions (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    branch VARCHAR(50) NOT NULL,
    date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    type VARCHAR(50) NOT NULL,
    product_type VARCHAR(50) NOT NULL,
    auctioneer VARCHAR(100) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'Scheduled', -- 'Scheduled', 'Active', 'Finished'
    current_lot_index INTEGER DEFAULT 0,
    current_bid DECIMAL(15, 2) DEFAULT 0.00,
    highest_bidder_nipl VARCHAR(20),
    highest_bidder_name VARCHAR(100),
    countdown INTEGER DEFAULT 0,
    lot_status VARCHAR(20) NOT NULL DEFAULT 'CLOSED', -- 'CLOSED', 'BIDDING', 'COUNTDOWN', 'SOLD', 'UNSOLD', 'FINISHED'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. CARS TABLE
CREATE TABLE cars (
    id VARCHAR(50) PRIMARY KEY,
    plate_no VARCHAR(20) NOT NULL,
    maker VARCHAR(50) NOT NULL,
    model VARCHAR(100) NOT NULL,
    type VARCHAR(50) NOT NULL,
    color VARCHAR(30) NOT NULL,
    year INTEGER NOT NULL,
    cc INTEGER NOT NULL,
    fuel VARCHAR(20) NOT NULL,
    transmission VARCHAR(10) NOT NULL,
    odometer INTEGER NOT NULL,
    seller_id VARCHAR(50) REFERENCES users(id) ON DELETE SET NULL,
    seller_name VARCHAR(100),
    branch VARCHAR(50) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'NEW', -- 'NEW', 'YARD', 'STOCK', 'ALLOCATED', 'SOLD', 'UNSOLD', 'HANDEOVER_COMPLETE'
    request_price DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    start_price DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    closing_price DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    winner_name VARCHAR(100),
    winner_nipl VARCHAR(20),
    payment_status VARCHAR(20) NOT NULL DEFAULT 'UNPAID', -- 'UNPAID', 'PAID'
    auction_id VARCHAR(50) REFERENCES auctions(id) ON DELETE SET NULL,
    lane VARCHAR(10),
    lot INTEGER DEFAULT 0,
    handover_date DATE,
    given_by VARCHAR(100),
    received_by VARCHAR(100),
    status_history TEXT[] DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. INSPECTIONS TABLE
CREATE TABLE inspections (
    id VARCHAR(50) PRIMARY KEY,
    car_id VARCHAR(50) REFERENCES cars(id) ON DELETE CASCADE UNIQUE,
    score INTEGER NOT NULL,
    grade CHAR(1) NOT NULL,
    recommended_price DECIMAL(15, 2) NOT NULL,
    defects JSONB DEFAULT '[]'::jsonb, -- Array of scratch/dent/rust defect areas & levels
    checks JSONB DEFAULT '{}'::jsonb,   -- Mechanical and document checks checklist
    note TEXT,
    is_salvage BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. BIDS TABLE
CREATE TABLE bids (
    id VARCHAR(50) PRIMARY KEY,
    auction_id VARCHAR(50) REFERENCES auctions(id) ON DELETE CASCADE,
    car_id VARCHAR(50) REFERENCES cars(id) ON DELETE CASCADE,
    buyer_nipl VARCHAR(20) NOT NULL,
    buyer_name VARCHAR(100) NOT NULL,
    amount DECIMAL(15, 2) NOT NULL,
    bid_time VARCHAR(30) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 7. NIPL TRANSACTIONS TABLE
CREATE TABLE nipl_transactions (
    id VARCHAR(50) PRIMARY KEY,
    buyer_id VARCHAR(50) REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL, -- 'Regular', 'Premium'
    amount DECIMAL(15, 2) NOT NULL,
    nipl_code VARCHAR(20) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PAID', -- 'PAID', 'PENDING'
    va VARCHAR(30) NOT NULL,
    date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 8. INDEXES FOR PERFORMANCE OPTIMIZATION
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_cars_plate_no ON cars(plate_no);
CREATE INDEX idx_cars_status ON cars(status);
CREATE INDEX idx_cars_auction_id ON cars(auction_id);
CREATE INDEX idx_inspections_car_id ON inspections(car_id);
CREATE INDEX idx_bids_car_id ON bids(car_id);
CREATE INDEX idx_bids_auction_id ON bids(auction_id);
CREATE INDEX idx_nipl_tx_buyer ON nipl_transactions(buyer_id);

-- ===========================================================================
-- DATABASE SEED DATA (INITIAL SEEDS MATCHING SIMULATOR STATE)
-- ===========================================================================

-- A. Users Seed
INSERT INTO users (id, name, email, phone, password, role, type, status, ktp, balance, nipls, company, address, branch, commission_rate) VALUES
('usr-admin', 'Super Admin', 'admin@lelangonline.com', '08123456789', 'password', 'admin', NULL, 'active', NULL, 0.00, '{}', NULL, NULL, NULL, 0.00),
('usr-insp1', 'Joko Sulistyo', 'inspector@lelangonline.com', '08234567890', 'inspector admin', 'inspector admin', NULL, 'active', NULL, 0.00, '{}', NULL, NULL, NULL, 0.00),
('usr-cond1', 'Ivan Mobil', 'conductor@lelangonline.com', '08345678901', 'conductor admin', 'conductor admin', NULL, 'active', NULL, 0.00, '{}', NULL, NULL, NULL, 0.00),
('usr-buyer1', 'Budi Sukarjan', 'buyer@lelangonline.com', '08122334455', 'password', 'user', 'buyer', 'active', '23523535131', 50000000.00, '{"REG001", "REG003"}', NULL, NULL, NULL, 0.00),
('usr-seller1', 'Reva Motor', 'seller@lelangonline.com', '08133445566', 'password', 'user', 'seller', 'active', NULL, 0.00, '{}', 'PT Reva Motor Utama', 'Jl. Meruya No. 18, Jakarta Barat', 'Jakarta', 1.00),
('usr-buyer2', 'Ahmad Dahlan', 'ahmad@lelangonline.com', '08199887766', 'password', 'user', 'buyer', 'pending_verification', '36012344567890', 0.00, '{}', NULL, NULL, NULL, 0.00);

-- B. Auctions Seed
INSERT INTO auctions (id, name, branch, date, start_time, end_time, type, product_type, auctioneer, status, current_lot_index, current_bid, highest_bidder_nipl, highest_bidder_name, countdown, lot_status) VALUES
('AUC-001', 'Jakarta-Car-00026-29/05/2026', 'Jakarta', '2026-05-29', '09:00:00', '12:00:00', 'By highest bid', 'Mobil', 'Ivan Mobil', 'Active', 1, 120000000.00, '', '', 10, 'CLOSED'),
('AUC-002', 'Bandung-Car-00017-30/05/2026', 'Bandung', '2026-05-30', '10:00:00', '13:00:00', 'By highest bid', 'Mobil', 'Ivan Mobil', 'Scheduled', 0, 0.00, '', '', 0, 'CLOSED');

-- C. Cars Seed
INSERT INTO cars (id, plate_no, maker, model, type, color, year, cc, fuel, transmission, odometer, seller_id, seller_name, branch, status, request_price, start_price, closing_price, winner_name, winner_nipl, payment_status, auction_id, lane, lot, handover_date, given_by, received_by, status_history) VALUES
('CAR-001', 'B1234AA', 'Toyota', 'Avanza', '1.3G M/T', 'Hitam', 2012, 1300, 'Bensin', 'M/T', 120000, 'usr-seller1', 'Reva Motor', 'Jakarta', 'SOLD', 85000000.00, 80000000.00, 91000000.00, 'Budi Sukarjan', 'REG001', 'PAID', 'AUC-001', 'A', 1, '2026-05-28', 'Joko Sulistyo', 'Budi Sukarjan', '{"Pickup", "Cleaned", "New", "Yard", "Stock", "Allocated", "Sold"}'),
('CAR-002', 'B2345BB', 'Toyota', 'Vios', 'G A/T', 'Silver', 2012, 1500, 'Bensin', 'A/T', 85000, 'usr-seller1', 'Reva Motor', 'Jakarta', 'STOCK', 70000000.00, 75000000.00, 0.00, NULL, NULL, 'UNPAID', NULL, NULL, 0, NULL, NULL, NULL, '{"Pickup", "Cleaned", "New", "Yard", "Stock"}'),
('CAR-003', 'B2467TZL', 'Toyota', 'Calya', '1.2 G A/T', 'Hitam', 2014, 1197, 'Bensin', 'A/T', 21487, 'usr-seller1', 'Reva Motor', 'Jakarta', 'ALLOCATED', 118000000.00, 120000000.00, 0.00, NULL, NULL, 'UNPAID', 'AUC-001', 'A', 2, NULL, NULL, NULL, '{"Pickup", "Cleaned", "New", "Yard", "Stock", "Allocated"}'),
('CAR-004', 'B3456CC', 'Honda', 'City', '1.5 i-VTEC', 'Putih', 2014, 1500, 'Bensin', 'A/T', 60000, 'usr-seller1', 'Reva Motor', 'Jakarta', 'ALLOCATED', 148000000.00, 150000000.00, 0.00, NULL, NULL, 'UNPAID', 'AUC-001', 'A', 3, NULL, NULL, NULL, '{"Pickup", "Cleaned", "New", "Yard", "Stock", "Allocated"}'),
('CAR-005', 'B9999XYZ', 'Honda', 'Brio', '1.2 E', 'Merah', 2017, 1200, 'Bensin', 'A/T', 45000, 'usr-seller1', 'Reva Motor', 'Jakarta', 'NEW', 0.00, 0.00, 0.00, NULL, NULL, 'UNPAID', NULL, NULL, 0, NULL, NULL, NULL, '{"Pickup", "Cleaned", "New"}');

-- D. Inspections Seed
INSERT INTO inspections (id, car_id, score, grade, recommended_price, defects, checks, note, is_salvage) VALUES
('INSP-001', 'CAR-001', 84, 'B', 90000000.00, 
 '[
   {"area": "Front", "defect": "Gores", "level": "Rendah", "scoreImpact": 1},
   {"area": "Rear", "defect": "Penyok", "level": "Sedang", "scoreImpact": 3},
   {"area": "Left 1", "defect": "Gores", "level": "Rendah", "scoreImpact": 1},
   {"area": "Right 1", "defect": "Karat", "level": "Tinggi", "scoreImpact": 8},
   {"area": "Right 2", "defect": "Gores", "level": "Rendah", "scoreImpact": 1}
  ]'::jsonb,
 '{
   "kunci": "Ya", "kunciUtama": "Ya", "sumKunci": 2, "remot": "Ya", "remoteUtama": 1,
   "bukuManual": "Ya", "bukuServis": "Ya", "banCadangan": "Ya", "dongkrak": "Ya",
   "tapeMobil": "Ya", "tipeTape": "Touch Panel + Navi", "mesinBekerja": "Ya",
   "langsamStabil": "Ya", "powerWindow": "OK", "ac": "OK", "warningLamp": "OK", "lampuSein": "OK"
  }'::jsonb,
 'Ban serep kempes, power window kanan agak macet.', FALSE),
('INSP-002', 'CAR-002', 95, 'A', 75000000.00, 
 '[]'::jsonb,
 '{
   "kunci": "Ya", "kunciUtama": "Ya", "sumKunci": 2, "remot": "Ya", "remoteUtama": 2,
   "bukuManual": "Ya", "bukuServis": "Ya", "banCadangan": "Ya", "dongkrak": "Ya",
   "tapeMobil": "Ya", "tipeTape": "Analog", "mesinBekerja": "Ya",
   "langsamStabil": "Ya", "powerWindow": "OK", "ac": "OK", "warningLamp": "OK", "lampuSein": "OK"
  }'::jsonb,
 'Kondisi mulus sekali.', FALSE),
('INSP-003', 'CAR-003', 87, 'B', 120000000.00, 
 '[
   {"area": "Front", "defect": "Gores", "level": "Rendah", "scoreImpact": 1},
   {"area": "Rear", "defect": "Penyok", "level": "Rendah", "scoreImpact": 2},
   {"area": "Left 1", "defect": "Gores", "level": "Rendah", "scoreImpact": 1},
   {"area": "Right 1", "defect": "Karat", "level": "Tinggi", "scoreImpact": 8},
   {"area": "Right 2", "defect": "Gores", "level": "Rendah", "scoreImpact": 1}
  ]'::jsonb,
 '{
   "kunci": "Ya", "kunciUtama": "Ya", "sumKunci": 2, "remot": "Ya", "remoteUtama": 1,
   "bukuManual": "Ya", "bukuServis": "Ya", "banCadangan": "Ya", "dongkrak": "Ya",
   "tapeMobil": "Ya", "tipeTape": "Touch Panel + Navi", "mesinBekerja": "Ya",
   "langsamStabil": "Ya", "powerWindow": "OK", "ac": "OK", "warningLamp": "OK", "lampuSein": "OK"
  }'::jsonb,
 'Ban serep bocor, power window kiri belakang seret.', FALSE),
('INSP-004', 'CAR-004', 92, 'A', 150000000.00, 
 '[
   {"area": "Left 1", "defect": "Gores", "level": "Rendah", "scoreImpact": 1},
   {"area": "Right 1", "defect": "Gores", "level": "Rendah", "scoreImpact": 1}
  ]'::jsonb,
 '{
   "kunci": "Ya", "kunciUtama": "Ya", "sumKunci": 2, "remot": "Ya", "remoteUtama": 2,
   "bukuManual": "Ya", "bukuServis": "Ya", "banCadangan": "Ya", "dongkrak": "Ya",
   "tapeMobil": "Ya", "tipeTape": "Touch Panel + Navi", "mesinBekerja": "Ya",
   "langsamStabil": "Ya", "powerWindow": "OK", "ac": "OK", "warningLamp": "OK", "lampuSein": "OK"
  }'::jsonb,
 'Mesin sangat halus.', FALSE);

-- E. NIPL Transactions Seed
INSERT INTO nipl_transactions (id, buyer_id, type, amount, nipl_code, status, va, date) VALUES
('NIPL-001', 'usr-buyer1', 'Regular', 5000000.00, 'REG001', 'PAID', '236623463246', '2026-05-28'),
('NIPL-002', 'usr-buyer1', 'Regular', 5000000.00, 'REG003', 'PAID', '236623463247', '2026-05-28');
