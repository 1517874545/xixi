export interface Component {
  id: string
  name: string
  type: "body" | "ears" | "eyes" | "nose" | "mouth" | "accessories" | "background"
  svg_data: string
}

export interface Design {
  id: string
  title: string
  user_id: string
  user_name?: string
  components: {
    body: string
    ears: string
    eyes: string
    nose: string
    mouth: string
    accessories: string
    background: string
    bodyColor?: string
    earsColor?: string
    accessoriesColor?: string
  }
  is_public: boolean
  created_at: string
  likes_count: number
  comments_count: number
}

export interface Comment {
  id: string
  design_id: string
  user_id: string
  user_name: string
  content: string
  created_at: string
}

export const mockComponents: Component[] = [
  // Body components
  { id: "1", name: "Round Body", type: "body", svg_data: '<circle cx="150" cy="150" r="60" fill="currentColor"/>' },
  { id: "2", name: "Oval Body", type: "body", svg_data: '<ellipse cx="150" cy="150" rx="70" ry="50" fill="currentColor"/>' },
  { id: "3", name: "Square Body", type: "body", svg_data: '<rect x="90" y="90" width="120" height="120" rx="20" fill="currentColor"/>' },
  { id: "4", name: "Heart Body", type: "body", svg_data: '<path d="M150 100c20 0 40 20 40 50 0 30-40 50-40 50s-40-20-40-50c0-30 20-50 40-50z" fill="currentColor"/>' },

  // Ears components
  { id: "20", name: "Fluffy Ears", type: "ears", svg_data: '<path d="M120 80c-10-15-30-10-30 5 0 15 20 25 30 10z M180 80c10-15 30-10 30 5 0 15-20 25-30 10z" fill="currentColor"/>' },
  { id: "21", name: "Pointy Ears", type: "ears", svg_data: '<polygon points="120,80 100,120 140,100" fill="currentColor"/><polygon points="180,80 200,120 160,100" fill="currentColor"/>' },
  { id: "22", name: "Droopy Ears", type: "ears", svg_data: '<path d="M110 85c-5 0-10 15-5 25 5 10 15 10 20 5z M190 85c5 0 10 15 5 25-5 10-15 10-20 5z" fill="currentColor"/>' },

  // Eyes components
  { id: "40", name: "Round Eyes", type: "eyes", svg_data: '<circle cx="130" cy="140" r="8" fill="#000"/><circle cx="170" cy="140" r="8" fill="#000"/>' },
  { id: "41", name: "Almond Eyes", type: "eyes", svg_data: '<ellipse cx="130" cy="140" rx="10" ry="6" fill="#000"/><ellipse cx="170" cy="140" rx="10" ry="6" fill="#000"/>' },
  { id: "42", name: "Big Eyes", type: "eyes", svg_data: '<circle cx="130" cy="140" r="12" fill="#000"/><circle cx="170" cy="140" r="12" fill="#000"/><circle cx="128" cy="138" r="4" fill="#fff"/><circle cx="168" cy="138" r="4" fill="#fff"/>' },

  // Nose components
  { id: "60", name: "Round Nose", type: "nose", svg_data: '<circle cx="150" cy="160" r="6" fill="#000"/>' },
  { id: "61", name: "Triangle Nose", type: "nose", svg_data: '<polygon points="150,155 140,170 160,170" fill="#000"/>' },
  { id: "62", name: "Heart Nose", type: "nose", svg_data: '<path d="M150 160c2 0 4-2 4-4s-2-4-4-4-4 2-4 4 2 4 4 4z" fill="#000"/>' },

  // Mouth components
  { id: "80", name: "Smile", type: "mouth", svg_data: '<path d="M130 175 Q150 190 170 175" stroke="#000" stroke-width="3" fill="none"/>' },
  { id: "81", name: "Neutral", type: "mouth", svg_data: '<line x1="130" y1="175" x2="170" y2="175" stroke="#000" stroke-width="3"/>' },
  { id: "82", name: "Tongue", type: "mouth", svg_data: '<path d="M130 175 Q150 190 170 175" stroke="#000" stroke-width="3" fill="none"/><path d="M145 175 Q150 185 155 175" fill="#ff6b6b"/>' },

  // Accessories components
  { id: "109", name: "Bow Tie", type: "accessories", svg_data: '<path d="M140 180c-5-5-10 0-10 5 0 5 5 10 10 5z M160 180c5-5 10 0 10 5 0 5-5 10-10 5z M150 185l-5-10 10 0-5 10z" fill="currentColor"/>' },
  { id: "110", name: "Collar", type: "accessories", svg_data: '<circle cx="150" cy="180" r="25" fill="none" stroke="currentColor" stroke-width="3"/><circle cx="150" cy="180" r="3" fill="currentColor"/>' },
  { id: "111", name: "Hat", type: "accessories", svg_data: '<rect x="120" y="60" width="60" height="15" rx="5" fill="currentColor"/><ellipse cx="150" cy="75" rx="40" ry="10" fill="currentColor"/>' },

  // Background components
  { id: "120", name: "Simple BG", type: "background", svg_data: '<rect x="0" y="0" width="300" height="300" fill="#f0f0f0"/>' },
  { id: "121", name: "Gradient BG", type: "background", svg_data: '<rect x="0" y="0" width="300" height="300" fill="url(#gradient)"/><defs><linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#e0f2fe"/><stop offset="100%" stop-color="#f0f9ff"/></linearGradient></defs>' },
  { id: "122", name: "Pattern BG", type: "background", svg_data: '<rect x="0" y="0" width="300" height="300" fill="#f8fafc"/><circle cx="75" cy="75" r="20" fill="#e2e8f0" opacity="0.3"/><circle cx="225" cy="225" r="20" fill="#e2e8f0" opacity="0.3"/>' },
]

export const mockDesigns: Design[] = [
  {
    id: "design1",
    title: "Sunny the Cat",
    user_id: "user2",
    user_name: "CatLover123",
    components: {
      body: "1",
      ears: "20",
      eyes: "40",
      nose: "60",
      mouth: "80",
      accessories: "109",
      background: "120",
      bodyColor: "#fbbf24"
    },
    is_public: true,
    created_at: "2024-01-15T10:30:00Z",
    likes_count: 24,
    comments_count: 5
  },
  {
    id: "design2",
    title: "Blue Buddy",
    user_id: "user3",
    user_name: "DogPerson",
    components: {
      body: "2",
      ears: "21",
      eyes: "41",
      nose: "61",
      mouth: "81",
      accessories: "110",
      background: "121",
      bodyColor: "#3b82f6"
    },
    is_public: true,
    created_at: "2024-01-16T14:20:00Z",
    likes_count: 18,
    comments_count: 3
  },
  {
    id: "design3",
    title: "Pink Princess",
    user_id: "user4",
    user_name: "PetArtist",
    components: {
      body: "3",
      ears: "22",
      eyes: "42",
      nose: "62",
      mouth: "82",
      accessories: "111",
      background: "122",
      bodyColor: "#ec4899"
    },
    is_public: true,
    created_at: "2024-01-17T09:15:00Z",
    likes_count: 32,
    comments_count: 8
  }
]

export const mockComments: Comment[] = [
  {
    id: "comment1",
    design_id: "design1",
    user_id: "user3",
    user_name: "DogPerson",
    content: "Love the color combination!",
    created_at: "2024-01-15T11:00:00Z"
  },
  {
    id: "comment2",
    design_id: "design1",
    user_id: "user4",
    user_name: "PetArtist",
    content: "The fluffy ears are adorable!",
    created_at: "2024-01-15T12:30:00Z"
  },
  {
    id: "comment3",
    design_id: "design2",
    user_id: "user2",
    user_name: "CatLover123",
    content: "Great design! The blue color is perfect.",
    created_at: "2024-01-16T15:00:00Z"
  }
]