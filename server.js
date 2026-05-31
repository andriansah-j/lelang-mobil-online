import express from 'express';
import cors from 'cors';
import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import pg from 'pg';

const { Pool } = pg;

const app = express();
app.use(cors());
app.use(express.json());

// 1. DATABASE CONNECTION POOL
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'lelang',
  password: 'rahasia123',
  port: 5432,
});

// Verify connection
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('❌ Database connection error:', err);
  } else {
    console.log('✅ PostgreSQL database connected successfully!');
  }
});

// 2. HTTP SERVER & WEBSOCKET SETUP
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

// Helper to broadcast JSON data to all connected clients
function broadcast(data) {
  const payload = JSON.stringify(data);
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  });
}

wss.on('connection', ws => {
  console.log('🔌 New browser client connected via WebSocket');
  ws.send(JSON.stringify({ type: 'WELCOME', message: 'Connected to Lelang Online live bidding feed' }));
});

// 3. CENTRALIZED BACKEND COUNTDOWN TIMER (Every 1 second)
setInterval(async () => {
  try {
    // Find all active auctions in countdown state
    const res = await pool.query("SELECT * FROM auctions WHERE status = 'Active' AND lot_status = 'COUNTDOWN'");
    for (const auction of res.rows) {
      const newCountdown = auction.countdown - 1;
      if (newCountdown >= 0) {
        // Decrement countdown
        await pool.query('UPDATE auctions SET countdown = $1 WHERE id = $2', [newCountdown, auction.id]);
        broadcast({
          type: 'COUNTDOWN_TICK',
          auctionId: auction.id,
          countdown: newCountdown
        });
      } else {
        // Countdown reached 0: Determine SOLD or UNSOLD
        const hasBidder = auction.highest_bidder_nipl && auction.highest_bidder_nipl.trim() !== '';
        const finalStatus = hasBidder ? 'SOLD' : 'UNSOLD';
        
        console.log(`⏱️ Lot countdown finished for Auction ${auction.id}. Result: ${finalStatus}`);
        
        // Update auction lot status
        const updatedAuctionRes = await pool.query(
          "UPDATE auctions SET lot_status = $1, countdown = 0 WHERE id = $2 RETURNING *",
          [finalStatus, auction.id]
        );
        const updatedAuction = updatedAuctionRes.rows[0];

        // Find active car of this lot
        const carsRes = await pool.query('SELECT * FROM cars WHERE auction_id = $1 ORDER BY lot ASC', [auction.id]);
        const activeCar = carsRes.rows[auction.current_lot_index];

        let updatedCar = null;
        if (activeCar) {
          // Update car record
          const statusHistoryArray = [...(activeCar.status_history || []), finalStatus];
          const closingPrice = finalStatus === 'SOLD' ? parseFloat(auction.current_bid) : 0.00;
          const winnerNipl = finalStatus === 'SOLD' ? auction.highest_bidder_nipl : null;
          const winnerName = finalStatus === 'SOLD' ? auction.highest_bidder_name : null;

          const updatedCarRes = await pool.query(
            `UPDATE cars 
             SET status = $1, status_history = $2, closing_price = $3, winner_nipl = $4, winner_name = $5, payment_status = 'UNPAID' 
             WHERE id = $6 RETURNING *`,
            [finalStatus, statusHistoryArray, closingPrice, winnerNipl, winnerName, activeCar.id]
          );
          updatedCar = updatedCarRes.rows[0];
        }

        // Broadcast finalization
        broadcast({
          type: 'LOT_FINALIZED',
          auction: updatedAuction,
          car: updatedCar
        });
      }
    }
  } catch (err) {
    console.error('Error in countdown tick processor:', err);
  }
}, 1000);


// ===========================================================================
// 4. REST API ROUTES
// ===========================================================================

// --- AUTHENTICATION ---
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const result = await pool.query('SELECT * FROM users WHERE email = $1 AND password = $2', [email, password]);
    if (result.rows.length === 0) {
      return res.status(401).json({ message: 'Kombinasi email atau password salah!' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/auth/register', async (req, res) => {
  const { name, email, phone, password, role, type, status } = req.body;
  try {
    const existing = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ message: 'Email sudah terdaftar!' });
    }
    const id = `usr-${Date.now()}`;
    const result = await pool.query(
      `INSERT INTO users (id, name, email, phone, password, role, type, status, balance, nipls) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 0, '{}') RETURNING *`,
      [id, name, email, phone, password, role, type, status]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- USER MANAGEMENT ---
app.get('/api/users', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM users ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/users', async (req, res) => {
  const { name, email, phone, password, role, type, status, ktp, balance, company, address, branch, commissionRate } = req.body;
  const id = `usr-${Date.now()}`;
  try {
    const result = await pool.query(
      `INSERT INTO users (id, name, email, phone, password, role, type, status, ktp, balance, company, address, branch, commission_rate, nipls) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, '{}') RETURNING *`,
      [id, name, email, phone, password, role, type, status || 'active', ktp, balance || 0, company, address, branch, commissionRate || 0]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/users/:id', async (req, res) => {
  const { id } = req.params;
  const { name, email, phone, password, role, type, status, ktp, balance, company, address, branch, commissionRate } = req.body;
  try {
    const result = await pool.query(
      `UPDATE users 
       SET name = $1, email = $2, phone = $3, password = $4, role = $5, type = $6, status = $7, ktp = $8, balance = $9, company = $10, address = $11, branch = $12, commission_rate = $13 
       WHERE id = $14 RETURNING *`,
      [name, email, phone, password, role, type, status, ktp, balance, company, address, branch, commissionRate, id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/users/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM users WHERE id = $1', [id]);
    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/users/:id/verify', async (req, res) => {
  const { id } = req.params;
  const { approve } = req.body;
  const status = approve ? 'active' : 'rejected';
  try {
    const result = await pool.query('UPDATE users SET status = $1 WHERE id = $2 RETURNING *', [status, id]);
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- CARS MANAGEMENT ---
app.get('/api/cars', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT c.*, 
              (SELECT row_to_json(i) FROM inspections i WHERE i.car_id = c.id) as inspection 
       FROM cars c ORDER BY c.created_at DESC`
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/cars', async (req, res) => {
  const { plateNo, maker, model, type, color, year, cc, fuel, transmission, odometer, sellerId, sellerName, branch } = req.body;
  const id = `CAR-${Date.now()}`;
  try {
    const result = await pool.query(
      `INSERT INTO cars (id, plate_no, maker, model, type, color, year, cc, fuel, transmission, odometer, seller_id, seller_name, branch, status, status_history) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, 'NEW', ARRAY['New']) RETURNING *`,
      [id, plateNo, maker, model, type, color, year, cc, fuel, transmission, odometer, sellerId, sellerName, branch]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/cars/:id', async (req, res) => {
  const { id } = req.params;
  const { plateNo, maker, model, type, color, year, cc, fuel, transmission, odometer, sellerId, sellerName, branch, status, requestPrice, startPrice, lane, lot, paymentStatus, handoverDate, givenBy, receivedBy, statusHistory } = req.body;
  try {
    const result = await pool.query(
      `UPDATE cars 
       SET plate_no = $1, maker = $2, model = $3, type = $4, color = $5, year = $6, cc = $7, fuel = $8, transmission = $9, odometer = $10, seller_id = $11, seller_name = $12, branch = $13, status = $14, request_price = $15, start_price = $16, lane = $17, lot = $18, payment_status = $19, handover_date = $20, given_by = $21, received_by = $22, status_history = $23 
       WHERE id = $24 RETURNING *`,
      [plateNo, maker, model, type, color, year, cc, fuel, transmission, odometer, sellerId, sellerName, branch, status, requestPrice, startPrice, lane, lot, paymentStatus, handoverDate, givenBy, receivedBy, statusHistory, id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/cars/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM cars WHERE id = $1', [id]);
    res.json({ message: 'Car deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Seller price confirmation
app.post('/api/cars/:id/confirm-price', async (req, res) => {
  const { id } = req.params;
  const { requestPrice } = req.body;
  try {
    // Get existing status history
    const carRes = await pool.query('SELECT status_history FROM cars WHERE id = $1', [id]);
    if (carRes.rows.length === 0) return res.status(404).json({ message: 'Car not found' });
    const history = [...(carRes.rows[0].status_history || []), 'Stock'];

    const result = await pool.query(
      `UPDATE cars 
       SET status = 'STOCK', status_history = $1, request_price = $2, start_price = $2 
       WHERE id = $3 RETURNING *`,
      [history, parseFloat(requestPrice), id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- INSPECTIONS ---
app.post('/api/inspections', async (req, res) => {
  const { carId, score, grade, recommendedPrice, defects, checks, note, isSalvage } = req.body;
  const id = `INSP-${Date.now()}`;
  try {
    await pool.query('BEGIN');
    
    // Create inspection record
    const inspResult = await pool.query(
      `INSERT INTO inspections (id, car_id, score, grade, recommended_price, defects, checks, note, is_salvage) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [id, carId, score, grade, recommendedPrice, JSON.stringify(defects), JSON.stringify(checks), note, isSalvage]
    );

    // Update car status to YARD
    const carRes = await pool.query('SELECT status_history FROM cars WHERE id = $1', [carId]);
    const history = [...(carRes.rows[0]?.status_history || []), 'Yard'];
    
    await pool.query(
      `UPDATE cars SET status = 'YARD', status_history = $1 WHERE id = $2`,
      [history, carId]
    );

    await pool.query('COMMIT');
    res.status(201).json(inspResult.rows[0]);
  } catch (err) {
    await pool.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  }
});

// --- AUCTIONS ---
app.get('/api/auctions', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM auctions ORDER BY date DESC, start_time DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/auctions', async (req, res) => {
  const { name, branch, date, startTime, endTime, type, productType, auctioneer } = req.body;
  const id = `AUC-${Date.now()}`;
  try {
    const result = await pool.query(
      `INSERT INTO auctions (id, name, branch, date, start_time, end_time, type, product_type, auctioneer, status, current_lot_index, current_bid, highest_bidder_nipl, highest_bidder_name, countdown, lot_status) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'Scheduled', 0, 0, '', '', 0, 'CLOSED') RETURNING *`,
      [id, name, branch, date, startTime, endTime, type, productType, auctioneer]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/auctions/:id', async (req, res) => {
  const { id } = req.params;
  const { name, branch, date, startTime, endTime, type, productType, auctioneer, status, currentLotIndex, currentBid, highestBidderNipl, highestBidderName, countdown, lotStatus } = req.body;
  try {
    const result = await pool.query(
      `UPDATE auctions 
       SET name = $1, branch = $2, date = $3, start_time = $4, end_time = $5, type = $6, product_type = $7, auctioneer = $8, status = $9, current_lot_index = $10, current_bid = $11, highest_bidder_nipl = $12, highest_bidder_name = $13, countdown = $14, lot_status = $15 
       WHERE id = $16 RETURNING *`,
      [name, branch, date, startTime, endTime, type, productType, auctioneer, status, currentLotIndex, currentBid, highestBidderNipl, highestBidderName, countdown, lotStatus, id]
    );
    
    // Broadcast websocket change when state is updated via HTTP PUT (Conductor panel triggers this)
    broadcast({
      type: 'AUCTION_STATE_UPDATED',
      auction: result.rows[0]
    });
    
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/auctions/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM auctions WHERE id = $1', [id]);
    res.json({ message: 'Auction deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Conductor manual lane controls: next lot
app.post('/api/auctions/:id/next-lot', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('BEGIN');
    
    const auctionRes = await pool.query('SELECT * FROM auctions WHERE id = $1', [id]);
    if (auctionRes.rows.length === 0) return res.status(404).json({ message: 'Auction not found' });
    const auction = auctionRes.rows[0];

    const carsRes = await pool.query('SELECT * FROM cars WHERE auction_id = $1 ORDER BY lot ASC', [id]);
    const nextIndex = auction.current_lot_index + 1;
    
    let nextStartPrice = 0;
    let nextLotStatus = 'CLOSED';
    let nextStatus = 'Active';

    if (nextIndex < carsRes.rows.length) {
      nextStartPrice = parseFloat(carsRes.rows[nextIndex].start_price || 0);
    } else {
      nextLotStatus = 'FINISHED';
      nextStatus = 'Finished';
    }

    const updatedRes = await pool.query(
      `UPDATE auctions 
       SET current_lot_index = $1, current_bid = $2, highest_bidder_nipl = '', highest_bidder_name = '', countdown = 0, lot_status = $3, status = $4 
       WHERE id = $5 RETURNING *`,
      [
        nextIndex < carsRes.rows.length ? nextIndex : auction.current_lot_index,
        nextStartPrice,
        nextLotStatus,
        nextStatus,
        id
      ]
    );

    await pool.query('COMMIT');

    // Broadcast change
    broadcast({
      type: 'AUCTION_NEXT_LOT',
      auction: updatedRes.rows[0]
    });

    res.json(updatedRes.rows[0]);
  } catch (err) {
    await pool.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  }
});

// --- BIDS ---
app.get('/api/bids', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM bids ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/bids', async (req, res) => {
  const { auctionId, carId, buyerNipl, buyerName, amount } = req.body;
  const id = `BID-${Date.now()}`;
  const bidTime = new Date().toLocaleTimeString('id-ID');
  
  try {
    await pool.query('BEGIN');
    
    // Insert bid
    const bidResult = await pool.query(
      `INSERT INTO bids (id, auction_id, car_id, buyer_nipl, buyer_name, amount, bid_time) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [id, auctionId, carId, buyerNipl, buyerName, amount, bidTime]
    );

    // Update auction values (Highest bid and bidder, reset countdown timer to 10 seconds)
    const auctionResult = await pool.query(
      `UPDATE auctions 
       SET current_bid = $1, highest_bidder_nipl = $2, highest_bidder_name = $3, countdown = 10, lot_status = 'COUNTDOWN' 
       WHERE id = $4 RETURNING *`,
      [amount, buyerNipl, buyerName, auctionId]
    );

    await pool.query('COMMIT');

    // Broadcast new bid to all clients via WebSocket
    broadcast({
      type: 'NEW_BID_PLACED',
      bid: bidResult.rows[0],
      auction: auctionResult.rows[0]
    });

    res.status(201).json(bidResult.rows[0]);
  } catch (err) {
    await pool.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  }
});

// --- NIPL TRANSACTIONS ---
app.get('/api/nipl-transactions', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM nipl_transactions ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/nipl-transactions', async (req, res) => {
  const { buyerId, type } = req.body;
  const amount = type === 'Premium' ? 25000000.00 : 10000000.00;
  const isPremium = type === 'Premium';
  const randomNIPL = (isPremium ? 'PRE' : 'REG') + String(Math.floor(100 + Math.random() * 900));
  const vaCode = String(236600000000 + Math.floor(Math.random() * 999999));
  const txId = `NIPL-${Date.now()}`;
  const dateStr = new Date().toISOString().split('T')[0];

  try {
    await pool.query('BEGIN');

    // Insert transaction
    const txResult = await pool.query(
      `INSERT INTO nipl_transactions (id, buyer_id, type, amount, nipl_code, status, va, date) 
       VALUES ($1, $2, $3, $4, $5, 'PAID', $6, $7) RETURNING *`,
      [txId, buyerId, type, amount, randomNIPL, vaCode, dateStr]
    );

    // Update user nipls list in database
    const userRes = await pool.query('SELECT nipls FROM users WHERE id = $1', [buyerId]);
    const currentNipls = userRes.rows[0]?.nipls || [];
    const updatedNipls = [...currentNipls, randomNIPL];

    await pool.query('UPDATE users SET nipls = $1 WHERE id = $2', [updatedNipls, buyerId]);

    await pool.query('COMMIT');
    res.status(201).json(txResult.rows[0]);
  } catch (err) {
    await pool.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  }
});


// 5. START SERVER
const PORT = 5000;
server.listen(PORT, () => {
  console.log(`📡 Lelang Online API & WS Backend server running on port ${PORT}`);
});
