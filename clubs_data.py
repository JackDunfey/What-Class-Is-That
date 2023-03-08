import requests
from datetime import date
import json

if __name__ == "__main__":
    r = requests.get(f"https://buffalo.campuslabs.com/engage/api/discovery/event/search?endsAfter={str(date.today())}T02%3A09%3A19-05%3A00&orderByField=endsOn&orderByDirection=ascending&status=Approved&take=100&query=")
    # data = json.dumps(r.json(), indent=4)
    data = r.text
    with open("clubs.json", "w") as outfile:
        outfile.write(data)