import sqlite3

def upgrade():
    conn = sqlite3.connect("rental.db")
    cursor = conn.cursor()
    try:
        cursor.execute("ALTER TABLE roommate_profiles ADD COLUMN profile_type VARCHAR NOT NULL DEFAULT 'roommate'")
        print("Added profile_type")
    except sqlite3.OperationalError as e:
        if "duplicate column name" in str(e):
            print("Column profile_type already exists.")
        else:
            print(f"Error adding profile_type: {e}")

    try:
        cursor.execute("ALTER TABLE roommate_profiles ADD COLUMN house_type VARCHAR")
        print("Added house_type")
    except sqlite3.OperationalError as e:
        if "duplicate column name" in str(e):
            print("Column house_type already exists.")
        else:
            print(f"Error adding house_type: {e}")

    try:
        cursor.execute("ALTER TABLE roommate_profiles ADD COLUMN nationality VARCHAR")
        print("Added nationality")
    except sqlite3.OperationalError as e:
        if "duplicate column name" in str(e):
            print("Column nationality already exists.")
        else:
            print(f"Error adding nationality: {e}")

    conn.commit()
    conn.close()

if __name__ == "__main__":
    upgrade()
