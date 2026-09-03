import sqlite3
conn = sqlite3.connect('aces_db.sqlite')
c = conn.cursor()
print(c.execute("SELECT id FROM events WHERE slug='bug-hunt-debug-the-web'").fetchone()[0])
