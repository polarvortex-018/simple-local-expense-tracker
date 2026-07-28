import sys
import re
import datetime
from decimal import Decimal
from pathlib import Path

# Add backend directory to sys.path
backend_dir = Path(r"c:\Users\renbou\Desktop\Most of the Good Stuff\projects\financial tracking app v2\backend")
sys.path.insert(0, str(backend_dir))

from sqlmodel import Session, select
from app.db.session import engine
from app.models.account import Account, AccountType
from app.models.category import Category
from app.models.transaction import Transaction, TransactionType

MONTH_MAP = {
    'jan': 1, 'january': 1,
    'feb': 2, 'february': 2,
    'mar': 3, 'marcg': 3, 'march': 3,
    'apr': 4, 'april': 4,
    'may': 5,
    'jun': 6, 'june': 6,
    'jul': 7, 'july': 7,
    'aug': 8, 'august': 8,
    'sep': 9, 'september': 9,
    'oct': 10, 'october': 10,
    'nov': 11, 'november': 11,
    'dec': 12, 'december': 12
}

def determine_category(desc: str, cat_map: dict) -> Category:
    desc_lower = desc.lower()
    
    # Check Food
    food_keywords = [
        'food', 'gobi', 'rice', 'chips', 'biriyani', 'dosa', 'parotta', 'pizza',
        'ice cream', 'icecream', 'juice', 'sweet', 'choco', 'fruit', 'bread', 'jam',
        'chicken', 'tea', 'coffee', 'momo', 'burger', 'snack', 'meal', 'lunch', 'dinner',
        'breakfast', 'egg', 'roll', 'kebab', 'shawerma', 'waffle', 'shake', 'biscuit',
        'oreo', 'jalebi', 'mango', 'banana', 'grapes', 'dahi', 'puri', 'lolly', 'candy',
        'water', 'milk', 'yogurt', 'cheese', 'paneer', 'naan', 'halwa', 'butter',
        'veggie', 'vegetable', 'flour', 'aata', 'oil', 'grocery', 'groceries', 'noodle',
        'puffs', 'samosa', 'cutlet', 'doodh', 'semiya', 'chai', 'mutton', 'kheer',
        'lassi', 'pastry', 'donut', 'pasta', 'sauce'
    ]
    if any(k in desc_lower for k in food_keywords):
        return cat_map.get('Food') or list(cat_map.values())[0]

    # Check Rent & Utilities
    rent_keywords = ['rent', 'hostel', 'ebill', 'electricity', 'bill', 'ac']
    if any(k in desc_lower for k in rent_keywords):
        return cat_map.get('Rent') or list(cat_map.values())[0]

    # Check Petrol / Transport
    petrol_keywords = [
        'petrol', 'cab', 'taxi', 'auto', 'bus', 'train', 'metro', 'travel', 'transport',
        'parking', 'flight', 'bag', 'cycle', 'fuel', 'courier'
    ]
    if any(k in desc_lower for k in petrol_keywords):
        return cat_map.get('Petrol') or cat_map.get('Necessities') or list(cat_map.values())[0]

    # Check Luxuries
    luxury_keywords = [
        'movie', 'book', 'gift', 'cloth', 'pant', 'shirt', 'shoe', 'haircut', 'hair color',
        'popcorn', 'trampoline', 'laser tag', 'bday', 'party', 'accessory', 'speaker',
        'billiards', 'earring', 'bangle', 'necklace', 'resistance band', 'dr strange',
        'thor', 'no way home', 'kgf2', 'fest', 'waffle', 'gadget', 'shampoo', 'conditioner',
        'keychain', 'sim', 'license'
    ]
    if any(k in desc_lower for k in luxury_keywords):
        return cat_map.get('Luxuries') or list(cat_map.values())[0]

    # Default to Necessities
    return cat_map.get('Necessities') or list(cat_map.values())[0]


def run_import(file_path: Path):
    if not file_path.exists():
        print(f"Error: File not found at {file_path}")
        return

    with open(file_path, "r", encoding="utf-8") as f:
        text = f.read()

    lines = text.splitlines()

    current_year = 2021
    current_month = 12
    current_day = 5

    parsed_transactions = []

    with Session(engine) as db:
        # Load existing categories & accounts
        categories = db.exec(select(Category)).all()
        cat_map = {c.name: c for c in categories}

        accounts = db.exec(select(Account)).all()
        default_account = accounts[0] if accounts else None
        if not default_account:
            default_account = Account(name="Checking", type=AccountType.CHECKING)
            db.add(default_account)
            db.commit()
            db.refresh(default_account)

        for line in lines:
            line_str = line.strip()
            if not line_str:
                continue

            # Year line check (e.g. 2022, 2023, 2024, 2025)
            year_match = re.match(r"^(202[1-5])$", line_str)
            if year_match:
                current_year = int(year_match.group(1))
                continue

            # Date header check (e.g., "19 December", "20dec", "1jan", "Jan 15", "Feb 2", "March 1")
            date_match = re.match(r"^([0-9]{1,2})\s*([a-zA-Z]+)$|^([a-zA-Z]+)\s*([0-9]{1,2})$", line_str, re.IGNORECASE)
            if date_match:
                d1, m1, m2, d2 = date_match.groups()
                day_str = d1 or d2
                month_str = (m1 or m2).lower()
                if month_str in MONTH_MAP and day_str:
                    try:
                        current_day = int(day_str)
                        current_month = MONTH_MAP[month_str]
                        continue
                    except ValueError:
                        pass

            # Check single month headers like "JANUARY", "FEBRUARY", "MARCH"
            single_month = line_str.lower().strip()
            if single_month in MONTH_MAP:
                current_month = MONTH_MAP[single_month]
                current_day = 1
                continue

            # Skip summary lines
            if "EXPENSES" in line_str or "TOTAL" in line_str or "SO FAR" in line_str or "WITHOUT" in line_str or "YOU HAVE" in line_str:
                continue

            is_income = line_str.startswith("+")
            clean_line = line_str.lstrip("+").strip()

            # Match amount pattern: digit(s) optionally followed by rs/RS
            amt_match = re.search(r"(\d+(?:\.\d+)?)\s*(?:rs|RS)?", clean_line)
            if amt_match:
                try:
                    amount = Decimal(amt_match.group(1))
                    if amount <= 0:
                        continue

                    # Extract description
                    desc = clean_line[:amt_match.start()] + clean_line[amt_match.end():]
                    desc = desc.strip(" -:,").strip()
                    if not desc:
                        desc = "General Expense" if not is_income else "Income"

                    # Construct date
                    try:
                        tx_date = datetime.date(current_year, current_month, current_day)
                    except ValueError:
                        tx_date = datetime.date(current_year, current_month, 28)

                    tx_type = TransactionType.INCOME if is_income else TransactionType.EXPENSE
                    cat = cat_map.get("Food") if not is_income else cat_map.get("Necessities")
                    if not is_income:
                        cat = determine_category(desc, cat_map)

                    tx = Transaction(
                        amount=amount,
                        date=tx_date,
                        description=desc,
                        transaction_type=tx_type,
                        notes="Imported from expenses.txt",
                        account_id=default_account.id,
                        category_id=cat.id
                    )
                    db.add(tx)
                    parsed_transactions.append(tx)
                except Exception as e:
                    pass

        db.commit()
        print(f"SUCCESS: Imported {len(parsed_transactions)} transactions into finance.db!")

if __name__ == "__main__":
    expenses_file = Path(r"c:\Users\renbou\Desktop\Most of the Good Stuff\projects\financial tracking app v2\data\expenses from 2021-2025.txt")
    run_import(expenses_file)
