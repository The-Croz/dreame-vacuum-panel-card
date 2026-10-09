"""Draws a made-up floor plan for the README screenshots and writes the room geometry.

Output: map.png, map-dark.png and map.json (calibration points and rooms in vacuum millimetres).
"""
import json
from PIL import Image, ImageDraw

W, H = 900, 680
MM = 50          # millimetres per pixel
OX, OY = 60, 640  # pixel position of vacuum (0, 0); vacuum y grows upwards

def to_mm(px, py):
    return (px - OX) * MM, (OY - py) * MM

BLUE, YELLOW, GREEN, TEAL, NAVY = '#5b86c5', '#c9a94a', '#76a35f', '#5aa9b8', '#3f62a8'
# name, (x0, y0, x1, y1) in pixels, colour
ROOMS = [
    ('Living Room', (300, 300, 560, 540), YELLOW),
    ('Kitchen', (560, 300, 770, 440), GREEN),
    ('Dining Room', (560, 440, 770, 600), NAVY),
    ('Hallway', (300, 235, 770, 300), BLUE),
    ('Entryway', (220, 235, 300, 400), TEAL),
    ('Bedroom', (90, 400, 300, 600), BLUE),
    ('Bathroom', (90, 260, 220, 400), NAVY),
    ('Closet', (40, 470, 90, 600), YELLOW),
    ('Bedroom 2', (600, 70, 790, 235), GREEN),
    ('Bedroom 3', (400, 90, 600, 235), YELLOW),
    ('Bathroom 2', (300, 130, 400, 235), TEAL),
]

def draw(bg, out):
  img = Image.new('RGB', (W, H), bg)
  d = ImageDraw.Draw(img)
  for _, (x0, y0, x1, y1), c in ROOMS:
      d.rectangle((x0, y0, x1, y1), fill=c)
  # light texture so the floor doesn't read as flat blocks
  for _, (x0, y0, x1, y1), c in ROOMS:
      for y in range(y0 + 4, y1, 6):
          d.line((x0 + 2, y, x1 - 2, y), fill=tuple(min(255, int(v * 1.06)) for v in img.getpixel((x0 + 2, y0 + 2))), width=1)
  # walls
  for _, (x0, y0, x1, y1), _c in ROOMS:
      d.rectangle((x0, y0, x1, y1), outline='#2f3237', width=3)
  # doorways
  for (x, y, w, h) in [(300, 330, 3, 40), (300, 440, 3, 40), (560, 330, 3, 50), (560, 480, 3, 50), (340, 300, 60, 3), (640, 300, 60, 3),
                       (220, 300, 3, 50), (150, 400, 50, 3), (90, 520, 3, 40), (680, 235, 50, 3), (480, 235, 50, 3), (330, 235, 40, 3), (240, 235, 40, 3)]:
      d.rectangle((x - 1, y - 1, x + w + 1, y + h + 1), fill=img.getpixel((x + w // 2 + (4 if h > w else 0), y + h // 2 + (4 if w > h else 0))))
  # furniture
  for box in [(330, 450, 430, 520), (600, 470, 720, 560), (120, 430, 230, 520), (630, 100, 740, 170), (430, 110, 520, 170)]:
      d.rectangle(box, fill='#d9dadc', outline='#9a9da3', width=2)
  # dock and robot
  d.rounded_rectangle((740, 560, 766, 586), 4, fill='#ffffff', outline='#2f3237', width=2)
  d.ellipse((704, 380, 728, 404), fill='#ffffff', outline='#43a047', width=4)
  img.save(out)

draw('#e6e7e9', 'map.png')
draw('#1f2023', 'map-dark.png')

def corner(px, py):
    x, y = to_mm(px, py)
    return {'x': x, 'y': y}

rooms = {}
for i, (name, (x0, y0, x1, y1), _c) in enumerate(ROOMS, start=1):
    a, b = to_mm(x0, y1), to_mm(x1, y0)
    cx, cy = to_mm((x0 + x1) / 2, (y0 + y1) / 2)
    rooms[str(i)] = {'room_id': i, 'name': name, 'x': cx, 'y': cy, 'x0': a[0], 'y0': a[1], 'x1': b[0], 'y1': b[1]}
cal = [{'vacuum': {'x': 0, 'y': 0}, 'map': {'x': OX, 'y': OY}},
       {'vacuum': {'x': 10000, 'y': 0}, 'map': {'x': OX + 10000 / MM, 'y': OY}},
       {'vacuum': {'x': 0, 'y': 10000}, 'map': {'x': OX, 'y': OY - 10000 / MM}}]
json.dump({'calibration_points': cal, 'rooms': rooms}, open('map.json', 'w'), indent=1)
