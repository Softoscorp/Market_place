import sqlite3

def upgrade():
    conn = sqlite3.connect("rental.db")
    cursor = conn.cursor()
    try:
        cursor.execute("ALTER TABLE roommate_profiles ADD COLUMN listing_id INTEGER REFERENCES listings(id)")
        print("Successfully added listing_id to roommate_profiles")
    except sqlite3.OperationalError as e:
        if "duplicate column name" in str(e):
            print("Column listing_id already exists.")
        else:
            print(f"Error: {e}")
    conn.commit()
    conn.close()

if __name__ == "__main__":
    upgrade()
