# Changelog

## 0.2.3

- **Corners stay rounded under any theme.** 0.2.2 read Home Assistant's radius variables, and a
  theme that sets them to 0 made the whole card square. The card now uses its own 12 px radius
  (including the outer card) and ignores the theme's value.
- New `border_radius` option (px) to change it; panels, tiles, inputs and the phone sheet scale
  from that value.

## 0.2.2

- **Native rounded corners.** Radii now come from Home Assistant's own tokens
  (`--ha-card-border-radius`, `--ha-border-radius-*`), so panels, tiles, popovers, the phone
  sheet and zone boxes match the default look and follow your theme. Buttons, chips and
  pills are fully round like HA's own buttons.
- **Full-screen mode floats like a card.** It now sits inside a small gutter with rounded
  corners and a border instead of a square slab pinned to the screen edges.
- **Scrolling columns** are clipped at the card edge, so panels no longer end in a flat cut
  mid-gutter.

## 0.2.1

- **Edit mode.** Full-screen mode now steps aside while the dashboard is in edit mode, so
  the page scrolls and the card's Edit button is reachable again.

## 0.2.0

- **Phone layout fixes.** The bottom controls no longer run off screen, the banner no longer
  hides behind the top bar, and the toolbar no longer overlaps Home Assistant's header.
- **Full-screen mode** (`fullscreen`). In panel views the card pins itself to the visible
  screen, locks page scrolling and keeps its size steady while it redraws.
- **Kiosk mode buttons** (`show_back`, `show_menu`) in the phone, tablet and desktop layouts.
- **Suction** shown as Quiet, Standard, Turbo, Max. **Wetness** is a 1–32 slider that uses the
  robot's own bands.
- **Units.** Areas and zone sizes follow Home Assistant's unit system.
- **Care alerts.** Maintenance reminders live in the bell badge only; the banner is for faults
  and problems.
- **Mop washing** is detected from `vacuum_state`, with Pause, Resume and a clear Stop wash
  button.
- **Remote control** waits for each move step, sends an explicit stop, stops when the page is
  hidden, turns more gently and has a centered direction pad.
- **Spot cleaning** is sent as a small zone clean, because the robot aborts native spot cleans.
- **Optional dock toggles** `show_water_tank_draining` and `show_auto_water_refilling` for docks
  with the drain-and-refill kit.

## 0.1.0

- First release.
