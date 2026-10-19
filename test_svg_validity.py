import xml.etree.ElementTree as ET

templates = [
    '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 120" fill="none">
     <text x="100" y="65" text-anchor="middle" font-family="'Plus Jakarta Sans', system-ui, sans-serif" font-weight="900" font-size="50" fill="#000000" letter-spacing="-1.5">amazon</text>
     <path d="M 44 80 C 80 104, 126 104, 156 82" stroke="#FF9900" stroke-width="6.5" stroke-linecap="round"/>
     <path d="M 144 86 L 157 82 L 153 69" stroke="#FF9900" stroke-width="5.5" stroke-linecap="round" stroke-linejoin="round"/>
   </svg>''',
    '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 220 120" fill="none">
     <text x="56" y="80" text-anchor="middle" font-family="'Plus Jakarta Sans', system-ui, sans-serif" font-weight="800" font-size="66" fill="#000000" letter-spacing="-2">bo</text>
     <path d="M 112 80 L 132 26 L 152 80 L 137 80 L 132 66 L 118 66 Z" fill="#E31E24"/>
     <path d="M 125 56 L 132 38 L 139 56 Z" fill="#FFFFFF"/>
     <path d="M 136 44 L 196 44 L 196 55 L 168 55 L 168 76 C 168 81, 172 82, 179 82 L 194 82 L 194 92 C 182 94, 157 94, 157 78 L 157 55 L 136 55 Z" fill="#000000"/>
   </svg>''',
    '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160" fill="none">
     <circle cx="80" cy="80" r="70" fill="#2874F0"/>
     <rect x="42" y="52" width="76" height="74" rx="8" fill="#FFE11B"/>
     <circle cx="64" cy="62" r="3.5" fill="#B39800"/>
     <circle cx="96" cy="62" r="3.5" fill="#B39800"/>
     <path d="M 64 54 C 64 42, 96 42, 96 54" stroke="#FFFFFF" stroke-width="5" stroke-linecap="round" fill="none"/>
     <path d="M 52 90 L 88 90" stroke="#2874F0" stroke-width="4" stroke-linecap="round"/>
     <path d="M 58 100 L 82 100" stroke="#2874F0" stroke-width="4" stroke-linecap="round"/>
     <path d="M 78 72 L 108 72 C 111 72, 112 76, 109 78 L 88 116 L 76 116 L 86 94" fill="#2874F0"/>
   </svg>''',
    '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 220 140" fill="none">
     <defs>
       <linearGradient id="lenskartGrad" x1="0%" y1="0%" x2="100%" y2="0%">
         <stop offset="0%" stop-color="#00A859"/>
         <stop offset="50%" stop-color="#00A3E0"/>
         <stop offset="100%" stop-color="#B5D333"/>
       </linearGradient>
     </defs>
     <path d="M 44 48 C 44 30, 75 30, 92 46 C 105 30, 140 30, 158 46 C 172 58, 172 74, 156 82 C 138 91, 112 74, 100 56 C 88 74, 60 91, 46 80 C 36 71, 36 56, 44 48 Z" fill="none" stroke="url(#lenskartGrad)" stroke-width="16" stroke-linecap="round" stroke-linejoin="round"/>
     <text x="110" y="122" text-anchor="middle" font-family="'Plus Jakarta Sans', system-ui, sans-serif" font-weight="800" font-size="34" fill="#2B3445" letter-spacing="-0.5">lenskart</text>
   </svg>''',
    '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 150" fill="none">
     <g transform="translate(42, 10)">
       <path d="M 14 74 C 4 58, 6 26, 26 12 C 44 0, 58 28, 58 50 C 58 28, 72 0, 90 12 C 110 26, 112 58, 102 74 Z" fill="#FF1274"/>
       <path d="M 34 64 C 28 46, 38 18, 58 18 C 78 18, 88 46, 82 64 Z" fill="#FF6E00"/>
       <path d="M 30 72 C 20 60, 22 34, 40 18 C 54 8, 64 32, 64 50 Z" fill="#FF1274" opacity="0.95"/>
     </g>
     <text x="100" y="130" text-anchor="middle" font-family="'Plus Jakarta Sans', system-ui, sans-serif" font-weight="800" font-size="36" fill="#282C3F" letter-spacing="-0.5">myntra</text>
   </svg>''',
    '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 130" fill="none">
     <text x="96" y="66" text-anchor="middle" font-family="'Impact', 'Arial Black', sans-serif" font-style="italic" font-weight="900" font-size="62" fill="#000000" letter-spacing="1">NIKE</text>
     <path d="M 22 84 C 58 66, 118 44, 180 32 C 140 54, 94 80, 54 98 C 40 104, 28 100, 22 92 C 19 88, 20 84, 22 84 Z" fill="#000000"/>
   </svg>''',
    '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 150" fill="none">
     <circle cx="100" cy="50" r="32" fill="none" stroke="#000000" stroke-width="7"/>
     <path d="M 87 61 C 87 40, 102 40, 102 54 C 102 68, 115 68, 115 42" fill="none" stroke="#000000" stroke-width="7" stroke-linecap="round"/>
     <text x="100" y="128" text-anchor="middle" font-family="'Plus Jakarta Sans', system-ui, sans-serif" font-weight="900" font-size="38" fill="#000000" letter-spacing="3">noise</text>
   </svg>''',
    '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 130" fill="none">
     <g fill="#E52329">
       <path d="M 52 38 L 98 38 L 98 44 L 58 44 Z M 60 48 L 98 48 L 98 54 L 66 54 Z M 72 58 L 98 58 L 98 64 L 78 64 Z"/>
       <path d="M 188 38 L 142 38 L 142 44 L 182 44 Z M 180 48 L 142 48 L 142 54 L 174 54 Z M 168 58 L 142 58 L 142 64 L 162 64 Z"/>
       <path d="M 102 38 L 118 38 C 128 38, 134 44, 134 52 L 126 76 L 114 76 L 120 54 C 120 47, 116 46, 110 46 L 102 46 Z"/>
       <path d="M 120 52 L 140 52 L 138 58 L 122 58 Z"/>
     </g>
     <text x="120" y="106" text-anchor="middle" font-family="'Plus Jakarta Sans', system-ui, sans-serif" font-weight="900" font-size="28" fill="#E52329" letter-spacing="4">REDTAPE</text>
   </svg>'''
]

for i, t in enumerate(templates):
    ET.fromstring(t)
    print(f"SVG #{i+1} parsed cleanly!")
