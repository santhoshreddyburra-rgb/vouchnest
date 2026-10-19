import xml.etree.ElementTree as ET

logos = {
    "amazon": '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 120" width="100%" height="100%">
      <text x="100" y="65" text-anchor="middle" font-family="'Plus Jakarta Sans', system-ui, -apple-system, sans-serif" font-weight="900" font-size="52" fill="#000000" letter-spacing="-1.5">amazon</text>
      <path d="M 46 80 C 80 102, 130 102, 154 82" fill="none" stroke="#FF9900" stroke-width="6.5" stroke-linecap="round"/>
      <path d="M 144 86 L 157 82 L 152 70" fill="none" stroke="#FF9900" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>''',

    "boat": '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 220 120" width="100%" height="100%">
      <text x="52" y="80" text-anchor="middle" font-family="'Plus Jakarta Sans', system-ui, sans-serif" font-weight="800" font-size="64" fill="#000000" letter-spacing="-2">bo</text>
      <path d="M 112 80 L 132 30 L 152 80 L 136 80 L 132 68 L 118 68 Z" fill="#D7131D"/>
      <path d="M 140 48 L 195 48 L 195 59 L 168 59 L 168 76 C 168 81, 172 82, 178 82 L 192 82 L 192 90 C 182 92, 158 92, 158 78 L 158 59 L 140 59 Z" fill="#000000"/>
    </svg>''',

    "flipkart": '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160" width="100%" height="100%">
      <circle cx="80" cy="80" r="70" fill="#2874F0"/>
      <rect x="42" y="52" width="76" height="74" rx="10" fill="#FFE11B"/>
      <path d="M 64 52 C 64 42, 96 42, 96 52" fill="none" stroke="#FFFFFF" stroke-width="5" stroke-linecap="round"/>
      <path d="M 60 84 L 92 84 M 55 94 L 86 94 M 78 72 L 105 72 C 108 72, 110 75, 107 78 L 86 116 L 76 116 L 86 94" fill="#2874F0" stroke="#2874F0" stroke-width="2"/>
    </svg>''',

    "lenskart": '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 130" width="100%" height="100%">
      <defs>
        <linearGradient id="lensGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#00A859"/>
          <stop offset="50%" stop-color="#00A3E0"/>
          <stop offset="100%" stop-color="#B5D333"/>
        </linearGradient>
      </defs>
      <path d="M 40 45 C 40 28, 70 28, 86 42 C 100 28, 130 28, 148 42 C 160 52, 160 68, 146 76 C 130 85, 105 70, 93 54 C 80 70, 55 85, 42 74 C 34 66, 34 52, 40 45 Z" fill="none" stroke="url(#lensGrad)" stroke-width="14" stroke-linecap="round" stroke-linejoin="round"/>
      <text x="100" y="112" text-anchor="middle" font-family="'Plus Jakarta Sans', system-ui, sans-serif" font-weight="800" font-size="34" fill="#1F2937" letter-spacing="-0.5">lenskart</text>
    </svg>''',

    "myntra": '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 140" width="100%" height="100%">
      <g transform="translate(45, 12)">
        <path d="M 12 70 C 4 55, 6 25, 26 12 C 42 2, 54 28, 54 48 C 54 28, 66 2, 82 12 C 102 25, 104 55, 96 70 Z" fill="#E91E63"/>
        <path d="M 32 60 C 26 44, 34 18, 54 18 C 74 18, 82 44, 76 60 Z" fill="#FF6F00"/>
        <path d="M 28 68 C 18 58, 20 32, 38 18 C 52 8, 60 30, 60 48 Z" fill="#E91E63" opacity="0.95"/>
      </g>
      <text x="100" y="124" text-anchor="middle" font-family="'Plus Jakarta Sans', system-ui, sans-serif" font-weight="800" font-size="36" fill="#1F2937" letter-spacing="-0.5">myntra</text>
    </svg>''',

    "nike": '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 120" width="100%" height="100%">
      <text x="96" y="60" text-anchor="middle" font-family="'Impact', 'Arial Black', sans-serif" font-style="italic" font-weight="900" font-size="58" fill="#000000" letter-spacing="1">NIKE</text>
      <path d="M 26 78 C 60 62, 118 42, 178 30 C 138 52, 94 76, 56 94 C 42 100, 30 96, 24 88 C 21 84, 22 80, 26 78 Z" fill="#000000"/>
    </svg>''',

    "noise": '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 140" width="100%" height="100%">
      <circle cx="100" cy="46" r="30" fill="none" stroke="#000000" stroke-width="7"/>
      <path d="M 88 56 C 88 38, 102 38, 102 52 C 102 66, 114 66, 114 42" fill="none" stroke="#000000" stroke-width="6.5" stroke-linecap="round"/>
      <text x="100" y="118" text-anchor="middle" font-family="'Plus Jakarta Sans', system-ui, sans-serif" font-weight="900" font-size="36" fill="#000000" letter-spacing="2">noise</text>
    </svg>''',

    "redtape": '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 220 120" width="100%" height="100%">
      <g fill="#D7131D">
        <path d="M 52 38 L 95 38 L 95 44 L 58 44 Z M 60 48 L 95 48 L 95 54 L 66 54 Z M 72 58 L 95 58 L 95 64 L 78 64 Z"/>
        <path d="M 168 38 L 125 38 L 125 44 L 162 44 Z M 160 48 L 125 48 L 125 54 L 154 54 Z M 148 58 L 125 58 L 125 64 L 142 64 Z"/>
        <path d="M 98 38 L 110 38 C 118 38, 122 42, 122 50 L 115 74 L 105 74 L 110 52 C 110 46, 107 45, 102 45 L 98 45 Z"/>
      </g>
      <text x="110" y="98" text-anchor="middle" font-family="'Plus Jakarta Sans', system-ui, sans-serif" font-weight="900" font-size="28" fill="#D7131D" letter-spacing="3">REDTAPE</text>
    </svg>'''
}

for name, s in logos.items():
    ET.fromstring(s)
    print(f"Valid SVG: {name}")
