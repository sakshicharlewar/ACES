import sqlite3
conn = sqlite3.connect('backend/aces_db.sqlite')
cursor = conn.cursor()
cursor.execute("UPDATE events SET event_status = 'upcoming', result_status = 'announced' WHERE id = 1")
conn.commit()
print("Bug Hunt set to upcoming!")
