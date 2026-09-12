from flask import Flask, jsonify, render_template
from data import fetch_all_eod_data, symbol
from datetime import date

app = Flask(__name__)

# Simple in-memory cache so we don't hit the Marketstack API on every
# page load (each full-year pull costs ~3 requests against your quota).
_cache = {"data": None, "as_of_date": None}


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/api/eod")
def api_eod():
    today = date.today()
    if _cache["data"] is None or _cache["as_of_date"] != today:
        _cache["data"] = fetch_all_eod_data(symbol)
        _cache["as_of_date"] = today
    return jsonify(_cache["data"])


if __name__ == "__main__":
    app.run(debug=True)
