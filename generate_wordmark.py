# Let's define the paths for ouchNest with baseline y=80:
# Stroke thickness W = 13
# Baseline = 80
# x-height top = 39 (height = 41)
# cap-height top = 26 (height = 54)

# Let's inspect 't' in particular:
# 't' in file_00000000ca88820baddb521064c9c17d.png:
# - Stem x position: around x=440
# - Stem width: 12.5px (from x=434 to x=446.5)
# - Top of stem: y=31 (flat horizontal cut)
# - Crossbar: from x=425 to x=457 at y=39 to y=50
# - Stem goes down to y=68, then curves right:
#   bottom curve outer: C 446.5 76, 452 80, 461 80
#   bottom curve terminal: at x=463, y=70 or y=67
# - Inner curve: curves smoothly at bottom right
# Let's build full SVG and inspect it!
