"""
AI Usage Tracker — Desktop Overlay Widget
Always-on-top transparent widget showing Claude & Codex usage at a glance.
Double-click to open the full dashboard. Right-click for options.

Requirements: pip install tkinter (built-in with Python)
Run: pythonw desktop-widget.pyw  (or python desktop-widget.pyw)
"""

import tkinter as tk
from tkinter import font as tkfont
import json
import os
import webbrowser
import datetime
import math

# ── Config ──────────────────────────────────────────
WIDGET_WIDTH = 320
WIDGET_HEIGHT = 260
BG_COLOR = "#0c0c14"
BORDER_COLOR = "#1c1c2e"
TEXT_COLOR = "#e8e8f0"
TEXT_DIM = "#6a6a88"
TEXT_MUTED = "#3e3e56"
CLAUDE_COLOR = "#d4a574"
CODEX_COLOR = "#10a37f"
ACCENT_COLOR = "#7c6aef"
GREEN_COLOR = "#22c55e"

REFRESH_MS = 30000  # refresh data every 30s
CLOCK_MS = 1000

# Paths
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
DASHBOARD_PATH = os.path.join(SCRIPT_DIR, "ai-usage-tracker.html")

# Try to find the browser localStorage data
# We'll use a shared JSON file for the widget
DATA_FILE = os.path.join(SCRIPT_DIR, "ai-usage-data.json")


def load_data():
    """Load session data from JSON file."""
    if os.path.exists(DATA_FILE):
        try:
            with open(DATA_FILE, 'r') as f:
                return json.load(f)
        except:
            pass
    return generate_sample_data()


def generate_sample_data():
    """Generate sample data if no file exists."""
    import random
    sessions = []
    now = datetime.datetime.now()
    claude_names = [
        'Code review', 'Debug auth flow', 'Write unit tests', 'Refactor API',
        'Schema design', 'Draft blog post', 'Architecture review', 'Fix CI pipeline',
        'Data analysis', 'Prompt engineering', 'Research synthesis', 'Sprint planning'
    ]
    codex_names = [
        'Generate boilerplate', 'Autocomplete module', 'Test generation',
        'Code translation', 'CLI tool build', 'SQL optimization',
        'API scaffolding', 'Migration script', 'Build pipeline'
    ]

    for i in range(90):
        d = now - datetime.timedelta(days=i)
        ds = d.strftime('%Y-%m-%d')
        prob = min(0.9, 0.35 + (90 - i) / 140)
        n = random.randint(1, 4) if random.random() < prob else 0
        for j in range(n):
            is_claude = random.random() < 0.58
            names = claude_names if is_claude else codex_names
            hr = random.randint(7, 20)
            mn = random.randint(0, 59)
            sessions.append({
                'id': f'{ds}-{j}',
                'platform': 'claude' if is_claude else 'codex',
                'name': random.choice(names),
                'date': ds,
                'time': f'{hr:02d}:{mn:02d}',
                'tokens': random.randint(1500, 55000),
                'duration': random.randint(3, 95)
            })

    with open(DATA_FILE, 'w') as f:
        json.dump(sessions, f, indent=2)

    return sessions


def fmt(n):
    if n >= 1_000_000:
        return f"{n / 1_000_000:.1f}M"
    if n >= 1_000:
        return f"{n / 1_000:.1f}K"
    return str(n)


class DesktopWidget(tk.Tk):
    def __init__(self):
        super().__init__()

        self.title("AI Usage Tracker")
        self.overrideredirect(True)  # Remove window decorations
        self.attributes("-topmost", True)  # Always on top
        self.attributes("-alpha", 0.92)  # Slight transparency
        self.configure(bg=BG_COLOR)

        # Position: bottom-right of screen
        screen_w = self.winfo_screenwidth()
        screen_h = self.winfo_screenheight()
        x = screen_w - WIDGET_WIDTH - 20
        y = screen_h - WIDGET_HEIGHT - 60
        self.geometry(f"{WIDGET_WIDTH}x{WIDGET_HEIGHT}+{x}+{y}")

        # Drag support
        self._drag_x = 0
        self._drag_y = 0

        # Load data
        self.data = load_data()

        # Build UI
        self.build_ui()

        # Bind events
        self.bind("<ButtonPress-1>", self.start_drag)
        self.bind("<B1-Motion>", self.do_drag)
        self.bind("<Double-Button-1>", self.open_dashboard)
        self.bind("<Button-3>", self.show_menu)

        # Start refresh loops
        self.update_clock()
        self.refresh_data()

    def build_ui(self):
        # Fonts
        self.font_title = tkfont.Font(family="Segoe UI", size=11, weight="bold")
        self.font_big = tkfont.Font(family="Consolas", size=22, weight="bold")
        self.font_med = tkfont.Font(family="Consolas", size=14, weight="bold")
        self.font_sm = tkfont.Font(family="Segoe UI", size=8)
        self.font_xs = tkfont.Font(family="Segoe UI", size=7)
        self.font_label = tkfont.Font(family="Segoe UI", size=8, weight="bold")

        # Main canvas for rounded rect appearance
        self.canvas = tk.Canvas(
            self, bg=BG_COLOR, highlightthickness=0,
            width=WIDGET_WIDTH, height=WIDGET_HEIGHT
        )
        self.canvas.pack(fill="both", expand=True)

        # Draw border
        self.canvas.create_rectangle(
            1, 1, WIDGET_WIDTH - 1, WIDGET_HEIGHT - 1,
            outline=BORDER_COLOR, width=1
        )

        # Header bar
        self.canvas.create_rectangle(0, 0, WIDGET_WIDTH, 36, fill="#10101a", outline="")
        self.canvas.create_text(
            14, 18, text="AI Usage Tracker", anchor="w",
            fill=TEXT_COLOR, font=self.font_title
        )

        # Live dot
        self.live_dot = self.canvas.create_oval(
            WIDGET_WIDTH - 66, 14, WIDGET_WIDTH - 60, 20,
            fill=GREEN_COLOR, outline=""
        )

        # Clock
        self.clock_text = self.canvas.create_text(
            WIDGET_WIDTH - 54, 18, text="", anchor="w",
            fill=TEXT_DIM, font=self.font_xs
        )

        # Close button
        close_btn = self.canvas.create_text(
            WIDGET_WIDTH - 12, 18, text="×", anchor="e",
            fill=TEXT_DIM, font=tkfont.Font(family="Segoe UI", size=14)
        )
        self.canvas.tag_bind(close_btn, "<Button-1>", lambda e: self.destroy())

        # ── Stats Section ──
        y_start = 48

        # Total Tokens
        self.canvas.create_text(14, y_start, text="TOTAL TOKENS", anchor="w", fill=TEXT_DIM, font=self.font_label)
        self.total_tokens_text = self.canvas.create_text(
            14, y_start + 22, text="0", anchor="w", fill=ACCENT_COLOR, font=self.font_big
        )

        # Today badge
        self.canvas.create_text(WIDGET_WIDTH - 14, y_start, text="TODAY", anchor="e", fill=TEXT_DIM, font=self.font_label)
        self.today_text = self.canvas.create_text(
            WIDGET_WIDTH - 14, y_start + 22, text="0", anchor="e", fill=GREEN_COLOR, font=self.font_med
        )

        # Divider
        y_div = y_start + 48
        self.canvas.create_line(14, y_div, WIDGET_WIDTH - 14, y_div, fill=BORDER_COLOR)

        # Claude row
        y_c = y_div + 16
        self.canvas.create_oval(14, y_c - 5, 24, y_c + 5, fill=CLAUDE_COLOR, outline="")
        self.canvas.create_text(30, y_c, text="Claude", anchor="w", fill=TEXT_COLOR, font=self.font_label)
        self.claude_sess_text = self.canvas.create_text(
            140, y_c, text="0 sessions", anchor="w", fill=TEXT_DIM, font=self.font_sm
        )
        self.claude_tok_text = self.canvas.create_text(
            WIDGET_WIDTH - 14, y_c, text="0", anchor="e", fill=CLAUDE_COLOR, font=self.font_med
        )

        # Codex row
        y_x = y_c + 28
        self.canvas.create_oval(14, y_x - 5, 24, y_x + 5, fill=CODEX_COLOR, outline="")
        self.canvas.create_text(30, y_x, text="Codex", anchor="w", fill=TEXT_COLOR, font=self.font_label)
        self.codex_sess_text = self.canvas.create_text(
            140, y_x, text="0 sessions", anchor="w", fill=TEXT_DIM, font=self.font_sm
        )
        self.codex_tok_text = self.canvas.create_text(
            WIDGET_WIDTH - 14, y_x, text="0", anchor="e", fill=CODEX_COLOR, font=self.font_med
        )

        # Divider
        y_div2 = y_x + 24
        self.canvas.create_line(14, y_div2, WIDGET_WIDTH - 14, y_div2, fill=BORDER_COLOR)

        # Streak
        y_s = y_div2 + 18
        self.canvas.create_text(14, y_s, text="🔥", anchor="w", font=self.font_sm)
        self.streak_text = self.canvas.create_text(
            30, y_s, text="0 day streak", anchor="w", fill=TEXT_COLOR, font=self.font_label
        )

        # Week tokens
        self.week_text = self.canvas.create_text(
            WIDGET_WIDTH - 14, y_s, text="This week: 0", anchor="e", fill=TEXT_DIM, font=self.font_xs
        )

        # Bottom hint
        self.canvas.create_text(
            WIDGET_WIDTH // 2, WIDGET_HEIGHT - 10,
            text="Double-click to open dashboard  ·  Drag to move",
            anchor="center", fill=TEXT_MUTED, font=self.font_xs
        )

        # Initial render
        self.render_stats()

    def render_stats(self):
        today = datetime.date.today().isoformat()
        now = datetime.datetime.now()

        # Total tokens
        total = sum(s['tokens'] for s in self.data)
        self.canvas.itemconfig(self.total_tokens_text, text=fmt(total))

        # Today
        td = [s for s in self.data if s['date'] == today]
        td_tok = sum(s['tokens'] for s in td)
        self.canvas.itemconfig(self.today_text, text=fmt(td_tok))

        # Claude
        claude = [s for s in self.data if s['platform'] == 'claude']
        claude_tok = sum(s['tokens'] for s in claude)
        self.canvas.itemconfig(self.claude_sess_text, text=f"{len(claude)} sessions")
        self.canvas.itemconfig(self.claude_tok_text, text=fmt(claude_tok))

        # Codex
        codex = [s for s in self.data if s['platform'] == 'codex']
        codex_tok = sum(s['tokens'] for s in codex)
        self.canvas.itemconfig(self.codex_sess_text, text=f"{len(codex)} sessions")
        self.canvas.itemconfig(self.codex_tok_text, text=fmt(codex_tok))

        # Streak
        streak = 0
        for i in range(400):
            d = (now - datetime.timedelta(days=i)).strftime('%Y-%m-%d')
            if any(s['date'] == d for s in self.data):
                streak += 1
            else:
                break
        self.canvas.itemconfig(self.streak_text, text=f"{streak} day streak")

        # This week
        weekday = now.weekday()
        week_start = (now - datetime.timedelta(days=(weekday + 1) % 7)).strftime('%Y-%m-%d')
        wk = [s for s in self.data if s['date'] >= week_start]
        wk_tok = sum(s['tokens'] for s in wk)
        self.canvas.itemconfig(self.week_text, text=f"This week: {fmt(wk_tok)}")

    def update_clock(self):
        now = datetime.datetime.now()
        self.canvas.itemconfig(self.clock_text, text=now.strftime("%H:%M"))

        # Pulse the dot
        alpha = 0.4 + 0.6 * abs(math.sin(now.second * math.pi / 2.5))
        g = int(197 * alpha)
        color = f"#{22:02x}{g:02x}{int(94*alpha):02x}"
        self.canvas.itemconfig(self.live_dot, fill=color)

        self.after(CLOCK_MS, self.update_clock)

    def refresh_data(self):
        self.data = load_data()
        self.render_stats()
        self.after(REFRESH_MS, self.refresh_data)

    def start_drag(self, event):
        self._drag_x = event.x
        self._drag_y = event.y

    def do_drag(self, event):
        x = self.winfo_x() + event.x - self._drag_x
        y = self.winfo_y() + event.y - self._drag_y
        self.geometry(f"+{x}+{y}")

    def open_dashboard(self, event=None):
        if os.path.exists(DASHBOARD_PATH):
            webbrowser.open(f"file:///{DASHBOARD_PATH.replace(os.sep, '/')}")

    def show_menu(self, event):
        menu = tk.Menu(self, tearoff=0, bg="#1a1a28", fg=TEXT_COLOR,
                       activebackground=ACCENT_COLOR, activeforeground="#fff",
                       font=("Segoe UI", 9))
        menu.add_command(label="Open Dashboard", command=self.open_dashboard)
        menu.add_command(label="Refresh Data", command=lambda: [self.refresh_data()])
        menu.add_separator()
        menu.add_command(label="Exit", command=self.destroy)
        menu.post(event.x_root, event.y_root)


if __name__ == "__main__":
    app = DesktopWidget()
    app.mainloop()
