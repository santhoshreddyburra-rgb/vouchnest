# Detailed SVG generator for VouchNestMark matching Screenshot 2026-09-17 192351.png
# ViewBox: 0 0 114 114 (Square, matching Screenshot 2026-09-17 192351.png)

mark_svg = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 114 114" fill="none" width="100%" height="100%">
  <!-- Left Arm: Solid Slanted Bar with Horizontal Flat Top -->
  <path
    d="M 16 35 H 37 L 62 80 H 41 Z"
    fill="currentColor"
  />

  <!-- Right Arm: Back Ticket (Secondary Layer peeking behind on top right) -->
  <g transform="translate(68, 11) rotate(34)">
    <path
      d="M 8 0 H 22 C 25.5 0, 28 2.5, 28 5.5 V 42"
      stroke="currentColor"
      stroke-width="4.2"
      stroke-linecap="round"
      stroke-linejoin="round"
      fill="none"
    />
  </g>

  <!-- Right Arm: Front Ticket Body (Tilted rounded voucher) -->
  <g transform="translate(60, 15) rotate(34)">
    <rect
      x="0"
      y="0"
      width="28"
      height="58"
      rx="5"
      stroke="currentColor"
      stroke-width="4.2"
      fill="#000000"
    />
    <!-- Stub tear-off line across upper ticket -->
    <line
      x1="0"
      y1="15"
      x2="28"
      y2="15"
      stroke="currentColor"
      stroke-width="3.8"
      stroke-linecap="round"
    />
  </g>

  <!-- Interwoven Nest Cradle Twigs -->
  <!-- Top Rim / Upper Lip: sweeping curve holding the V -->
  <path
    d="M 15 56 C 11 90, 64 104, 110 55"
    stroke="currentColor"
    stroke-width="4.5"
    stroke-linecap="round"
    fill="none"
  />
  <!-- Second Curved Band -->
  <path
    d="M 20 66 C 24 93, 88 97, 106 66"
    stroke="currentColor"
    stroke-width="3.8"
    stroke-linecap="round"
    fill="none"
  />
  <!-- Third Curved Band -->
  <path
    d="M 26 76 C 36 97, 85 99, 99 78"
    stroke="currentColor"
    stroke-width="3.2"
    stroke-linecap="round"
    fill="none"
  />
  <!-- Bottom Base Band -->
  <path
    d="M 33 85 C 49 101, 80 102, 92 88"
    stroke="currentColor"
    stroke-width="2.8"
    stroke-linecap="round"
    fill="none"
  />

  <!-- Authentic Interwoven Crossing Twigs -->
  <!-- Lower-left protruding twig end -->
  <path d="M 24 76 L 16 80" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" />
  <!-- Diagonal weave strokes -->
  <path d="M 28 78 L 64 97" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" />
  <path d="M 37 87 L 74 99" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" />
  <path d="M 58 97 L 95 80" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" />
  <path d="M 68 98 L 102 75" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" />
  <path d="M 46 101 L 86 101" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" />
</svg>'''

import xml.etree.ElementTree as ET
ET.fromstring(mark_svg.replace('currentColor', '#FFFFFF'))
print("SVG mark parsed successfully!")
with open('/tmp/mark_generated.svg', 'w') as f:
    f.write(mark_svg.replace('currentColor', '#FFFFFF'))
