-- Seed preset pet components
-- Body shapes
INSERT INTO components (type, name, svg_data) VALUES
('body', 'Round Body', '<ellipse cx="150" cy="180" rx="80" ry="90" fill="currentColor"/>'),
('body', 'Slim Body', '<ellipse cx="150" cy="180" rx="60" ry="100" fill="currentColor"/>'),
('body', 'Chubby Body', '<ellipse cx="150" cy="180" rx="95" ry="85" fill="currentColor"/>');

-- Ears
INSERT INTO components (type, name, svg_data) VALUES
('ears', 'Pointy Ears', '<g><ellipse cx="100" cy="80" rx="25" ry="45" fill="currentColor" transform="rotate(-20 100 80)"/><ellipse cx="200" cy="80" rx="25" ry="45" fill="currentColor" transform="rotate(20 200 80)"/></g>'),
('ears', 'Floppy Ears', '<g><ellipse cx="90" cy="100" rx="30" ry="50" fill="currentColor" transform="rotate(-45 90 100)"/><ellipse cx="210" cy="100" rx="30" ry="50" fill="currentColor" transform="rotate(45 210 100)"/></g>'),
('ears', 'Round Ears', '<g><circle cx="100" cy="90" r="30" fill="currentColor"/><circle cx="200" cy="90" r="30" fill="currentColor"/></g>');

-- Eyes
INSERT INTO components (type, name, svg_data) VALUES
('eyes', 'Big Eyes', '<g><circle cx="120" cy="150" r="18" fill="white"/><circle cx="120" cy="150" r="10" fill="black"/><circle cx="180" cy="150" r="18" fill="white"/><circle cx="180" cy="150" r="10" fill="black"/></g>'),
('eyes', 'Happy Eyes', '<g><path d="M 110 150 Q 120 145 130 150" stroke="black" stroke-width="3" fill="none"/><path d="M 170 150 Q 180 145 190 150" stroke="black" stroke-width="3" fill="none"/></g>'),
('eyes', 'Sleepy Eyes', '<g><line x1="110" y1="150" x2="130" y2="150" stroke="black" stroke-width="3"/><line x1="170" y1="150" x2="190" y2="150" stroke="black" stroke-width="3"/></g>');

-- Nose
INSERT INTO components (type, name, svg_data) VALUES
('nose', 'Triangle Nose', '<polygon points="150,170 140,185 160,185" fill="black"/>'),
('nose', 'Round Nose', '<ellipse cx="150" cy="180" rx="8" ry="10" fill="black"/>'),
('nose', 'Heart Nose', '<path d="M 150 175 C 145 170 140 170 140 175 C 140 180 150 185 150 185 C 150 185 160 180 160 175 C 160 170 155 170 150 175" fill="black"/>');

-- Mouth
INSERT INTO components (type, name, svg_data) VALUES
('mouth', 'Smile', '<path d="M 130 195 Q 150 205 170 195" stroke="black" stroke-width="2" fill="none"/>'),
('mouth', 'Tongue Out', '<g><path d="M 130 195 Q 150 205 170 195" stroke="black" stroke-width="2" fill="none"/><ellipse cx="150" cy="210" rx="12" ry="18" fill="#ff6b9d"/></g>'),
('mouth', 'Neutral', '<line x1="135" y1="200" x2="165" y2="200" stroke="black" stroke-width="2"/>');

-- Accessories
INSERT INTO components (type, name, svg_data) VALUES
('accessories', 'Bow Tie', '<g><path d="M 130 240 L 140 245 L 130 250 Z" fill="#ff6b9d"/><path d="M 170 240 L 160 245 L 170 250 Z" fill="#ff6b9d"/><rect x="145" y="242" width="10" height="6" fill="#ff6b9d"/></g>'),
('accessories', 'Collar', '<ellipse cx="150" cy="250" rx="70" ry="12" fill="none" stroke="#ff6b9d" stroke-width="4"/>'),
('accessories', 'Hat', '<g><rect x="120" y="50" width="60" height="8" fill="#4f46e5"/><rect x="130" y="30" width="40" height="20" fill="#4f46e5"/></g>');

-- Backgrounds
INSERT INTO components (type, name, svg_data) VALUES
('background', 'None', ''),
('background', 'Circles', '<g opacity="0.1"><circle cx="50" cy="50" r="30" fill="currentColor"/><circle cx="250" cy="80" r="40" fill="currentColor"/><circle cx="80" cy="270" r="35" fill="currentColor"/><circle cx="240" cy="250" r="25" fill="currentColor"/></g>'),
('background', 'Hearts', '<g opacity="0.1"><path d="M 60 60 C 55 55 50 55 50 60 C 50 65 60 70 60 70 C 60 70 70 65 70 60 C 70 55 65 55 60 60" fill="currentColor"/><path d="M 230 90 C 225 85 220 85 220 90 C 220 95 230 100 230 100 C 230 100 240 95 240 90 C 240 85 235 85 230 90" fill="currentColor"/><path d="M 90 250 C 85 245 80 245 80 250 C 80 255 90 260 90 260 C 90 260 100 255 100 250 C 100 245 95 245 90 250" fill="currentColor"/></g>');
