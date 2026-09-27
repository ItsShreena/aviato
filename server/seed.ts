import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding sequence...');

  // 1. Clear existing database entries to ensure a pristine state
  await prisma.booking.deleteMany({});
  await prisma.flight.deleteMany({});
  await prisma.aircraft.deleteMany({});
  await prisma.airport.deleteMany({});
  await prisma.user.deleteMany({});

  console.log('🧹 Existing database records purged successfully.');

  // 2. Hash default passwords
  const hashedAdminPassword = await bcrypt.hash('admin123', 10);
  const hashedCustomerPassword = await bcrypt.hash('traveler123', 10);

  // 3. Create Admin and Standard Customer accounts
  const admin = await prisma.user.create({
    data: {
      email: 'admin@aviato.vip',
      name: 'Victoria Stirling',
      password: hashedAdminPassword,
      role: 'ADMIN',
      passportNumber: 'US-987654321',
    },
  });

  const customer = await prisma.user.create({
    data: {
      email: 'traveler@aviato.vip',
      name: 'Julian Sterling',
      password: hashedCustomerPassword,
      role: 'CUSTOMER',
      passportNumber: 'US-123456789',
    },
  });

  // Create additional customer users for more robust data
  const extraCustomersData = [
    { email: 'elena@vance.vip', name: 'Elena Vance', password: hashedCustomerPassword, role: 'CUSTOMER', passportNumber: 'US-445566778' },
    { email: 'brody@aviato.vip', name: 'Marcus Brody', password: hashedCustomerPassword, role: 'CUSTOMER', passportNumber: 'US-112233445' },
    { email: 'sophia@loren.vip', name: 'Sophia Loren', password: hashedCustomerPassword, role: 'CUSTOMER', passportNumber: 'IT-556677889' },
  ];

  const dbCustomers = [customer];
  for (const c of extraCustomersData) {
    const created = await prisma.user.create({ data: c });
    dbCustomers.push(created);
  }

  console.log('👥 Standard Users, Customers, and Administrator accounts registered.');

  // 4. Create premium luxury aircraft fleet (15 Aircraft as requested)
  const aircraftList = [
    {
      name: 'Gulfstream G650ER',
      model: 'G650ER',
      capacity: 19,
      range: 13890,
      speed: 956,
      amenities: 'Private Suite,Master Bath,High-Speed Wi-Fi,Full Galley,Dining Area,Sleep Configurations',
      interiorImage: 'https://images.unsplash.com/photo-1540962351504-03099e0a754b?auto=format&fit=crop&w=1200&q=80',
      status: 'ACTIVE',
    },
    {
      name: 'Bombardier Global 7500',
      model: 'Global 7500',
      capacity: 19,
      range: 14260,
      speed: 982,
      amenities: 'Four Living Spaces,Dedicated Crew Suite,Full-Size Bed,En-Suite Shower,Ka-band Connectivity',
      interiorImage: 'https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&w=1200&q=80',
      status: 'ACTIVE',
    },
    {
      name: 'Dassault Falcon 8X',
      model: 'Falcon 8X',
      capacity: 16,
      range: 11945,
      speed: 900,
      amenities: 'Quietest Cabin in Class,Advanced Acoustic Insulation,Shower,Tri-Jet Redundancy,Ergonomic Lounge',
      interiorImage: 'https://images.unsplash.com/photo-1606761568499-6d2451b23c66?auto=format&fit=crop&w=1200&q=80',
      status: 'ACTIVE',
    },
    {
      name: 'Cessna Citation X',
      model: 'Citation X',
      capacity: 12,
      range: 6410,
      speed: 972,
      amenities: 'Ultra-Fast Transcontinental,Refreshment Center,Wi-Fi,Executive Writing Tables,Custom Leather Seats',
      interiorImage: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=1200&q=80',
      status: 'ACTIVE',
    },
    {
      name: 'Embraer Lineage 1000E',
      model: 'Lineage 1000E',
      capacity: 19,
      range: 8519,
      speed: 871,
      amenities: 'Master Bedroom with Ensuite Shower,Spacious Dining Table,Gourmet Galley,Zone-controlled Airflow,Two Crew Rest Zones',
      interiorImage: 'https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&w=1200&q=80',
      status: 'ACTIVE',
    },
    {
      name: 'Boeing BBJ 787',
      model: 'BBJ 787',
      capacity: 40,
      range: 18418,
      speed: 913,
      amenities: 'Presidential Suite,Boardroom for 12,Master Stateroom with King Bed,Steam Room,Fully Stocked Lounge Bar',
      interiorImage: 'https://images.unsplash.com/photo-1540962351504-03099e0a754b?auto=format&fit=crop&w=1200&q=80',
      status: 'ACTIVE',
    },
    {
      name: 'Airbus ACJ320neo',
      model: 'ACJ320neo',
      capacity: 25,
      range: 11100,
      speed: 871,
      amenities: 'Social Area with Sofas,Private Office,Cinema Theater,Full Shower,Gourmet Kitchen,Integrated Humidifiers',
      interiorImage: 'https://images.unsplash.com/photo-1606761568499-6d2451b23c66?auto=format&fit=crop&w=1200&q=80',
      status: 'ACTIVE',
    },
    {
      name: 'HondaJet Elite II',
      model: 'Elite II',
      capacity: 6,
      range: 2865,
      speed: 782,
      amenities: 'Over-the-Wing Engine Mount,Lavatory with Skylights,Plush Double-club Leather Seating,Bose Noise-canceling Headsets,Gourmet Coffee Maker',
      interiorImage: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=1200&q=80',
      status: 'ACTIVE',
    },
    {
      name: 'Learjet 75',
      model: 'Learjet 75',
      capacity: 8,
      range: 3778,
      speed: 861,
      amenities: 'Pocket Door Noise Barrier,Double Club Executive Seating,In-Flight Wardrobe,State-of-the-art Cabin Management,Touch Screen Monitors',
      interiorImage: 'https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&w=1200&q=80',
      status: 'ACTIVE',
    },
    {
      name: 'Bombardier Challenger 350',
      model: 'Challenger 350',
      capacity: 10,
      range: 5926,
      speed: 882,
      amenities: 'Flat Floor Cabin,Full-size Galley,Handcrafted Recliners,Immersive Audio System,Retractable Monitors,Espresso Maker',
      interiorImage: 'https://images.unsplash.com/photo-1540962351504-03099e0a754b?auto=format&fit=crop&w=1200&q=80',
      status: 'ACTIVE',
    },
    {
      name: 'Gulfstream G700',
      model: 'G700',
      capacity: 19,
      range: 13890,
      speed: 982,
      amenities: 'Ultra-low Cabin Altitude,True Circadian Lighting,Grand Suite with Queen Bed,Full Kitchen,Dedicated Crew Lounge',
      interiorImage: 'https://images.unsplash.com/photo-1606761568499-6d2451b23c66?auto=format&fit=crop&w=1200&q=80',
      status: 'ACTIVE',
    },
    {
      name: 'Dassault Falcon 10X',
      model: 'Falcon 10X',
      capacity: 19,
      range: 13900,
      speed: 982,
      amenities: 'Widest Cabin in Aviation,Integrated Sky-Windows,Private Bedroom with Stand-up Shower,Advanced Clean Air Filtration,Fold-out Dining Lounge',
      interiorImage: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=1200&q=80',
      status: 'ACTIVE',
    },
    {
      name: 'Cessna Citation Longitude',
      model: 'Longitude',
      capacity: 12,
      range: 6482,
      speed: 882,
      amenities: 'Walk-In Baggage Compartment,Full Galley with Hot Water,Wireless Charger Docks,Advanced Soundproofing,Swivel Seats',
      interiorImage: 'https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&w=1200&q=80',
      status: 'ACTIVE',
    },
    {
      name: 'Embraer Praetor 600',
      model: 'Praetor 600',
      capacity: 12,
      range: 7441,
      speed: 863,
      amenities: 'HEPA Filters,Full-flat Berthing Divan,Wet Galley,Stone Flooring Options,Immersive Entertainment,Satellite Phone',
      interiorImage: 'https://images.unsplash.com/photo-1540962351504-03099e0a754b?auto=format&fit=crop&w=1200&q=80',
      status: 'ACTIVE',
    },
    {
      name: 'Boeing BBJ Max 8',
      model: 'BBJ Max 8',
      capacity: 30,
      range: 12250,
      speed: 853,
      amenities: 'Master Bedroom with Full Bed,Private Dining Area,Dedicated Teleconferencing Lounge,Stand-up Hot Shower,Gourmet Galley,Premium Bar',
      interiorImage: 'https://images.unsplash.com/photo-1606761568499-6d2451b23c66?auto=format&fit=crop&w=1200&q=80',
      status: 'ACTIVE',
    },
  ];

  const dbAircraft: any[] = [];
  for (const plane of aircraftList) {
    const created = await prisma.aircraft.create({ data: plane });
    dbAircraft.push(created);
  }
  console.log(`✈️ Luxury fleet initialized with ${dbAircraft.length} flagship private aircraft.`);

  // 5. Create 30 luxury Airport Hubs
  const airportsData = [
    { code: 'JFK', name: 'John F. Kennedy International Airport', city: 'New York', country: 'United States' },
    { code: 'LHR', name: 'London Heathrow Airport', city: 'London', country: 'United Kingdom' },
    { code: 'DXB', name: 'Dubai International Airport', city: 'Dubai', country: 'United Arab Emirates' },
    { code: 'HND', name: 'Haneda Airport', city: 'Tokyo', country: 'Japan' },
    { code: 'CDG', name: 'Charles de Gaulle Airport', city: 'Paris', country: 'France' },
    { code: 'SIN', name: 'Singapore Changi Airport', city: 'Singapore', country: 'Singapore' },
    { code: 'LAX', name: 'Los Angeles International Airport', city: 'Los Angeles', country: 'United States' },
    { code: 'ORD', name: 'O\'Hare International Airport', city: 'Chicago', country: 'United States' },
    { code: 'SYD', name: 'Sydney Kingsford Smith Airport', city: 'Sydney', country: 'Australia' },
    { code: 'SFO', name: 'San Francisco International Airport', city: 'San Francisco', country: 'United States' },
    { code: 'FRA', name: 'Frankfurt Airport', city: 'Frankfurt', country: 'Germany' },
    { code: 'AMS', name: 'Amsterdam Airport Schiphol', city: 'Amsterdam', country: 'Netherlands' },
    { code: 'HKG', name: 'Hong Kong International Airport', city: 'Hong Kong', country: 'China' },
    { code: 'FCO', name: 'Leonardo da Vinci-Fiumicino Airport', city: 'Rome', country: 'Italy' },
    { code: 'ZRH', name: 'Zurich Airport', city: 'Zurich', country: 'Switzerland' },
    { code: 'YVR', name: 'Vancouver International Airport', city: 'Vancouver', country: 'Canada' },
    { code: 'MUC', name: 'Munich Airport', city: 'Munich', country: 'Germany' },
    { code: 'MAD', name: 'Adolfo Suárez Madrid-Barajas Airport', city: 'Madrid', country: 'Spain' },
    { code: 'DEL', name: 'Indira Gandhi International Airport', city: 'Delhi', country: 'India' },
    { code: 'BOM', name: 'Chhatrapati Shivaji Maharaj International Airport', city: 'Mumbai', country: 'India' },
    { code: 'IST', name: 'Istanbul Airport', city: 'Istanbul', country: 'Turkey' },
    { code: 'ICN', name: 'Incheon International Airport', city: 'Seoul', country: 'South Korea' },
    { code: 'CPT', name: 'Cape Town International Airport', city: 'Cape Town', country: 'South Africa' },
    { code: 'GRU', name: 'São Paulo/Guarulhos International Airport', city: 'São Paulo', country: 'Brazil' },
    { code: 'MEX', name: 'Mexico City International Airport', city: 'Mexico City', country: 'Mexico' },
    { code: 'ARN', name: 'Stockholm Arlanda Airport', city: 'Stockholm', country: 'Sweden' },
    { code: 'BCN', name: 'Barcelona-El Prat Airport', city: 'Barcelona', country: 'Spain' },
    { code: 'VIE', name: 'Vienna International Airport', city: 'Vienna', country: 'Austria' },
    { code: 'DOH', name: 'Hamad International Airport', city: 'Doha', country: 'Qatar' },
    { code: 'AKL', name: 'Auckland Airport', city: 'Auckland', country: 'New Zealand' },
  ];

  const dbAirports: any[] = [];
  for (const port of airportsData) {
    const created = await prisma.airport.create({ data: port });
    dbAirports.push(created);
  }
  console.log(`🏛️ ${dbAirports.length} major global airport hubs registered.`);

  // Find airports to map curated flights
  const jfk = dbAirports.find(a => a.code === 'JFK');
  const lhr = dbAirports.find(a => a.code === 'LHR');
  const cdg = dbAirports.find(a => a.code === 'CDG');
  const hnd = dbAirports.find(a => a.code === 'HND');
  const dxb = dbAirports.find(a => a.code === 'DXB');
  const sin = dbAirports.find(a => a.code === 'SIN');

  // 5.5 Seed the 3 Curated Featured Flights so they are bookable and do not cause 404 errors
  console.log('🌟 Seeding curated featured flights...');
  const featuredFlightsData = [
    {
      id: 'feat-1',
      flightNo: 'AV-202',
      airline: 'Aviato Supreme',
      airlineCode: 'AV',
      departureCity: 'New York',
      arrivalCity: 'London',
      departureAirportId: jfk?.id || null,
      arrivalAirportId: lhr?.id || null,
      departureTime: '08:30 PM',
      arrivalTime: '08:45 AM',
      date: '2026-06-25',
      duration: '7h 15m',
      stops: 0,
      price: 620,
      cabinClass: 'First',
      aircraftId: dbAircraft[0].id,
      availableSeats: 'A1,A2,B1,B2,C1,C2,D1,D2,E1,E2',
    },
    {
      id: 'feat-2',
      flightNo: 'AV-880',
      airline: 'Sovereign Wings',
      airlineCode: 'SW',
      departureCity: 'Paris',
      arrivalCity: 'Tokyo',
      departureAirportId: cdg?.id || null,
      arrivalAirportId: hnd?.id || null,
      departureTime: '01:15 PM',
      arrivalTime: '08:50 AM',
      date: '2026-06-26',
      duration: '11h 35m',
      stops: 0,
      price: 940,
      cabinClass: 'First',
      aircraftId: dbAircraft[1].id,
      availableSeats: 'A1,A2,B1,B2,C1,C2,D1,D2,E1,E2',
    },
    {
      id: 'feat-3',
      flightNo: 'AV-305',
      airline: 'Aviato Express',
      airlineCode: 'AV',
      departureCity: 'Dubai',
      arrivalCity: 'Singapore',
      departureAirportId: dxb?.id || null,
      arrivalAirportId: sin?.id || null,
      departureTime: '10:10 AM',
      arrivalTime: '09:30 PM',
      date: '2026-06-28',
      duration: '7h 20m',
      stops: 0,
      price: 480,
      cabinClass: 'First',
      aircraftId: dbAircraft[2].id,
      availableSeats: 'A1,A2,B1,B2,C1,C2,D1,D2,E1,E2',
    },
  ];

  const dbFeaturedFlights: any[] = [];
  for (const featFlight of featuredFlightsData) {
    const created = await prisma.flight.create({
      data: featFlight,
    });
    dbFeaturedFlights.push(created);
  }
  console.log('✅ Curated featured flights seeded successfully.');

  // 6. Generate scheduled flights (including dynamic, recurring, and multi-week prices)
  const basePrices = [4500, 7200, 9800, 12500, 15000];
  const departureTimes = ['08:00 AM', '11:30 AM', '02:45 PM', '06:15 PM', '10:00 PM'];
  const arrivalTimes = ['01:30 PM', '05:00 PM', '08:15 PM', '11:45 PM', '04:30 AM'];
  const durations = ['5h 30m', '6h 15m', '7h 45m', '8h 30m', '10h 15m'];

  // Seed flights for today and the next 14 days
  const today = new Date();
  const airlines = [
    { name: 'Aviato Supreme', code: 'AV' },
    { name: 'Sovereign Wings', code: 'SW' },
    { name: 'Oceanic Airline', code: 'OA' },
    { name: 'Apex Elite', code: 'AE' },
  ];

  let flightCounter = 0;
  const dbFlights: any[] = [];

  for (let offset = 0; offset <= 14; offset++) {
    const flightDate = new Date(today);
    flightDate.setDate(today.getDate() + offset);
    const dateString = flightDate.toISOString().split('T')[0];

    // Seed combinations of routes to get at least 50+ flights
    for (let f = 0; f < 5; f++) {
      const depIdx = (offset * 5 + f) % dbAirports.length;
      let arrIdx = (depIdx + 7) % dbAirports.length;
      if (depIdx === arrIdx) {
        arrIdx = (arrIdx + 1) % dbAirports.length;
      }

      const depAirport = dbAirports[depIdx];
      const arrAirport = dbAirports[arrIdx];

      const airline = airlines[(depIdx + arrIdx) % airlines.length];
      const aircraft = dbAircraft[(depIdx + arrIdx) % dbAircraft.length];
      const departureTime = departureTimes[(depIdx + offset) % departureTimes.length];
      const arrivalTime = arrivalTimes[(arrIdx + offset) % arrivalTimes.length];
      const duration = durations[(depIdx + arrIdx) % durations.length];
      const price = basePrices[(depIdx + arrIdx) % basePrices.length] + (offset * 150) - (offset % 2 * 300);

      const flight = await prisma.flight.create({
        data: {
          flightNo: `${airline.code}-${3000 + flightCounter}`,
          airline: airline.name,
          airlineCode: airline.code,
          departureCity: depAirport.city,
          arrivalCity: arrAirport.city,
          departureAirportId: depAirport.id,
          arrivalAirportId: arrAirport.id,
          departureTime,
          arrivalTime,
          price,
          date: dateString,
          duration,
          cabinClass: 'First',
          stops: f % 3 === 0 ? 1 : 0,
          aircraftId: aircraft.id,
          availableSeats: 'A1,A2,B1,B2,C1,C2,D1,D2,E1,E2',
        },
      });

      dbFlights.push(flight);
      flightCounter++;
    }
  }

  console.log(`🎫 Successfully generated ${flightCounter} premium scheduled flights.`);

  // 7. Seed several mock completed/confirmed bookings to drive statistics and graphs out-of-the-box!
  const firstFlight = dbFlights[0] || dbFeaturedFlights[0];

  if (firstFlight) {
    const bookingDates = [
      new Date(today.getTime() - 24 * 60 * 60 * 1000 * 4), // 4 days ago
      new Date(today.getTime() - 24 * 60 * 60 * 1000 * 3), // 3 days ago
      new Date(today.getTime() - 24 * 60 * 60 * 1000 * 2), // 2 days ago
      new Date(today.getTime() - 24 * 60 * 60 * 1000 * 1), // yesterday
      today, // today
    ];

    for (let k = 0; k < bookingDates.length; k++) {
      const bDate = bookingDates[k];
      const code = firstFlight.airlineCode;
      const passenger = dbCustomers[k % dbCustomers.length];

      await prisma.booking.create({
        data: {
          bookingNo: `${code}-${Math.floor(100000 + Math.random() * 900000)}`,
          flightId: firstFlight.id,
          userId: passenger.id,
          passengerName: passenger.name,
          passengerEmail: passenger.email,
          passportNumber: passenger.passportNumber || 'US-000000',
          seatId: `B${k + 1}`,
          seatClass: 'FIRST',
          totalPrice: firstFlight.price,
          status: 'CONFIRMED',
          createdAt: bDate,
        },
      });
    }
    console.log('📈 Preloaded historic booking trends into statistics database.');
  }

  console.log('🎉 Seeding sequence complete! Your enterprise platform is ready to soar.');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
