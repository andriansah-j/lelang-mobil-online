import React, { createContext, useState, useEffect } from 'react';
import { APP_CONFIG } from '../config';

export const AuctionContext = createContext();

// Initial database seed
const INITIAL_USERS = [
  { id: 'usr-admin', name: 'Super Admin', email: `admin@${APP_CONFIG.emailDomain}`, phone: '08123456789', role: 'admin', status: 'active', password: 'password' },
  { id: 'usr-insp1', name: 'Joko Sulistyo', email: `inspector@${APP_CONFIG.emailDomain}`, phone: '08234567890', role: 'inspector admin', status: 'active', password: 'password' },
  { id: 'usr-cond1', name: 'Ivan Mobil', email: `conductor@${APP_CONFIG.emailDomain}`, phone: '08345678901', role: 'conductor admin', status: 'active', password: 'password' },
  { id: 'usr-buyer1', name: 'Budi Sukarjan', email: `buyer@${APP_CONFIG.emailDomain}`, phone: '08122334455', role: 'user', type: 'buyer', status: 'active', password: 'password', ktp: '23523535131', balance: 50000000, nipls: ['REG001', 'REG003'] },
  { id: 'usr-seller1', name: 'Reva Motor', email: `seller@${APP_CONFIG.emailDomain}`, phone: '08133445566', role: 'user', type: 'seller', status: 'active', password: 'password', company: 'PT Reva Motor Utama', address: 'Jl. Meruya No. 18, Jakarta Barat', branch: 'Jakarta', commissionRate: 1 },
  { id: 'usr-buyer2', name: 'Ahmad Dahlan', email: `ahmad@${APP_CONFIG.emailDomain}`, phone: '08199887766', role: 'user', type: 'buyer', status: 'pending_verification', password: 'password', ktp: '36012344567890', balance: 0, nipls: [] }
];

const INITIAL_CARS = [
  {
    id: 'CAR-001',
    plateNo: 'B1234AA',
    maker: 'Toyota',
    model: 'Avanza',
    type: '1.3G M/T',
    color: 'Hitam',
    year: 2012,
    cc: 1300,
    fuel: 'Bensin',
    transmission: 'M/T',
    odometer: 120000,
    sellerId: 'usr-seller1',
    sellerName: 'Reva Motor',
    branch: 'Jakarta',
    status: 'SOLD',
    statusHistory: ['Pickup', 'Cleaned', 'New', 'Yard', 'Stock', 'Allocated', 'Sold'],
    inspection: {
      score: 84,
      grade: 'B',
      recommendedPrice: 90000000,
      defects: [
        { area: 'Front', defect: 'Gores', level: 'Rendah', scoreImpact: 1 },
        { area: 'Rear', defect: 'Penyok', level: 'Sedang', scoreImpact: 3 },
        { area: 'Left 1', defect: 'Gores', level: 'Rendah', scoreImpact: 1 },
        { area: 'Right 1', defect: 'Karat', level: 'Tinggi', scoreImpact: 8 },
        { area: 'Right 2', defect: 'Gores', level: 'Rendah', scoreImpact: 1 }
      ],
      checks: {
        kunci: 'Ya', kunciUtama: 'Ya', sumKunci: 2, remot: 'Ya', remoteUtama: 1,
        bukuManual: 'Ya', bukuServis: 'Ya', banCadangan: 'Ya', dongkrak: 'Ya',
        tapeMobil: 'Ya', tipeTape: 'Touch Panel + Navi', mesinBekerja: 'Ya',
        langsamStabil: 'Ya', powerWindow: 'OK', ac: 'OK', warningLamp: 'OK', lampuSein: 'OK'
      },
      note: 'Ban serep kempes, power window kanan agak macet.'
    },
    requestPrice: 85000000,
    startPrice: 80000000,
    closingPrice: 91000000,
    winnerName: 'Budi Sukarjan',
    winnerNipl: 'REG001',
    paymentStatus: 'PAID',
    auctionId: 'AUC-001',
    lane: 'A',
    lot: 1,
    handoverDate: '2026-05-28',
    givenBy: 'Joko Sulistyo',
    receivedBy: 'Budi Sukarjan'
  },
  {
    id: 'CAR-002',
    plateNo: 'B2345BB',
    maker: 'Toyota',
    model: 'Vios',
    type: 'G A/T',
    color: 'Silver',
    year: 2012,
    cc: 1500,
    fuel: 'Bensin',
    transmission: 'A/T',
    odometer: 85000,
    sellerId: 'usr-seller1',
    sellerName: 'Reva Motor',
    branch: 'Jakarta',
    status: 'STOCK',
    statusHistory: ['Pickup', 'Cleaned', 'New', 'Yard', 'Stock'],
    inspection: {
      score: 95,
      grade: 'A',
      recommendedPrice: 75000000,
      defects: [],
      checks: {
        kunci: 'Ya', kunciUtama: 'Ya', sumKunci: 2, remot: 'Ya', remoteUtama: 2,
        bukuManual: 'Ya', bukuServis: 'Ya', banCadangan: 'Ya', dongkrak: 'Ya',
        tapeMobil: 'Ya', tipeTape: 'Analog', mesinBekerja: 'Ya',
        langsamStabil: 'Ya', powerWindow: 'OK', ac: 'OK', warningLamp: 'OK', lampuSein: 'OK'
      },
      note: 'Kondisi mulus sekali.'
    },
    requestPrice: 70000000,
    startPrice: 75000000,
    paymentStatus: 'UNPAID',
    auctionId: '',
    lane: '',
    lot: 0
  },
  {
    id: 'CAR-003',
    plateNo: 'B2467TZL',
    maker: 'Toyota',
    model: 'Calya',
    type: '1.2 G A/T',
    color: 'Hitam',
    year: 2014,
    cc: 1197,
    fuel: 'Bensin',
    transmission: 'A/T',
    odometer: 21487,
    sellerId: 'usr-seller1',
    sellerName: 'Reva Motor',
    branch: 'Jakarta',
    status: 'ALLOCATED',
    statusHistory: ['Pickup', 'Cleaned', 'New', 'Yard', 'Stock', 'Allocated'],
    inspection: {
      score: 87,
      grade: 'B',
      recommendedPrice: 120000000,
      defects: [
        { area: 'Front', defect: 'Gores', level: 'Rendah', scoreImpact: 1 },
        { area: 'Rear', defect: 'Penyok', level: 'Rendah', scoreImpact: 2 },
        { area: 'Left 1', defect: 'Gores', level: 'Rendah', scoreImpact: 1 },
        { area: 'Right 1', defect: 'Karat', level: 'Tinggi', scoreImpact: 8 },
        { area: 'Right 2', defect: 'Gores', level: 'Rendah', scoreImpact: 1 }
      ],
      checks: {
        kunci: 'Ya', kunciUtama: 'Ya', sumKunci: 2, remot: 'Ya', remoteUtama: 1,
        bukuManual: 'Ya', bukuServis: 'Ya', banCadangan: 'Ya', dongkrak: 'Ya',
        tapeMobil: 'Ya', tipeTape: 'Touch Panel + Navi', mesinBekerja: 'Ya',
        langsamStabil: 'Ya', powerWindow: 'OK', ac: 'OK', warningLamp: 'OK', lampuSein: 'OK'
      },
      note: 'Ban serep bocor, power window kiri belakang seret.'
    },
    requestPrice: 118000000,
    startPrice: 120000000,
    paymentStatus: 'UNPAID',
    auctionId: 'AUC-001',
    lane: 'A',
    lot: 2
  },
  {
    id: 'CAR-004',
    plateNo: 'B3456CC',
    maker: 'Honda',
    model: 'City',
    type: '1.5 i-VTEC',
    color: 'Putih',
    year: 2014,
    cc: 1500,
    fuel: 'Bensin',
    transmission: 'A/T',
    odometer: 60000,
    sellerId: 'usr-seller1',
    sellerName: 'Reva Motor',
    branch: 'Jakarta',
    status: 'ALLOCATED',
    statusHistory: ['Pickup', 'Cleaned', 'New', 'Yard', 'Stock', 'Allocated'],
    inspection: {
      score: 92,
      grade: 'A',
      recommendedPrice: 150000000,
      defects: [
        { area: 'Left 1', defect: 'Gores', level: 'Rendah', scoreImpact: 1 },
        { area: 'Right 1', defect: 'Gores', level: 'Rendah', scoreImpact: 1 }
      ],
      checks: {
        kunci: 'Ya', kunciUtama: 'Ya', sumKunci: 2, remot: 'Ya', remoteUtama: 2,
        bukuManual: 'Ya', bukuServis: 'Ya', banCadangan: 'Ya', dongkrak: 'Ya',
        tapeMobil: 'Ya', tipeTape: 'Touch Panel + Navi', mesinBekerja: 'Ya',
        langsamStabil: 'Ya', powerWindow: 'OK', ac: 'OK', warningLamp: 'OK', lampuSein: 'OK'
      },
      note: 'Mesin sangat halus.'
    },
    requestPrice: 148000000,
    startPrice: 150000000,
    paymentStatus: 'UNPAID',
    auctionId: 'AUC-001',
    lane: 'A',
    lot: 3
  },
  {
    id: 'CAR-005',
    plateNo: 'B9999XYZ',
    maker: 'Honda',
    model: 'Brio',
    type: '1.2 E',
    color: 'Merah',
    year: 2017,
    cc: 1200,
    fuel: 'Bensin',
    transmission: 'A/T',
    odometer: 45000,
    sellerId: 'usr-seller1',
    sellerName: 'Reva Motor',
    branch: 'Jakarta',
    status: 'NEW',
    statusHistory: ['Pickup', 'Cleaned', 'New'],
    inspection: null,
    requestPrice: 0,
    startPrice: 0,
    paymentStatus: 'UNPAID',
    auctionId: '',
    lane: '',
    lot: 0
  }
];

const INITIAL_AUCTIONS = [
  {
    id: 'AUC-001',
    name: 'Jakarta-Car-00026-29/05/2026',
    branch: 'Jakarta',
    date: '2026-05-29',
    startTime: '09:00',
    endTime: '12:00',
    type: 'By highest bid',
    productType: 'Mobil',
    auctioneer: 'Ivan Mobil',
    status: 'Active', // Active, Scheduled, Finished
    currentLotIndex: 1, // index of currently active car in this auction
    currentBid: 120000000,
    highestBidderNipl: '',
    highestBidderName: '',
    countdown: 10,
    lotStatus: 'CLOSED' // CLOSED, BIDDING, COUNTDOWN, SOLD, UNSOLD
  },
  {
    id: 'AUC-002',
    name: 'Bandung-Car-00017-30/05/2026',
    branch: 'Bandung',
    date: '2026-05-30',
    startTime: '10:00',
    endTime: '13:00',
    type: 'By highest bid',
    productType: 'Mobil',
    auctioneer: 'Ivan Mobil',
    status: 'Scheduled',
    currentLotIndex: 0,
    currentBid: 0,
    highestBidderNipl: '',
    highestBidderName: '',
    countdown: 0,
    lotStatus: 'CLOSED'
  }
];

export const AuctionProvider = ({ children }) => {
  const [users, setUsers] = useState(() => {
    const saved = localStorage.getItem('lelangonline_users');
    return saved ? JSON.parse(saved) : INITIAL_USERS;
  });

  const [cars, setCars] = useState(() => {
    const saved = localStorage.getItem('lelangonline_cars');
    return saved ? JSON.parse(saved) : INITIAL_CARS;
  });

  const [auctions, setAuctions] = useState(() => {
    const saved = localStorage.getItem('lelangonline_auctions');
    return saved ? JSON.parse(saved) : INITIAL_AUCTIONS;
  });

  const [activeUser, setActiveUser] = useState(() => {
    const saved = localStorage.getItem('lelangonline_active_user');
    return saved ? JSON.parse(saved) : null; // Default to null (guest / not logged in)
  });

  const [bids, setBids] = useState(() => {
    const saved = localStorage.getItem('lelangonline_bids');
    return saved ? JSON.parse(saved) : [];
  });

  const [niplTransactions, setNiplTransactions] = useState(() => {
    const saved = localStorage.getItem('lelangonline_nipls');
    return saved ? JSON.parse(saved) : [
      { id: 'NIPL-001', buyerId: 'usr-buyer1', type: 'Regular', amount: 5000000, niplCode: 'REG001', status: 'PAID', va: '236623463246', date: '2026-05-28' },
      { id: 'NIPL-002', buyerId: 'usr-buyer1', type: 'Regular', amount: 5000000, niplCode: 'REG003', status: 'PAID', va: '236623463247', date: '2026-05-28' }
    ];
  });

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem('lelangonline_users', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem('lelangonline_cars', JSON.stringify(cars));
  }, [cars]);

  useEffect(() => {
    localStorage.setItem('lelangonline_auctions', JSON.stringify(auctions));
  }, [auctions]);

  useEffect(() => {
    if (activeUser) {
      localStorage.setItem('lelangonline_active_user', JSON.stringify(activeUser));
    } else {
      localStorage.removeItem('lelangonline_active_user');
    }
  }, [activeUser]);

  useEffect(() => {
    localStorage.setItem('lelangonline_bids', JSON.stringify(bids));
  }, [bids]);

  useEffect(() => {
    localStorage.setItem('lelangonline_nipls', JSON.stringify(niplTransactions));
  }, [niplTransactions]);

  // -- LOGOUT & LOGIN --
  const switchUser = (userId) => {
    const user = users.find(u => u.id === userId);
    if (user) {
      setActiveUser(user);
    }
  };

  const logout = () => {
    setActiveUser(null);
  };

  // -- USER MANAGEMENT (CRUD & REGISTER APPROVAL) --
  const addUser = (userData) => {
    const newUser = {
      id: `usr-${Date.now()}`,
      status: 'active',
      nipls: [],
      balance: 0,
      ...userData
    };
    setUsers(prev => [...prev, newUser]);
    return newUser;
  };

  const updateUser = (userId, updatedData) => {
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, ...updatedData } : u));
    // Update activeUser if same
    if (activeUser.id === userId) {
      setActiveUser(prev => ({ ...prev, ...updatedData }));
    }
  };

  const deleteUser = (userId) => {
    setUsers(prev => prev.filter(u => u.id !== userId));
  };

  const verifyBuyer = (userId, approve) => {
    setUsers(prev => prev.map(u => {
      if (u.id === userId) {
        return { ...u, status: approve ? 'active' : 'rejected' };
      }
      return u;
    }));
  };

  // -- SELLER PORTAL FLOWS --
  const addCarRequest = (carData, sellerId) => {
    const seller = users.find(u => u.id === sellerId);
    const newCar = {
      id: `CAR-${Date.now()}`,
      status: 'NEW',
      statusHistory: ['Pickup', 'Cleaned', 'New'],
      sellerId: sellerId,
      sellerName: seller ? seller.name : 'Unknown Seller',
      inspection: null,
      requestPrice: 0,
      startPrice: 0,
      paymentStatus: 'UNPAID',
      auctionId: '',
      lane: '',
      lot: 0,
      ...carData
    };
    setCars(prev => [...prev, newCar]);
  };

  const confirmRecommendationPrice = (carId, requestPrice) => {
    setCars(prev => prev.map(c => {
      if (c.id === carId) {
        return {
          ...c,
          status: 'STOCK',
          statusHistory: [...c.statusHistory, 'Stock'],
          requestPrice: parseFloat(requestPrice),
          startPrice: parseFloat(requestPrice) // Default starting price
        };
      }
      return c;
    }));
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

  const submitInspection = (carId, defects, checks, isSalvage, basePrice, note) => {
    const { score, grade, recommendedPrice } = calculateGradeAndPrice(defects, checks, isSalvage, basePrice);
    
    setCars(prev => prev.map(c => {
      if (c.id === carId) {
        return {
          ...c,
          status: 'YARD',
          statusHistory: [...c.statusHistory, 'Yard'],
          inspection: { score, grade, recommendedPrice, defects, checks, note, isSalvage }
        };
      }
      return c;
    }));
  };

  // -- ADMIN PORTAL FLOWS --
  const createAuction = (auctionData) => {
    const newAuction = {
      id: `AUC-${Date.now()}`,
      status: 'Scheduled',
      currentLotIndex: 0,
      currentBid: 0,
      highestBidderNipl: '',
      highestBidderName: '',
      countdown: 0,
      lotStatus: 'CLOSED',
      ...auctionData
    };
    setAuctions(prev => [...prev, newAuction]);
  };

  const assignCarToAuction = (carId, auctionId, startPrice, lane, lot) => {
    setCars(prev => prev.map(c => {
      if (c.id === carId) {
        return {
          ...c,
          status: 'ALLOCATED',
          statusHistory: [...c.statusHistory, 'Allocated'],
          auctionId,
          startPrice: parseFloat(startPrice),
          lane,
          lot: parseInt(lot)
        };
      }
      return c;
    }));
  };

  const deallocateCar = (carId) => {
    setCars(prev => prev.map(c => {
      if (c.id === carId) {
        return {
          ...c,
          status: 'STOCK',
          auctionId: '',
          lane: '',
          lot: 0
        };
      }
      return c;
    }));
  };

  // -- BUYER PORTAL FLOWS --
  const purchaseNIPL = (buyerId, type) => {
    const amount = type === 'Premium' ? 25000000 : 10000000;
    const isPremium = type === 'Premium';
    const randomNIPL = (isPremium ? 'PRE' : 'REG') + String(Math.floor(100 + Math.random() * 900));
    
    const newTransaction = {
      id: `NIPL-${Date.now()}`,
      buyerId,
      type,
      amount,
      niplCode: randomNIPL,
      status: 'PAID', // VA Mock payment instantly sets to PAID
      va: String(236600000000 + Math.floor(Math.random() * 999999)),
      date: new Date().toISOString().split('T')[0]
    };

    setNiplTransactions(prev => [...prev, newTransaction]);
    setUsers(prev => prev.map(u => {
      if (u.id === buyerId) {
        return {
          ...u,
          nipls: [...(u.nipls || []), randomNIPL]
        };
      }
      return u;
    }));
  };

  // -- LIVE BIDDING & CONDUCTOR BOARD --
  const placeBid = (auctionId, carId, buyerNipl, buyerName, amount) => {
    const newBidLog = {
      id: `BID-${Date.now()}`,
      auctionId,
      carId,
      buyerNipl,
      buyerName,
      amount: parseFloat(amount),
      time: new Date().toLocaleTimeString('id-ID')
    };

    setBids(prev => [...prev, newBidLog]);

    setAuctions(prev => prev.map(auc => {
      if (auc.id === auctionId) {
        return {
          ...auc,
          currentBid: parseFloat(amount),
          highestBidderNipl: buyerNipl,
          highestBidderName: buyerName,
          countdown: 10 // Reset countdown on new bid
        };
      }
      return auc;
    }));
  };

  const updateConductorState = (auctionId, lotStatus, extra = {}) => {
    setAuctions(prev => prev.map(auc => {
      if (auc.id === auctionId) {
        let updated = { ...auc, lotStatus, ...extra };
        
        // If sold/unsold, we finalize the car
        if (lotStatus === 'SOLD' || lotStatus === 'UNSOLD') {
          const carsInAuction = cars.filter(c => c.auctionId === auctionId).sort((a, b) => a.lot - b.lot);
          const activeCar = carsInAuction[auc.currentLotIndex];
          if (activeCar) {
            setCars(prevCars => prevCars.map(c => {
              if (c.id === activeCar.id) {
                return {
                  ...c,
                  status: lotStatus,
                  statusHistory: [...c.statusHistory, lotStatus],
                  closingPrice: lotStatus === 'SOLD' ? auc.currentBid : 0,
                  winnerNipl: lotStatus === 'SOLD' ? auc.highestBidderNipl : '',
                  winnerName: lotStatus === 'SOLD' ? auc.highestBidderName : '',
                  paymentStatus: 'UNPAID'
                };
              }
              return c;
            }));
          }
        }
        return updated;
      }
      return auc;
    }));
  };

  const nextLot = (auctionId) => {
    setAuctions(prev => prev.map(auc => {
      if (auc.id === auctionId) {
        const carsInAuction = cars.filter(c => c.auctionId === auctionId);
        const nextIndex = auc.currentLotIndex + 1;
        
        // Reset bidding values for next car
        const nextCar = carsInAuction.sort((a, b) => a.lot - b.lot)[nextIndex];
        const nextStartPrice = nextCar ? nextCar.startPrice : 0;

        return {
          ...auc,
          currentLotIndex: nextIndex < carsInAuction.length ? nextIndex : auc.currentLotIndex,
          currentBid: nextStartPrice,
          highestBidderNipl: '',
          highestBidderName: '',
          countdown: 0,
          lotStatus: nextIndex < carsInAuction.length ? 'CLOSED' : 'FINISHED',
          status: nextIndex < carsInAuction.length ? 'Active' : 'Finished'
        };
      }
      return auc;
    }));
  };

  // -- POST AUCTION HANDOVER & BILLING --
  const updatePaymentStatus = (carId, status) => {
    setCars(prev => prev.map(c => c.id === carId ? { ...c, paymentStatus: status } : c));
  };

  const submitHandover = (carId, givenBy, receivedBy) => {
    setCars(prev => prev.map(c => {
      if (c.id === carId) {
        return {
          ...c,
          status: 'HANDEOVER_COMPLETE',
          statusHistory: [...c.statusHistory, 'Handover'],
          givenBy,
          receivedBy,
          handoverDate: new Date().toISOString().split('T')[0]
        };
      }
      return c;
    }));
  };

  const addCarDirect = (carData) => {
    const newCar = {
      id: `CAR-${Date.now()}`,
      status: 'NEW',
      statusHistory: ['New'],
      requestPrice: 0,
      startPrice: 0,
      paymentStatus: 'UNPAID',
      auctionId: '',
      lane: '',
      lot: 0,
      inspection: null,
      ...carData
    };
    setCars(prev => [...prev, newCar]);
    return newCar;
  };

  const updateCar = (carId, updatedData) => {
    setCars(prev => prev.map(c => c.id === carId ? { ...c, ...updatedData } : c));
  };

  const deleteCar = (carId) => {
    setCars(prev => prev.filter(c => c.id !== carId));
  };

  const updateAuction = (auctionId, updatedData) => {
    setAuctions(prev => prev.map(a => a.id === auctionId ? { ...a, ...updatedData } : a));
  };

  const deleteAuction = (auctionId) => {
    setAuctions(prev => prev.filter(a => a.id !== auctionId));
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
