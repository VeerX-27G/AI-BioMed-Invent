# AI-BioMed-Invent

A small Flask dashboard that tracks the stock price of **AI/ML Innovations Inc. (CSE: AIML, ticker `AIML.CN`)**, a company working on biomedical signal processing. It pulls one year of end-of-day (EOD) prices from the [Marketstack](https://marketstack.com/) API and shows them as an interactive price chart with summary stats and a table of recent trading sessions.

> This project is for learning and demonstration. It is not affiliated with AI/ML Innovations Inc., and nothing it shows is financial advice.

## Features

- Closing-price line chart drawn as a custom SVG (no charting library), with a glow effect and an animated draw-in
- Range toggles for 1M, 3M, 6M and 1Y views
- Hover crosshair with a tooltip showing the date and closing price
- Header with the latest close and the day-over-day change (value and percent)
- Stat cards for the latest open, volume, 52-week range and number of sessions tracked
- Table of the 15 most recent sessions (open, high, low, close, volume)
- Dark, terminal-style theme that respects `prefers-reduced-motion`

## How it works

1. `data.py` calls the Marketstack `/v2/eod` endpoint for `AIML.CN`, covering the last year up to today. It pages through results 100 records at a time until everything is collected.
2. `app.py` exposes that data at `/api/eod` as JSON. Results are cached in memory and refreshed at most once per day, so page loads don't burn through your API quota (a full-year pull takes about 3 requests).
3. `static/js/script.js` fetches `/api/eod` in the browser and renders the chart, stats and table.

## Tech stack

| Layer | Tools |
| --- | --- |
| Backend | Python, Flask, `requests`, `python-dotenv` |
| Data source | Marketstack EOD API |
| Frontend | HTML, vanilla JavaScript, SVG, Tailwind CSS (CDN), custom CSS |
| Fonts | Space Grotesk, IBM Plex Sans, IBM Plex Mono (Google Fonts) |

## Project structure

```
AI-BioMed-Invent/
├── app.py               # Flask app: index page and /api/eod endpoint (with daily cache)
├── data.py              # Marketstack client: fetches and pages through EOD data
├── templates/
│   └── index.html       # Dashboard page
├── static/
│   ├── css/style.css    # Theme, animations, small component styles
│   └── js/script.js     # Data loading, chart rendering, tooltip, range controls
├── requirements.txt     # Python dependencies
└── pyproject.toml       # Project metadata
```

## Getting started

### Prerequisites

- Python 3.14 or newer, as declared in `pyproject.toml` (the code itself doesn't appear to use anything version-specific, so older 3.x versions may also work)
- A Marketstack API key ([sign up for a free plan](https://marketstack.com/))

### Installation

```bash
git clone https://github.com/VeerX-27G/AI-BioMed-Invent.git
cd AI-BioMed-Invent

python -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

### Configuration

Create a `.env` file in the project root:

```env
MARKETSTACK_API_KEY=your_api_key_here
```

The `.env` file is already listed in `.gitignore`, so your key won't be committed.

### Run it

```bash
python app.py
```

Then open <http://127.0.0.1:5000>.

To check the data fetch on its own, run `python data.py`. It prints the number of records and the raw JSON.

## API

| Route | Method | Description |
| --- | --- | --- |
| `/` | GET | Dashboard page |
| `/api/eod` | GET | JSON array of daily records (open, high, low, close, volume, date, ...) for the last year, in ascending date order |

## Notes and limitations

- Data is end-of-day, so the "live" price in the header is the most recent close, not a real-time quote.
- The cache lives in the app's memory. It resets whenever the server restarts and isn't shared between multiple worker processes.
- The 1M / 3M / 6M buttons slice the last 30 / 90 / 180 trading sessions, which is close to, but not exactly, those calendar periods.
- `app.py` runs with `debug=True`, which is for local development only. Use a production server such as gunicorn if you deploy it.
- Tailwind is loaded from its CDN script, so the page needs an internet connection.

## Ideas for next steps

- Show an error message in the UI when the API call fails, instead of just "N/A"
- Add other tickers or a symbol search
- Add volume bars under the price chart
- Persist fetched data (for example in SQLite) to reduce API usage
