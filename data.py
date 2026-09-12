import os, requests, json
from dotenv import load_dotenv
from datetime import date

load_dotenv()

marketstack_api_key = os.getenv("MARKETSTACK_API_KEY")
symbol = "AIML.CN"  # https://aiml-innovations.com/
BASE_URL = "https://api.marketstack.com/v2/eod"
LIMIT = 100  # max records per request (check your plan's max)


def fetch_all_eod_data(_symbol: str) -> list:
    """Fetch full year of EOD data for a symbol, paging through results."""
    current_date = date.today()
    all_data = []
    offset = 0

    while True:
        parameters = {
            "access_key": marketstack_api_key,
            "symbols": _symbol,
            "sort": "ASC",
            "date_from": f"{current_date.replace(year=current_date.year - 1)}",
            "date_to": f"{current_date}",
            "limit": LIMIT,
            "offset": offset,
        }

        try:
            response = requests.get(url=BASE_URL, params=parameters)
            response.raise_for_status()
        except requests.exceptions.RequestException as e:
            print(f"An error occurred while connecting to marketstack:\n{e}")
            exit(1)

        payload = response.json()
        batch = payload.get("data", [])
        all_data.extend(batch)

        pagination = payload.get("pagination", {})
        total = pagination.get("total", 0)
        offset += LIMIT

        # Stop once we've collected everything the API says exists
        if offset >= total or not batch:
            break

    return all_data

if __name__ == "__main__":
    records = fetch_all_eod_data(symbol)
    print(f"Fetched {len(records)} records for {symbol}")
    print(json.dumps(records, indent=4))
