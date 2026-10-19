import xml.etree.ElementTree as ET

svg_str = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 470 110" fill="none" width="100%" height="100%">
  <!-- Left arm of V: Solid white slanted bar with horizontal top -->
  <path
    d="M 20 34 H 42 L 68 76 H 46 Z"
    fill="#FFFFFF"
  />

  <!-- Right arm of V: Layered voucher ticket booklet -->
  <!-- Back ticket layer -->
  <path
    d="M 104 28 L 114 36 C 117 38, 118 41, 116 44 L 102 72"
    stroke="#FFFFFF"
    stroke-width="4"
    stroke-linecap="round"
    stroke-linejoin="round"
    fill="none"
  />

  <!-- Front ticket body -->
  <rect
    x="60"
    y="14"
    width="26"
    height="55"
    rx="5"
    transform="rotate(31 60 14)"
    stroke="#FFFFFF"
    stroke-width="4.2"
    fill="#000000"
  />
  <!-- Ticket stub divider line -->
  <line
    x1="94"
    y1="31"
    x2="107"
    y2="39"
    stroke="#FFFFFF"
    stroke-width="3.8"
    stroke-linecap="round"
  />

  <!-- Bird Nest Cradle: Curved interwoven white twigs -->
  <path
    d="M 18 56 C 14 88, 64 102, 122 56"
    stroke="#FFFFFF"
    stroke-width="4.5"
    stroke-linecap="round"
    fill="none"
  />
  <path
    d="M 22 66 C 26 94, 94 98, 120 66"
    stroke="#FFFFFF"
    stroke-width="3.8"
    stroke-linecap="round"
    fill="none"
  />
  <path
    d="M 28 76 C 40 98, 92 100, 112 78"
    stroke="#FFFFFF"
    stroke-width="3.2"
    stroke-linecap="round"
    fill="none"
  />
  <path
    d="M 36 86 C 52 102, 86 103, 102 88"
    stroke="#FFFFFF"
    stroke-width="2.8"
    stroke-linecap="round"
    fill="none"
  />

  <!-- Crossing twig strokes -->
  <path d="M 30 78 L 68 96" stroke="#FFFFFF" stroke-width="2.6" stroke-linecap="round" />
  <path d="M 38 88 L 78 98" stroke="#FFFFFF" stroke-width="2.6" stroke-linecap="round" />
  <path d="M 60 97 L 104 80" stroke="#FFFFFF" stroke-width="2.6" stroke-linecap="round" />
  <path d="M 74 98 L 114 74" stroke="#FFFFFF" stroke-width="2.6" stroke-linecap="round" />
  <path d="M 48 100 L 96 100" stroke="#FFFFFF" stroke-width="2.6" stroke-linecap="round" />

  <!-- Wordmark: "ouch" in White, "Nest" in Vibrant Red -->
  <text
    x="126"
    y="78"
    font-family="'Montserrat', 'Plus Jakarta Sans', system-ui, sans-serif"
    font-size="70"
    font-weight="900"
    letter-spacing="-1.5"
  >
    <tspan fill="#FFFFFF">ouch</tspan>
    <tspan fill="#EE1C25">Nest</tspan>
  </text>
</svg>"""

root = ET.fromstring(svg_str)
print("SVG XML parsed successfully! Tags count:", len(list(root)))
