import xml.etree.ElementTree as ET

# ViewBox: 0 0 120 110
# Center around (60, 55)
svg = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 110" fill="none" width="100%" height="100%">
  <!-- Left Arm: Solid Slanted Bar with Flat Horizontal Top -->
  <path
    d="M 16 35 H 35 L 58 78 H 39 Z"
    fill="#FFFFFF"
  />

  <!-- Right Arm: Back Ticket Outline (offset to top-right) -->
  <g transform="translate(68, 11) rotate(35)">
    <path
      d="M 8 0 H 21 C 24 0, 26 2, 26 5 V 38"
      stroke="#FFFFFF"
      stroke-width="3.8"
      stroke-linecap="round"
      stroke-linejoin="round"
      fill="none"
    />
  </g>

  <!-- Right Arm: Front Ticket Body (tilted rounded coupon) -->
  <g transform="translate(62, 15) rotate(35)">
    <rect
      x="0"
      y="0"
      width="26"
      height="54"
      rx="4.5"
      stroke="#FFFFFF"
      stroke-width="3.8"
      fill="#000000"
    />
    <!-- Ticket tear-off stub line -->
    <line
      x1="0"
      y1="14"
      x2="26"
      y2="14"
      stroke="#FFFFFF"
      stroke-width="3.4"
      stroke-linecap="round"
    />
  </g>

  <!-- Nest Bowl: Main Curved Twig Bands -->
  <!-- Top Outer Rim / Lip -->
  <path
    d="M 12 55 C 8 88, 62 102, 112 55"
    stroke="#FFFFFF"
    stroke-width="4.2"
    stroke-linecap="round"
    fill="none"
  />
  <!-- Second Band -->
  <path
    d="M 17 64 C 20 91, 88 95, 108 65"
    stroke="#FFFFFF"
    stroke-width="3.6"
    stroke-linecap="round"
    fill="none"
  />
  <!-- Third Band -->
  <path
    d="M 23 74 C 33 95, 86 96, 101 76"
    stroke="#FFFFFF"
    stroke-width="3.0"
    stroke-linecap="round"
    fill="none"
  />
  <!-- Bottom Base Band -->
  <path
    d="M 30 83 C 46 99, 80 99, 94 85"
    stroke="#FFFFFF"
    stroke-width="2.6"
    stroke-linecap="round"
    fill="none"
  />

  <!-- Twig Ends & Interwoven Crossings -->
  <path d="M 24 76 L 62 95" stroke="#FFFFFF" stroke-width="2.4" stroke-linecap="round" />
  <path d="M 34 85 L 72 97" stroke="#FFFFFF" stroke-width="2.4" stroke-linecap="round" />
  <path d="M 58 95 L 96 79" stroke="#FFFFFF" stroke-width="2.4" stroke-linecap="round" />
  <path d="M 68 96 L 104 74" stroke="#FFFFFF" stroke-width="2.4" stroke-linecap="round" />
  <path d="M 44 98 L 86 98" stroke="#FFFFFF" stroke-width="2.4" stroke-linecap="round" />
</svg>'''

ET.fromstring(svg)
print("Valid SVG mark!")
with open('/tmp/vouch_nest_mark.svg', 'w') as f:
    f.write(svg)
