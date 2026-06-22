# AI Usage Tracker

Track your Claude and Codex usage with a sleek, dark-themed dashboard — available as a PWA, desktop widget, iOS widget, and Android widget.

![Dark Theme](https://img.shields.io/badge/theme-dark-0a0a12?style=flat-square)
![PWA](https://img.shields.io/badge/PWA-ready-7c6aef?style=flat-square)
![iOS](https://img.shields.io/badge/iOS-Scriptable%20%7C%20WidgetKit-d4a574?style=flat-square)
![Android](https://img.shields.io/badge/Android-Jetpack%20Glance-10a37f?style=flat-square)

## What It Does

- **6 live stat cards** — total tokens, today's usage, Claude vs Codex sessions, active time, weekly totals
- **Calendar heatmap** — GitHub-style contribution grid filtered by platform
- **Session feed** — 25 most recent sessions with platform, tokens, and duration
- **Weekly bar chart** — Claude/Codex split with filter tabs
- **Streak tracker** — consecutive days with 4 monthly goals
- **Cost estimator** — today / week / month / all-time at current API rates
- **Data portability** — JSON/CSV export, JSON import, reset

## Quick Start (PWA)

The fastest way to get the tracker on your phone:

1. Open **[the live app](https://yenugah80.github.io/ai-usage-tracker/mobile/mobile-pwa.html)** on your phone
2. **iOS**: Share → Add to Home Screen
3. **Android**: Menu (⋮) → Add to Home Screen

Works offline after first load. No account needed.

## All Platforms

| Platform | File | How to Use |
|----------|------|------------|
| **Web Dashboard** | `ai-usage-tracker.html` | Open in any browser |
| **Mobile PWA** | `mobile/mobile-pwa.html` | Install from browser to home screen |
| **Desktop Widget** | `desktop-widget.pyw` | `pythonw desktop-widget.pyw` (always-on-top overlay) |
| **iOS Scriptable** | `mobile/ios-scriptable-widget.js` | Paste into Scriptable app → add widget |
| **iOS Native** | `mobile/ios-native-widget/AIUsageWidget.swift` | Add as WidgetKit extension in Xcode |
| **Android Native** | `mobile/android-native-widget/AIUsageWidget.kt` | Add as Glance widget in Android Studio |

## Desktop Widget

A frameless, always-on-top Python overlay that sits in the corner of your screen.

```bash
# Launch (runs in background)
pythonw desktop-widget.pyw

# Or use the batch launcher
launch-widget.bat
```

**Controls**: drag to move, double-click to open dashboard, right-click for menu.

Reads from `ai-usage-data.json` and auto-refreshes every 30 seconds.

## iOS Scriptable Widget

1. Install [Scriptable](https://apps.apple.com/app/scriptable/id1405459188) from the App Store
2. Create a new script and paste `ios-scriptable-widget.js`
3. Add a Scriptable widget to your home screen
4. Edit widget → select the script → set parameter to `small`, `medium`, or `large`

To use live data, set `DATA_URL` at the top of the script to your JSON endpoint.

## Design

Dark theme with glassmorphism, ambient animated orbs, and smooth transitions.

| Element | Color |
|---------|-------|
| Claude | `#d4a574` |
| Codex | `#10a37f` |
| Accent | `#7c6aef` |
| Background | `#06060b` |

Fonts: Inter (UI) + JetBrains Mono (numbers).

## Data Format

All platforms share the same JSON schema:

```json
{
  "id": "2026-06-21-0",
  "platform": "claude",
  "name": "Code review",
  "date": "2026-06-21",
  "time": "14:30",
  "tokens": 12500,
  "duration": 25
}
```

**Cost rates**: Claude $3/M input, $15/M output · Codex $2/M input, $8/M output (70/30 input/output split assumed).

## File Structure

```
ai-usage-tracker/
├── ai-usage-tracker.html        # Full web dashboard
├── desktop-widget.pyw           # Python desktop overlay
├── ai-usage-data.json           # Shared data file (auto-generated)
├── launch-widget.bat            # Desktop widget launcher
├── README.md
└── mobile/
    ├── mobile-pwa.html          # Mobile PWA dashboard
    ├── manifest.json            # PWA manifest
    ├── sw.js                    # Service worker (offline support)
    ├── ios-scriptable-widget.js
    ├── ios-native-widget/
    │   └── AIUsageWidget.swift
    └── android-native-widget/
        └── AIUsageWidget.kt
```

## License

MIT
