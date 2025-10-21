// Mock data for development (will be replaced with Supabase data)
export interface Component {
  id: string
  type: "body" | "ears" | "eyes" | "nose" | "mouth" | "accessories" | "background"
  name: string
  svg_data: string
}

export interface Design {
  id: string
  user_id: string
  title: string
  components: {
    body?: string
    ears?: string
    eyes?: string
    nose?: string
    mouth?: string
    accessories?: string
    background?: string
    bodyColor?: string
  }
  is_public: boolean
  created_at: string
  likes_count?: number
  comments_count?: number
  user_name?: string
}

export interface Like {
  id: string
  user_id: string
  design_id: string
  created_at: string
}

export interface Comment {
  id: string
  user_id: string
  design_id: string
  content: string
  created_at: string
  user_name?: string
}

export interface Follow {
  id: string
  follower_id: string
  following_id: string
  created_at: string
}

export interface User {
  id: string
  email: string
  name?: string
  followers_count?: number
  following_count?: number
  designs_count?: number
}

export const mockComponents: Component[] = [
  // Bodies
  // Dog Bodies
  {
    id: "1",
    type: "body",
    name: "Dog - Round",
    svg_data: '<ellipse cx="150" cy="180" rx="80" ry="90" fill="currentColor"/>',
  },
  {
    id: "2",
    type: "body",
    name: "Dog - Slim",
    svg_data: '<ellipse cx="150" cy="180" rx="60" ry="100" fill="currentColor"/>',
  },
  {
    id: "3",
    type: "body",
    name: "Dog - Chubby",
    svg_data: '<ellipse cx="150" cy="180" rx="95" ry="85" fill="currentColor"/>',
  },

  // Cat Bodies
  {
    id: "4",
    type: "body",
    name: "Cat - Sleek",
    svg_data: '<ellipse cx="150" cy="185" rx="65" ry="95" fill="currentColor"/>',
  },
  {
    id: "5",
    type: "body",
    name: "Cat - Fluffy",
    svg_data: '<ellipse cx="150" cy="180" rx="85" ry="88" fill="currentColor"/>',
  },

  // Rabbit Bodies
  {
    id: "6",
    type: "body",
    name: "Rabbit - Round",
    svg_data: '<circle cx="150" cy="190" r="75" fill="currentColor"/>',
  },
  {
    id: "7",
    type: "body",
    name: "Rabbit - Oval",
    svg_data: '<ellipse cx="150" cy="185" rx="70" ry="85" fill="currentColor"/>',
  },

  // Bear Bodies
  {
    id: "8",
    type: "body",
    name: "Bear - Big",
    svg_data: '<ellipse cx="150" cy="180" rx="100" ry="95" fill="currentColor"/>',
  },
  {
    id: "9",
    type: "body",
    name: "Bear - Cub",
    svg_data: '<ellipse cx="150" cy="185" rx="85" ry="90" fill="currentColor"/>',
  },

  // Fox Body
  {
    id: "10",
    type: "body",
    name: "Fox - Slim",
    svg_data: '<ellipse cx="150" cy="185" rx="65" ry="95" fill="currentColor"/>',
  },

  // Panda Body
  {
    id: "11",
    type: "body",
    name: "Panda - Round",
    svg_data: '<ellipse cx="150" cy="180" rx="90" ry="90" fill="currentColor"/>',
  },

  // Ears
  // Dog Ears
  {
    id: "20",
    type: "ears",
    name: "Dog - Pointy",
    svg_data:
      '<g><ellipse cx="100" cy="80" rx="25" ry="45" fill="currentColor" transform="rotate(-20 100 80)"/><ellipse cx="200" cy="80" rx="25" ry="45" fill="currentColor" transform="rotate(20 200 80)"/></g>',
  },
  {
    id: "21",
    type: "ears",
    name: "Dog - Floppy",
    svg_data:
      '<g><ellipse cx="90" cy="100" rx="30" ry="50" fill="currentColor" transform="rotate(-45 90 100)"/><ellipse cx="210" cy="100" rx="30" ry="50" fill="currentColor" transform="rotate(45 210 100)"/></g>',
  },
  {
    id: "22",
    type: "ears",
    name: "Dog - Round",
    svg_data:
      '<g><circle cx="100" cy="90" r="30" fill="currentColor"/><circle cx="200" cy="90" r="30" fill="currentColor"/></g>',
  },

  // Cat Ears
  {
    id: "23",
    type: "ears",
    name: "Cat - Pointed",
    svg_data:
      '<g><path d="M 95 110 L 85 60 L 105 95 Z" fill="currentColor"/><path d="M 205 110 L 215 60 L 195 95 Z" fill="currentColor"/></g>',
  },
  {
    id: "24",
    type: "ears",
    name: "Cat - Wide",
    svg_data:
      '<g><path d="M 90 105 L 70 65 L 110 90 Z" fill="currentColor"/><path d="M 210 105 L 230 65 L 190 90 Z" fill="currentColor"/></g>',
  },

  // Rabbit Ears
  {
    id: "25",
    type: "ears",
    name: "Rabbit - Long",
    svg_data:
      '<g><ellipse cx="110" cy="50" rx="18" ry="60" fill="currentColor" transform="rotate(-15 110 50)"/><ellipse cx="190" cy="50" rx="18" ry="60" fill="currentColor" transform="rotate(15 190 50)"/></g>',
  },
  {
    id: "26",
    type: "ears",
    name: "Rabbit - Floppy",
    svg_data:
      '<g><ellipse cx="100" cy="70" rx="20" ry="55" fill="currentColor" transform="rotate(-35 100 70)"/><ellipse cx="200" cy="70" rx="20" ry="55" fill="currentColor" transform="rotate(35 200 70)"/></g>',
  },

  // Bear Ears
  {
    id: "27",
    type: "ears",
    name: "Bear - Round",
    svg_data:
      '<g><circle cx="95" cy="85" r="28" fill="currentColor"/><circle cx="205" cy="85" r="28" fill="currentColor"/></g>',
  },
  {
    id: "28",
    type: "ears",
    name: "Bear - Small",
    svg_data:
      '<g><circle cx="100" cy="90" r="22" fill="currentColor"/><circle cx="200" cy="90" r="22" fill="currentColor"/></g>',
  },

  // Fox Ears
  {
    id: "29",
    type: "ears",
    name: "Fox - Sharp",
    svg_data:
      '<g><path d="M 100 100 L 85 55 L 110 90 Z" fill="currentColor"/><path d="M 200 100 L 215 55 L 190 90 Z" fill="currentColor"/></g>',
  },

  // Panda Ears
  {
    id: "30",
    type: "ears",
    name: "Panda - Round",
    svg_data:
      '<g><circle cx="95" cy="90" r="26" fill="currentColor"/><circle cx="205" cy="90" r="26" fill="currentColor"/></g>',
  },

  // Eyes
  {
    id: "40",
    type: "eyes",
    name: "Big Round",
    svg_data:
      '<g><circle cx="120" cy="150" r="18" fill="white"/><circle cx="120" cy="150" r="10" fill="black"/><circle cx="180" cy="150" r="18" fill="white"/><circle cx="180" cy="150" r="10" fill="black"/></g>',
  },
  {
    id: "41",
    type: "eyes",
    name: "Happy Smile",
    svg_data:
      '<g><path d="M 110 150 Q 120 145 130 150" stroke="black" strokeWidth="3" fill="none"/><path d="M 170 150 Q 180 145 190 150" stroke="black" strokeWidth="3" fill="none"/></g>',
  },
  {
    id: "42",
    type: "eyes",
    name: "Sleepy",
    svg_data:
      '<g><line x1="110" y1="150" x2="130" y2="150" stroke="black" strokeWidth="3"/><line x1="170" y1="150" x2="190" y2="150" stroke="black" strokeWidth="3"/></g>',
  },
  {
    id: "43",
    type: "eyes",
    name: "Cute Sparkle",
    svg_data:
      '<g><circle cx="120" cy="150" r="16" fill="white"/><circle cx="120" cy="150" r="9" fill="black"/><circle cx="125" cy="147" r="3" fill="white"/><circle cx="180" cy="150" r="16" fill="white"/><circle cx="180" cy="150" r="9" fill="black"/><circle cx="185" cy="147" r="3" fill="white"/></g>',
  },
  {
    id: "44",
    type: "eyes",
    name: "Oval Eyes",
    svg_data:
      '<g><ellipse cx="120" cy="150" rx="12" ry="16" fill="white"/><ellipse cx="120" cy="152" rx="7" ry="10" fill="black"/><ellipse cx="180" cy="150" rx="12" ry="16" fill="white"/><ellipse cx="180" cy="152" rx="7" ry="10" fill="black"/></g>',
  },
  {
    id: "45",
    type: "eyes",
    name: "Wink",
    svg_data:
      '<g><circle cx="120" cy="150" r="18" fill="white"/><circle cx="120" cy="150" r="10" fill="black"/><line x1="170" y1="150" x2="190" y2="150" stroke="black" strokeWidth="3"/></g>',
  },
  {
    id: "46",
    type: "eyes",
    name: "Surprised",
    svg_data:
      '<g><circle cx="120" cy="150" r="20" fill="white"/><circle cx="120" cy="150" r="12" fill="black"/><circle cx="180" cy="150" r="20" fill="white"/><circle cx="180" cy="150" r="12" fill="black"/></g>',
  },
  {
    id: "47",
    type: "eyes",
    name: "Squint",
    svg_data:
      '<g><path d="M 110 148 Q 120 153 130 148" stroke="black" strokeWidth="3" fill="none"/><path d="M 170 148 Q 180 153 190 148" stroke="black" strokeWidth="3" fill="none"/></g>',
  },

  // Noses
  {
    id: "60",
    type: "nose",
    name: "Triangle",
    svg_data: '<polygon points="150,170 140,185 160,185" fill="black"/>',
  },
  {
    id: "61",
    type: "nose",
    name: "Round",
    svg_data: '<ellipse cx="150" cy="180" rx="8" ry="10" fill="black"/>',
  },
  {
    id: "62",
    type: "nose",
    name: "Heart",
    svg_data:
      '<path d="M 150 175 C 145 170 140 170 140 175 C 140 180 150 185 150 185 C 150 185 160 180 160 175 C 160 170 155 170 150 175" fill="black"/>',
  },
  {
    id: "63",
    type: "nose",
    name: "Button",
    svg_data: '<circle cx="150" cy="178" r="7" fill="black"/>',
  },
  {
    id: "64",
    type: "nose",
    name: "Cat Nose",
    svg_data: '<path d="M 150 175 L 145 182 L 155 182 Z" fill="#ff6b9d"/>',
  },
  {
    id: "65",
    type: "nose",
    name: "Bear Nose",
    svg_data: '<ellipse cx="150" cy="180" rx="12" ry="10" fill="black"/>',
  },

  // Mouths
  {
    id: "80",
    type: "mouth",
    name: "Happy Smile",
    svg_data: '<path d="M 130 195 Q 150 205 170 195" stroke="black" strokeWidth="2" fill="none"/>',
  },
  {
    id: "81",
    type: "mouth",
    name: "Tongue Out",
    svg_data:
      '<g><path d="M 130 195 Q 150 205 170 195" stroke="black" strokeWidth="2" fill="none"/><ellipse cx="150" cy="210" rx="12" ry="18" fill="#ff6b9d"/></g>',
  },
  {
    id: "82",
    type: "mouth",
    name: "Neutral",
    svg_data: '<line x1="135" y1="200" x2="165" y2="200" stroke="black" strokeWidth="2"/>',
  },
  {
    id: "83",
    type: "mouth",
    name: "Big Smile",
    svg_data: '<path d="M 125 195 Q 150 210 175 195" stroke="black" strokeWidth="2.5" fill="none"/>',
  },
  {
    id: "84",
    type: "mouth",
    name: "Cute Smile",
    svg_data: '<path d="M 135 198 Q 150 203 165 198" stroke="black" strokeWidth="2" fill="none"/>',
  },
  {
    id: "85",
    type: "mouth",
    name: "Open Mouth",
    svg_data: '<ellipse cx="150" cy="205" rx="15" ry="12" fill="black"/>',
  },
  {
    id: "86",
    type: "mouth",
    name: "Fangs",
    svg_data:
      '<g><path d="M 130 195 Q 150 205 170 195" stroke="black" strokeWidth="2" fill="none"/><rect x="138" y="195" width="4" height="8" fill="white"/><rect x="158" y="195" width="4" height="8" fill="white"/></g>',
  },

  // Accessories
  {
    id: "100",
    type: "accessories",
    name: "Bow Tie",
    svg_data:
      '<g><path d="M 130 240 L 140 245 L 130 250 Z" fill="currentColor"/><path d="M 170 240 L 160 245 L 170 250 Z" fill="currentColor"/><rect x="145" y="242" width="10" height="6" fill="currentColor"/></g>',
  },
  {
    id: "101",
    type: "accessories",
    name: "Collar",
    svg_data: '<ellipse cx="150" cy="250" rx="70" ry="12" fill="none" stroke="currentColor" strokeWidth="4"/>',
  },
  {
    id: "102",
    type: "accessories",
    name: "Top Hat",
    svg_data:
      '<g><rect x="120" y="50" width="60" height="8" fill="currentColor"/><rect x="130" y="30" width="40" height="20" fill="currentColor"/></g>',
  },
  {
    id: "103",
    type: "accessories",
    name: "Crown",
    svg_data:
      '<g><path d="M 110 70 L 120 50 L 130 65 L 150 45 L 170 65 L 180 50 L 190 70 Z" fill="currentColor"/><rect x="110" y="70" width="80" height="8" fill="currentColor"/></g>',
  },
  {
    id: "104",
    type: "accessories",
    name: "Bandana",
    svg_data: '<g><path d="M 100 240 Q 150 255 200 240 L 190 250 Q 150 265 110 250 Z" fill="currentColor"/></g>',
  },
  {
    id: "105",
    type: "accessories",
    name: "Glasses",
    svg_data:
      '<g><circle cx="120" cy="150" r="20" fill="none" stroke="currentColor" strokeWidth="2"/><circle cx="180" cy="150" r="20" fill="none" stroke="currentColor" strokeWidth="2"/><line x1="140" y1="150" x2="160" y2="150" stroke="currentColor" strokeWidth="2"/></g>',
  },
  {
    id: "106",
    type: "accessories",
    name: "Scarf",
    svg_data:
      '<g><path d="M 100 230 Q 150 240 200 230 Q 205 245 200 250 L 180 245 Q 150 255 120 245 L 100 250 Q 95 245 100 230" fill="currentColor"/></g>',
  },
  {
    id: "107",
    type: "accessories",
    name: "Flower",
    svg_data:
      '<g><circle cx="90" cy="100" r="8" fill="currentColor"/><circle cx="85" cy="110" r="8" fill="currentColor"/><circle cx="95" cy="110" r="8" fill="currentColor"/><circle cx="80" cy="100" r="8" fill="currentColor"/><circle cx="100" cy="100" r="8" fill="currentColor"/><circle cx="90" cy="105" r="5" fill="#fbbf24"/></g>',
  },
  {
    id: "108",
    type: "accessories",
    name: "Butterfly",
    svg_data:
      '<g><ellipse cx="85" cy="95" rx="12" ry="18" fill="currentColor" transform="rotate(-20 85 95)"/><ellipse cx="95" cy="95" rx="12" ry="18" fill="currentColor" transform="rotate(20 95 95)"/><ellipse cx="85" cy="110" rx="10" ry="15" fill="currentColor" transform="rotate(-20 85 110)"/><ellipse cx="95" cy="110" rx="10" ry="15" fill="currentColor" transform="rotate(20 95 110)"/><line x1="90" y1="90" x2="90" y2="115" stroke="black" strokeWidth="2"/></g>',
  },
  {
    id: "109",
    type: "accessories",
    name: "None",
    svg_data: "",
  },

  // Backgrounds
  {
    id: "120",
    type: "background",
    name: "None",
    svg_data: "",
  },
  {
    id: "121",
    type: "background",
    name: "Circles",
    svg_data:
      '<g opacity="0.1"><circle cx="50" cy="50" r="30" fill="currentColor"/><circle cx="250" cy="80" r="40" fill="currentColor"/><circle cx="80" cy="270" r="35" fill="currentColor"/><circle cx="240" cy="250" r="25" fill="currentColor"/></g>',
  },
  {
    id: "122",
    type: "background",
    name: "Hearts",
    svg_data:
      '<g opacity="0.1"><path d="M 60 60 C 55 55 50 55 50 60 C 50 65 60 70 60 70 C 60 70 70 65 70 60 C 70 55 65 55 60 60" fill="currentColor"/><path d="M 230 90 C 225 85 220 85 220 90 C 220 95 230 100 230 100 C 230 100 240 95 240 90 C 240 85 235 85 230 90" fill="currentColor"/><path d="M 90 250 C 85 245 80 245 80 250 C 80 255 90 260 90 260 C 90 260 100 255 100 250 C 100 245 95 245 90 250" fill="currentColor"/></g>',
  },
  {
    id: "123",
    type: "background",
    name: "Stars",
    svg_data:
      '<g opacity="0.15"><path d="M 60 60 L 63 69 L 72 69 L 65 74 L 68 83 L 60 77 L 52 83 L 55 74 L 48 69 L 57 69 Z" fill="currentColor"/><path d="M 230 80 L 233 89 L 242 89 L 235 94 L 238 103 L 230 97 L 222 103 L 225 94 L 218 89 L 227 89 Z" fill="currentColor"/><path d="M 90 240 L 93 249 L 102 249 L 95 254 L 98 263 L 90 257 L 82 263 L 85 254 L 78 249 L 87 249 Z" fill="currentColor"/></g>',
  },
  {
    id: "124",
    type: "background",
    name: "Paw Prints",
    svg_data:
      '<g opacity="0.1"><g transform="translate(50, 60)"><ellipse cx="0" cy="0" rx="8" ry="10" fill="currentColor"/><circle cx="-8" cy="-12" r="5" fill="currentColor"/><circle cx="8" cy="-12" r="5" fill="currentColor"/><circle cx="-10" cy="-5" r="4" fill="currentColor"/><circle cx="10" cy="-5" r="4" fill="currentColor"/></g><g transform="translate(220, 100)"><ellipse cx="0" cy="0" rx="8" ry="10" fill="currentColor"/><circle cx="-8" cy="-12" r="5" fill="currentColor"/><circle cx="8" cy="-12" r="5" fill="currentColor"/><circle cx="-10" cy="-5" r="4" fill="currentColor"/><circle cx="10" cy="-5" r="4" fill="currentColor"/></g><g transform="translate(80, 250)"><ellipse cx="0" cy="0" rx="8" ry="10" fill="currentColor"/><circle cx="-8" cy="-12" r="5" fill="currentColor"/><circle cx="8" cy="-12" r="5" fill="currentColor"/><circle cx="-10" cy="-5" r="4" fill="currentColor"/><circle cx="10" cy="-5" r="4" fill="currentColor"/></g></g>',
  },
  {
    id: "125",
    type: "background",
    name: "Clouds",
    svg_data:
      '<g opacity="0.12"><ellipse cx="60" cy="70" rx="25" ry="15" fill="currentColor"/><ellipse cx="45" cy="75" rx="20" ry="12" fill="currentColor"/><ellipse cx="75" cy="75" rx="18" ry="12" fill="currentColor"/><ellipse cx="220" cy="90" rx="30" ry="18" fill="currentColor"/><ellipse cx="200" cy="95" rx="22" ry="14" fill="currentColor"/><ellipse cx="240" cy="95" rx="20" ry="14" fill="currentColor"/></g>',
  },
]

export const mockDesigns: Design[] = [
  {
    id: "d1",
    user_id: "user1",
    title: "Happy Puppy",
    components: {
      body: "1",
      ears: "20",
      eyes: "40",
      nose: "60",
      mouth: "80",
      accessories: "100",
      background: "121",
      bodyColor: "#fbbf24",
    },
    is_public: true,
    created_at: new Date().toISOString(),
    likes_count: 12,
    comments_count: 3,
    user_name: "PetLover123",
  },
  {
    id: "d2",
    user_id: "user1",
    title: "Sleepy Cat",
    components: {
      body: "4",
      ears: "23",
      eyes: "42",
      nose: "64",
      mouth: "82",
      accessories: "109",
      background: "122",
      bodyColor: "#ff6b9d",
    },
    is_public: true,
    created_at: new Date().toISOString(),
    likes_count: 8,
    comments_count: 2,
    user_name: "PetLover123",
  },
]

export const mockLikes: Like[] = [
  { id: "l1", user_id: "user1", design_id: "d1", created_at: new Date().toISOString() },
  { id: "l2", user_id: "user2", design_id: "d1", created_at: new Date().toISOString() },
]

export const mockComments: Comment[] = [
  {
    id: "c1",
    user_id: "user2",
    design_id: "d1",
    content: "So cute! I love the bow tie!",
    created_at: new Date().toISOString(),
    user_name: "CatFan456",
  },
  {
    id: "c2",
    user_id: "user3",
    design_id: "d1",
    content: "Amazing work! The colors are perfect.",
    created_at: new Date().toISOString(),
    user_name: "ArtLover789",
  },
]

export const mockFollows: Follow[] = [
  { id: "f1", follower_id: "user2", following_id: "user1", created_at: new Date().toISOString() },
  { id: "f2", follower_id: "user3", following_id: "user1", created_at: new Date().toISOString() },
]

// Mock user for development
export const mockUser: User = {
  id: "user1",
  email: "demo@petcraft.com",
  name: "PetLover123",
  followers_count: 2,
  following_count: 5,
  designs_count: 2,
}
