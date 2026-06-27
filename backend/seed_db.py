import logging
from mock_data import seed_db

if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    print("Starting database seeding...")
    seed_db()
    print("Database seeding completed.")
