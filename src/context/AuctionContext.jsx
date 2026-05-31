import React, { createContext, useState, useEffect } from 'react';
import { APP_CONFIG } from '../config';

export const AuctionContext = createContext();

export const AuctionProvider = ({ children }) => {
  const API_URL = `http://${window.location.hostname}:5000/api`;
  const WS_URL = `ws://${window.location.hostname}:5000`;

  const [users, setUsers] = useState([]);
  const [cars, setCars] = useState([]);
  const [auctions, setAuctions] = useState([]);
  const [bids, setBids] = useState([]);
  const [niplTransactions, setNiplTransactions] = useState([]);

  const [activeUser, setActiveUser] = useState(() => {
    const saved = localStorage.getItem('lelangonline_active_user');
    return saved ? JSON.parse(saved) : null;
  });

  // 1. FETCH INITIAL DATA FROM API ON LOAD
  const refreshData = async () => {
    try {
      const usersRes = await fetch(`${API_URL}/users`);
      if (usersRes.ok) setUsers(await usersRes.json());

      const carsRes = await fetch(`${API_URL}/cars`);
      if (carsRes.ok) setCars(await carsRes.json());

      const auctionsRes = await fetch(`${API_URL}/auctions`);
      if (auctionsRes.ok) setAuctions(await auctionsRes.json());

      const bidsRes = await fetch(`${API_URL}/bids`);
      if (bidsRes.ok) setBids(await bidsRes.json());

      const niplRes = await fetch(`${API_URL}/nipl-transactions`);
      if (niplRes.ok) setNiplTransactions(await niplRes.json());
    } catch (err) {
      console.error('⚠️ Gagal terhubung ke API backend:', err.message);
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

  // 2. CONNECT TO WEBSOCKET FEED FOR REAL-TIME EVENTS
  useEffect(() => {
    let ws;
    let reconnectTimeout;

    const connectWebSocket = () => {
      console.log(`🔌 Menghubungkan WebSocket ke ${WS_URL}...`);
      ws = new WebSocket(WS_URL);

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          switch (data.type) {
            case 'WELCOME':
              console.log('📡 Feed WebSocket:', data.message);
              break;

            case 'COUNTDOWN_TICK':
              setAuctions(prev => prev.map(auc => 
                auc.id === data.auctionId 
                  ? { ...auc, countdown: data.countdown } 
                  : auc
              ));
              break;

            case 'NEW_BID_PLACED':
              // Update auction state with new high bid
              setAuctions(prev => prev.map(auc => 
                auc.id === data.auction.id ? data.auction : auc
              ));
              // Append to list of live bids
              setBids(prev => {
                if (prev.some(b => b.id === data.bid.id)) return prev;
                return [data.bid, ...prev];
              });
              break;

            case 'LOT_FINALIZED':
              console.log('⏱️ Lot selesai:', data.auction.lot_status);
              // Sync updated auction state
              setAuctions(prev => prev.map(auc => 
                auc.id === data.auction.id ? data.auction : auc
              ));
              // Sync updated car state
              if (data.car) {
                setCars(prev => prev.map(c => 
                  c.id === data.car.id ? { ...c, ...data.car } : c
                ));
              }
              break;

            case 'AUCTION_STATE_UPDATED':
              setAuctions(prev => prev.map(auc => 
                auc.id === data.auction.id ? data.auction : auc
              ));
              // Trigger refresh to update cars (status histories, etc.)
              refreshData();
              break;

            case 'AUCTION_NEXT_LOT':
              setAuctions(prev => prev.map(auc => 
                auc.id === data.auction.id ? data.auction : auc
              ));
              refreshData();
              break;

            default:
              break;
          }
        } catch (err) {
          console.error('Error parsing WebSocket message:', err);
        }
      };

      ws.onclose = () => {
        console.log('🔌 WebSocket terputus. Mencoba menghubungkan kembali dalam 3 detik...');
        reconnectTimeout = setTimeout(connectWebSocket, 3000);
      };

      ws.onerror = (err) => {
        console.error('WebSocket Error:', err);
        ws.close();
      };
    };

    connectWebSocket();

    return () => {
      if (ws) ws.close();
      clearTimeout(reconnectTimeout);
    };
  }, []);

  // 3. PERSIST ACTIVE USER SESSION LOCALLY
  useEffect(() => {
    if (activeUser) {
      localStorage.setItem('lelangonline_active_user', JSON.stringify(activeUser));
    } else {
      localStorage.removeItem('lelangonline_active_user');
    }
  }, [activeUser]);

  // -- AUTHENTICATION --
  const switchUser = async (userId) => {
    const user = users.find(u => u.id === userId);
    if (user) {
      setActiveUser(user);
    }
  };

  const logout = () => {
    setActiveUser(null);
  };

  // -- USER MANAGEMENT (CRUD & REGISTER APPROVAL) --
  const addUser = async (userData) => {
    try {
      const res = await fetch(`${API_URL}/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      });
      if (!res.ok) throw new Error('Gagal membuat user baru');
      const data = await res.json();
      setUsers(prev => [data, ...prev]);
      return data;
    } catch (err) {
      console.error(err);
    }
  };

  const updateUser = async (userId, updatedData) => {
    try {
      const res = await fetch(`${API_URL}/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedData)
      });
      if (!res.ok) throw new Error('Gagal memperbarui user');
      const data = await res.json();
      setUsers(prev => prev.map(u => u.id === userId ? data : u));
      if (activeUser && activeUser.id === userId) {
        setActiveUser(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const deleteUser = async (userId) => {
    try {
      const res = await fetch(`${API_URL}/users/${userId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Gagal menghapus user');
      setUsers(prev => prev.filter(u => u.id !== userId));
    } catch (err) {
      console.error(err);
    }
  };

  const verifyBuyer = async (userId, approve) => {
    try {
      const res = await fetch(`${API_URL}/users/${userId}/verify`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approve })
      });
      if (!res.ok) throw new Error('Gagal verifikasi buyer');
      const data = await res.json();
      setUsers(prev => prev.map(u => u.id === userId ? data : u));
    } catch (err) {
      console.error(err);
    }
  };

  // -- SELLER PORTAL FLOWS --
  const addCarRequest = async (carData, sellerId) => {
    try {
      const seller = users.find(u => u.id === sellerId);
      const body = {
        ...carData,
        sellerId,
        sellerName: seller ? seller.name : 'Unknown Seller'
      };
      const res = await fetch(`${API_URL}/cars`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      if (!res.ok) throw new Error('Gagal mengajukan pickup');
      const data = await res.json();
      setCars(prev => [data, ...prev]);
    } catch (err) {
      console.error(err);
    }
  };

  const confirmRecommendationPrice = async (carId, requestPrice) => {
    try {
      const res = await fetch(`${API_URL}/cars/${carId}/confirm-price`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestPrice })
      });
      if (!res.ok) throw new Error('Gagal menyetujui harga');
      const data = await res.json();
      setCars(prev => prev.map(c => c.id === carId ? { ...c, ...data } : c));
    } catch (err) {
      console.error(err);
    }
  };

  // -- INSPECTOR PORTAL FLOWS --
  const calculateGradeAndPrice = (defects, checks, isSalvage, basePrice = 100000000) => {
    if (isSalvage) {
      return { score: 0, grade: 'F', recommendedPrice: basePrice * 0.4 };
    }

    let score = 100;
    defects.forEach(d => {
      let impact = 0;
      if (d.defect === 'Gores') {
        impact = d.level === 'Rendah' ? 1 : d.level === 'Sedang' ? 2 : 3;
      } else if (d.defect === 'Penyok') {
        impact = d.level === 'Rendah' ? 2 : d.level === 'Sedang' ? 3 : 4;
      } else if (d.defect === 'Karat') {
        impact = d.level === 'Rendah' ? 3 : d.level === 'Sedang' ? 5 : 8;
      }
      score -= impact;
    });

    if (score < 0) score = 0;

    let grade = 'A';
    let multiplier = 1.1;

    if (score >= 90) {
      grade = 'A';
      multiplier = 1.1;
    } else if (score >= 79) {
      grade = 'B';
      multiplier = 1.0;
    } else if (score >= 68) {
      grade = 'C';
      multiplier = 0.9;
    } else if (score >= 50) {
      grade = 'D';
      multiplier = 0.75;
    } else {
      grade = 'E';
      multiplier = 0.6;
    }

    return {
      score,
      grade,
      recommendedPrice: Math.round(basePrice * multiplier)
    };
  };

  const submitInspection = async (carId, defects, checks, isSalvage, basePrice, note) => {
    try {
      const { score, grade, recommendedPrice } = calculateGradeAndPrice(defects, checks, isSalvage, basePrice);
      const res = await fetch(`${API_URL}/inspections`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ carId, score, grade, recommendedPrice, defects, checks, note, isSalvage })
      });
      if (!res.ok) throw new Error('Gagal menyerahkan inspeksi');
      
      // Refresh cars list to retrieve nested inspections
      const carsRes = await fetch(`${API_URL}/cars`);
      if (carsRes.ok) setCars(await carsRes.json());
    } catch (err) {
      console.error(err);
    }
  };

  // -- ADMIN PORTAL FLOWS --
  const createAuction = async (auctionData) => {
    try {
      const res = await fetch(`${API_URL}/auctions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(auctionData)
      });
      if (!res.ok) throw new Error('Gagal menjadwalkan lelang');
      const data = await res.json();
      setAuctions(prev => [data, ...prev]);
    } catch (err) {
      console.error(err);
    }
  };

  const assignCarToAuction = async (carId, auctionId, startPrice, lane, lot) => {
    try {
      const car = cars.find(c => c.id === carId);
      if (!car) return;
      const history = [...(car.status_history || []), 'Allocated'];
      const body = {
        ...car,
        status: 'ALLOCATED',
        statusHistory: history,
        auctionId,
        startPrice: parseFloat(startPrice),
        lane,
        lot: parseInt(lot)
      };
      
      const res = await fetch(`${API_URL}/cars/${carId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      if (!res.ok) throw new Error('Gagal alokasi lot mobil');
      
      const carsRes = await fetch(`${API_URL}/cars`);
      if (carsRes.ok) setCars(await carsRes.json());
    } catch (err) {
      console.error(err);
    }
  };

  const deallocateCar = async (carId) => {
    try {
      const car = cars.find(c => c.id === carId);
      if (!car) return;
      const body = {
        ...car,
        status: 'STOCK',
        auctionId: '',
        lane: '',
        lot: 0
      };
      
      const res = await fetch(`${API_URL}/cars/${carId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      if (!res.ok) throw new Error('Gagal dealokasi mobil');
      
      const carsRes = await fetch(`${API_URL}/cars`);
      if (carsRes.ok) setCars(await carsRes.json());
    } catch (err) {
      console.error(err);
    }
  };

  // -- BUYER PORTAL FLOWS --
  const purchaseNIPL = async (buyerId, type) => {
    try {
      const res = await fetch(`${API_URL}/nipl-transactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ buyerId, type })
      });
      if (!res.ok) throw new Error('Gagal membeli NIPL');
      const data = await res.json();
      setNiplTransactions(prev => [data, ...prev]);

      // Sync user info to get the updated NIPL array
      const usersRes = await fetch(`${API_URL}/users`);
      if (usersRes.ok) {
        const usersData = await usersRes.json();
        setUsers(usersData);
        // Also update local activeUser
        const selfUser = usersData.find(u => u.id === buyerId);
        if (selfUser) setActiveUser(selfUser);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // -- LIVE BIDDING & CONDUCTOR BOARD --
  const placeBid = async (auctionId, carId, buyerNipl, buyerName, amount) => {
    try {
      const res = await fetch(`${API_URL}/bids`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ auctionId, carId, buyerNipl, buyerName, amount })
      });
      if (!res.ok) throw new Error('Gagal mengirim penawaran bid');
      const data = await res.json();

      setBids(prev => {
        if (prev.some(b => b.id === data.id)) return prev;
        return [data, ...prev];
      });
    } catch (err) {
      console.error(err);
    }
  };

  const updateConductorState = async (auctionId, lotStatus, extra = {}) => {
    try {
      const auction = auctions.find(a => a.id === auctionId);
      if (!auction) return;
      const body = {
        ...auction,
        lotStatus,
        ...extra
      };
      
      const res = await fetch(`${API_URL}/auctions/${auctionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      if (!res.ok) throw new Error('Gagal memperbarui status lot conductor');
      
      const data = await res.json();
      setAuctions(prev => prev.map(a => a.id === auctionId ? data : a));

      // Refresh cars list to pull updated status histories on SOLD / UNSOLD
      if (lotStatus === 'SOLD' || lotStatus === 'UNSOLD') {
        const carsRes = await fetch(`${API_URL}/cars`);
        if (carsRes.ok) setCars(await carsRes.json());
      }
    } catch (err) {
      console.error(err);
    }
  };

  const nextLot = async (auctionId) => {
    try {
      const res = await fetch(`${API_URL}/auctions/${auctionId}/next-lot`, {
        method: 'POST'
      });
      if (!res.ok) throw new Error('Gagal melompat ke Lot berikutnya');
      const data = await res.json();
      setAuctions(prev => prev.map(a => a.id === auctionId ? data : a));
    } catch (err) {
      console.error(err);
    }
  };

  // -- POST AUCTION HANDOVER & BILLING --
  const updatePaymentStatus = async (carId, status) => {
    try {
      const car = cars.find(c => c.id === carId);
      if (!car) return;
      const body = { ...car, paymentStatus: status };
      
      const res = await fetch(`${API_URL}/cars/${carId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      if (!res.ok) throw new Error('Gagal memperbarui status pembayaran');
      const data = await res.json();
      
      setCars(prev => prev.map(c => c.id === carId ? { ...c, ...data } : c));
    } catch (err) {
      console.error(err);
    }
  };

  const submitHandover = async (carId, givenBy, receivedBy) => {
    try {
      const car = cars.find(c => c.id === carId);
      if (!car) return;
      const history = [...(car.status_history || []), 'Handover'];
      const body = {
        ...car,
        status: 'HANDEOVER_COMPLETE',
        statusHistory: history,
        givenBy,
        receivedBy,
        handoverDate: new Date().toISOString().split('T')[0]
      };
      
      const res = await fetch(`${API_URL}/cars/${carId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      if (!res.ok) throw new Error('Gagal menyimpan berita acara serah terima');
      const data = await res.json();
      
      setCars(prev => prev.map(c => c.id === carId ? { ...c, ...data } : c));
    } catch (err) {
      console.error(err);
    }
  };

  // Direct actions for admin crud
  const addCarDirect = async (carData) => {
    try {
      const res = await fetch(`${API_URL}/cars`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(carData)
      });
      if (!res.ok) throw new Error('Gagal menyimpan data awal mobil');
      const data = await res.json();
      setCars(prev => [data, ...prev]);
      return data;
    } catch (err) {
      console.error(err);
    }
  };

  const updateCar = async (carId, updatedData) => {
    try {
      const res = await fetch(`${API_URL}/cars/${carId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedData)
      });
      if (!res.ok) throw new Error('Gagal memperbarui data mobil');
      
      const carsRes = await fetch(`${API_URL}/cars`);
      if (carsRes.ok) setCars(await carsRes.json());
    } catch (err) {
      console.error(err);
    }
  };

  const deleteCar = async (carId) => {
    try {
      const res = await fetch(`${API_URL}/cars/${carId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Gagal menghapus data mobil');
      setCars(prev => prev.filter(c => c.id !== carId));
    } catch (err) {
      console.error(err);
    }
  };

  const updateAuction = async (auctionId, updatedData) => {
    try {
      const res = await fetch(`${API_URL}/auctions/${auctionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedData)
      });
      if (!res.ok) throw new Error('Gagal memperbarui lelang');
      const data = await res.json();
      setAuctions(prev => prev.map(a => a.id === auctionId ? data : a));
    } catch (err) {
      console.error(err);
    }
  };

  const deleteAuction = async (auctionId) => {
    try {
      const res = await fetch(`${API_URL}/auctions/${auctionId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Gagal menghapus lelang');
      setAuctions(prev => prev.filter(a => a.id !== auctionId));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <AuctionContext.Provider value={{
      APP_CONFIG,
      users,
      cars,
      auctions,
      activeUser,
      bids,
      niplTransactions,
      switchUser,
      addUser,
      updateUser,
      deleteUser,
      verifyBuyer,
      addCarRequest,
      confirmRecommendationPrice,
      calculateGradeAndPrice,
      submitInspection,
      createAuction,
      assignCarToAuction,
      deallocateCar,
      purchaseNIPL,
      placeBid,
      updateConductorState,
      nextLot,
      updatePaymentStatus,
      submitHandover,
      addCarDirect,
      updateCar,
      deleteCar,
      updateAuction,
      deleteAuction,
      logout
    }}>
      {children}
    </AuctionContext.Provider>
  );
};
