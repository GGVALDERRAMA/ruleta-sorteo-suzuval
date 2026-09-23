import urllib.request
import json

SUPABASE_URL = 'https://gbbpsoghivdomhnobxhr.supabase.co'
SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdiYnBzb2doaXZkb21obm9ieGhyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAxMDEzNDEsImV4cCI6MjEwNTY3NzM0MX0.kF2CIgfEADObk38vtfTppQNx0WEq5vOEnCufza6jroY'

req = urllib.request.Request(
    f'{SUPABASE_URL}/rest/v1/ganadores?select=*&order=fecha.desc',
    headers={
        'apikey': SUPABASE_KEY,
        'Authorization': f'Bearer {SUPABASE_KEY}'
    }
)

try:
    with urllib.request.urlopen(req) as response:
        data = json.loads(response.read().decode())
        print(f"Ganadores: {data}")
except Exception as e:
    print(e)
