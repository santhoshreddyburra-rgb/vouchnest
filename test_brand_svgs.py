import xml.etree.ElementTree as ET

svgs = [
    # Nike Swoosh
    '''<svg viewBox="0 0 60 30" fill="currentColor"><path d="M 5 19 C 14 14, 32 6, 55 2 C 41 11, 26 21, 14 28 C 9 31, 5 28, 3 24 C 2 21, 3 20, 5 19 Z" /></svg>''',
    # Apple
    '''<svg viewBox="0 0 30 36" fill="currentColor"><path d="M 18 2 C 20 6, 17 10, 14 11 C 13 8, 15 4, 18 2 Z M 15 12 C 12 12, 9 14, 7 14 C 4 14, 2 12, 0 16 C -2 24, 4 34, 8 34 C 11 34, 12 32, 15 32 C 18 32, 19 34, 22 34 C 26 34, 30 25, 30 25 C 25 22, 25 15, 30 13 C 27 10, 23 10, 20 12 C 18 12, 16 12, 15 12 Z" /></svg>''',
    # Amazon
    '''<svg viewBox="0 0 60 30" fill="none" stroke="currentColor"><path d="M 6 18 C 18 27, 42 27, 54 18" stroke-width="3" stroke-linecap="round" /><path d="M 48 18 L 54 18 L 53 12" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" /></svg>''',
    # Target Bullseye
    '''<svg viewBox="0 0 36 36" fill="none"><circle cx="18" cy="18" r="16" stroke="currentColor" stroke-width="4"/><circle cx="18" cy="18" r="6" fill="currentColor"/></svg>'''
]

for s in svgs:
    ET.fromstring(s)
print("All brand SVGs valid!")
