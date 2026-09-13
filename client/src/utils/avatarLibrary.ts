export type AvatarCategory =
  | 'ANIME BOYS'
  | 'ANIME GIRLS'
  | 'CARS'
  | 'BIKES'
  | 'ROBOTS'
  | 'GAMING'
  | 'FANTASY';

export interface AvatarOption {
  id: string;
  category: AvatarCategory;
  label: string;
  url: string;
}

export const AVATAR_LIBRARY: AvatarOption[] = [
  // =========================================================================
  // 1. ANIME BOYS (8 Options)
  // =========================================================================
  {
    id: 'ab-1',
    category: 'ANIME BOYS',
    label: 'Cyber Anime Male #1',
    url: '/avatars/anime-boys/ab-1.svg',
  },
  {
    id: 'ab-2',
    category: 'ANIME BOYS',
    label: 'Cyber Anime Male #2',
    url: '/avatars/anime-boys/ab-2.svg',
  },
  {
    id: 'ab-3',
    category: 'ANIME BOYS',
    label: 'Cyber Anime Male #3',
    url: '/avatars/anime-boys/ab-3.svg',
  },
  {
    id: 'ab-4',
    category: 'ANIME BOYS',
    label: 'Cyber Anime Male #4',
    url: '/avatars/anime-boys/ab-4.svg',
  },
  {
    id: 'ab-5',
    category: 'ANIME BOYS',
    label: 'Cyber Anime Male #5',
    url: '/avatars/anime-boys/ab-5.svg',
  },
  {
    id: 'ab-6',
    category: 'ANIME BOYS',
    label: 'Cyber Anime Male #6',
    url: '/avatars/anime-boys/ab-6.svg',
  },
  {
    id: 'ab-7',
    category: 'ANIME BOYS',
    label: 'Cyber Anime Male #7',
    url: '/avatars/anime-boys/ab-7.svg',
  },
  {
    id: 'ab-8',
    category: 'ANIME BOYS',
    label: 'Cyber Anime Male #8',
    url: '/avatars/anime-boys/ab-8.svg',
  },

  // =========================================================================
  // 2. ANIME GIRLS (8 Options)
  // =========================================================================
  {
    id: 'ag-1',
    category: 'ANIME GIRLS',
    label: 'Cyber Anime Female #1',
    url: '/avatars/anime-girls/ag-1.svg',
  },
  {
    id: 'ag-2',
    category: 'ANIME GIRLS',
    label: 'Cyber Anime Female #2',
    url: '/avatars/anime-girls/ag-2.svg',
  },
  {
    id: 'ag-3',
    category: 'ANIME GIRLS',
    label: 'Cyber Anime Female #3',
    url: '/avatars/anime-girls/ag-3.svg',
  },
  {
    id: 'ag-4',
    category: 'ANIME GIRLS',
    label: 'Cyber Anime Female #4',
    url: '/avatars/anime-girls/ag-4.svg',
  },
  {
    id: 'ag-5',
    category: 'ANIME GIRLS',
    label: 'Cyber Anime Female #5',
    url: '/avatars/anime-girls/ag-5.svg',
  },
  {
    id: 'ag-6',
    category: 'ANIME GIRLS',
    label: 'Cyber Anime Female #6',
    url: '/avatars/anime-girls/ag-6.svg',
  },
  {
    id: 'ag-7',
    category: 'ANIME GIRLS',
    label: 'Cyber Anime Female #7',
    url: '/avatars/anime-girls/ag-7.svg',
  },
  {
    id: 'ag-8',
    category: 'ANIME GIRLS',
    label: 'Cyber Anime Female #8',
    url: '/avatars/anime-girls/ag-8.svg',
  },

  // =========================================================================
  // 3. CARS (8 Options)
  // =========================================================================
  {
    id: 'car-1',
    category: 'CARS',
    label: 'Cyber GT Concept',
    url: '/avatars/cars/car-1.jpg',
  },
  {
    id: 'car-2',
    category: 'CARS',
    label: 'Porsche 911 GT3 RS',
    url: '/avatars/cars/car-2.jpg',
  },
  {
    id: 'car-3',
    category: 'CARS',
    label: 'Nissan GT-R Nismo JDM',
    url: '/avatars/cars/car-3.jpg',
  },
  {
    id: 'car-4',
    category: 'CARS',
    label: 'Corvette Stingray Z06',
    url: '/avatars/cars/car-4.jpg',
  },
  {
    id: 'car-5',
    category: 'CARS',
    label: 'Lamborghini Huracán STO',
    url: '/avatars/cars/car-5.jpg',
  },
  {
    id: 'car-6',
    category: 'CARS',
    label: 'Ferrari 488 Pista',
    url: '/avatars/cars/car-6.jpg',
  },
  {
    id: 'car-7',
    category: 'CARS',
    label: 'McLaren 720S Spider',
    url: '/avatars/cars/car-7.jpg',
  },
  {
    id: 'car-8',
    category: 'CARS',
    label: 'Audi R8 V10 Performance',
    url: '/avatars/cars/car-8.jpg',
  },

  // =========================================================================
  // 4. BIKES (8 Options)
  // =========================================================================
  {
    id: 'bike-1',
    category: 'BIKES',
    label: 'Ducati Panigale V4 R',
    url: '/avatars/bikes/bike-1.jpg',
  },
  {
    id: 'bike-2',
    category: 'BIKES',
    label: 'Yamaha YZF-R1M',
    url: '/avatars/bikes/bike-2.jpg',
  },
  {
    id: 'bike-3',
    category: 'BIKES',
    label: 'Kawasaki Ninja H2',
    url: '/avatars/bikes/bike-3.jpg',
  },
  {
    id: 'bike-4',
    category: 'BIKES',
    label: 'BMW S1000RR M-Package',
    url: '/avatars/bikes/bike-4.jpg',
  },
  {
    id: 'bike-5',
    category: 'BIKES',
    label: 'KTM 1290 Super Duke R',
    url: '/avatars/bikes/bike-5.jpg',
  },
  {
    id: 'bike-6',
    category: 'BIKES',
    label: 'Cyberpunk Neon Superbike',
    url: '/avatars/bikes/bike-6.jpg',
  },
  {
    id: 'bike-7',
    category: 'BIKES',
    label: 'MV Agusta F4 Claudio',
    url: '/avatars/bikes/bike-7.jpg',
  },
  {
    id: 'bike-8',
    category: 'BIKES',
    label: 'Aprilia RSV4 Factory',
    url: '/avatars/bikes/bike-8.jpg',
  },

  // =========================================================================
  // 5. ROBOTS & MECHA (8 Options)
  // =========================================================================
  {
    id: 'rob-1',
    category: 'ROBOTS',
    label: 'Neural Android 01',
    url: '/avatars/robots/rob-1.svg',
  },
  {
    id: 'rob-2',
    category: 'ROBOTS',
    label: 'Cyber Mecha Titan',
    url: '/avatars/robots/rob-2.svg',
  },
  {
    id: 'rob-3',
    category: 'ROBOTS',
    label: 'Neon Glitch Android',
    url: '/avatars/robots/rob-3.svg',
  },
  {
    id: 'rob-4',
    category: 'ROBOTS',
    label: 'Cyber Samurai Unit-09',
    url: '/avatars/robots/rob-4.svg',
  },
  {
    id: 'rob-5',
    category: 'ROBOTS',
    label: 'Quantum Core Android',
    url: '/avatars/robots/rob-5.svg',
  },
  {
    id: 'rob-6',
    category: 'ROBOTS',
    label: 'Sentinel Mech Drone',
    url: '/avatars/robots/rob-6.svg',
  },
  {
    id: 'rob-7',
    category: 'ROBOTS',
    label: 'Apex Cyber Android',
    url: '/avatars/robots/rob-7.svg',
  },
  {
    id: 'rob-8',
    category: 'ROBOTS',
    label: 'Matrix Nexus Core',
    url: '/avatars/robots/rob-8.svg',
  },

  // =========================================================================
  // 6. GAMING (8 Options)
  // =========================================================================
  {
    id: 'game-1',
    category: 'GAMING',
    label: 'Esports FPS Duelist',
    url: '/avatars/gaming/game-1.svg',
  },
  {
    id: 'game-2',
    category: 'GAMING',
    label: 'Apex Predator Gamer',
    url: '/avatars/gaming/game-2.svg',
  },
  {
    id: 'game-3',
    category: 'GAMING',
    label: 'Synthwave Warrior',
    url: '/avatars/gaming/game-3.svg',
  },
  {
    id: 'game-4',
    category: 'GAMING',
    label: 'Cyber Infiltrator',
    url: '/avatars/gaming/game-4.svg',
  },
  {
    id: 'game-5',
    category: 'GAMING',
    label: 'Overdrive Gamer',
    url: '/avatars/gaming/game-5.svg',
  },
  {
    id: 'game-6',
    category: 'GAMING',
    label: 'Chroma RGB Legend',
    url: '/avatars/gaming/game-6.svg',
  },
  {
    id: 'game-7',
    category: 'GAMING',
    label: 'Phantom Vanguard',
    url: '/avatars/gaming/game-7.svg',
  },
  {
    id: 'game-8',
    category: 'GAMING',
    label: 'Cyber Strike Leader',
    url: '/avatars/gaming/game-8.svg',
  },

  // =========================================================================
  // 7. FANTASY & SAMURAI (8 Options)
  // =========================================================================
  {
    id: 'fan-1',
    category: 'FANTASY',
    label: 'Shadow Ronin',
    url: '/avatars/fantasy/fan-1.svg',
  },
  {
    id: 'fan-2',
    category: 'FANTASY',
    label: 'Dragon Slayer',
    url: '/avatars/fantasy/fan-2.svg',
  },
  {
    id: 'fan-3',
    category: 'FANTASY',
    label: 'Mystic Astral Mage',
    url: '/avatars/fantasy/fan-3.svg',
  },
  {
    id: 'fan-4',
    category: 'FANTASY',
    label: 'Cyber Shinobi',
    url: '/avatars/fantasy/fan-4.svg',
  },
  {
    id: 'fan-5',
    category: 'FANTASY',
    label: 'Crimson Oni Warrior',
    url: '/avatars/fantasy/fan-5.svg',
  },
  {
    id: 'fan-6',
    category: 'FANTASY',
    label: 'Neon Blade Ronin',
    url: '/avatars/fantasy/fan-6.svg',
  },
  {
    id: 'fan-7',
    category: 'FANTASY',
    label: 'Valkyrie of Valhalla',
    url: '/avatars/fantasy/fan-7.svg',
  },
  {
    id: 'fan-8',
    category: 'FANTASY',
    label: 'Void Walker',
    url: '/avatars/fantasy/fan-8.svg',
  },
];
