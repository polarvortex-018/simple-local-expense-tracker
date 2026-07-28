import sys
from pathlib import Path
from decimal import Decimal

backend_dir = Path(r"c:\Users\renbou\Desktop\Most of the Good Stuff\projects\financial tracking app v2\backend")
sys.path.insert(0, str(backend_dir))

from sqlmodel import Session, text
from app.db.session import engine

def clear_all():
    with Session(engine) as db:
        tx_deleted = db.exec(text("DELETE FROM transactions")).rowcount
        debt_deleted = db.exec(text("DELETE FROM debts")).rowcount
        db.commit()

        print(f"Cleared {tx_deleted} transactions and {debt_deleted} debts.")

if __name__ == "__main__":
    clear_all()
