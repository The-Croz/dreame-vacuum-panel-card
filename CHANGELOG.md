# Changelog

## 0.2.0

- **Phone layout fixes.** The bottom controls no longer run off screen, the banner no longer
  hides behind the top bar, and the toolbar no longer overlaps Home Assistant's header.
- **Full-screen mode** (`fullscreen`). In panel views the card pins itself to the visible
  screen, locks page scrolling and keeps its size steady while it redraws. It turns itself
  off while the dashboard is in edit mode, so the card's Edit button stays reachable.
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
