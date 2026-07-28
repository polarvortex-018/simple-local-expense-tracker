import sys
from datetime import date, timedelta
from decimal import Decimal
from pathlib import Path

backend_dir = Path(r"c:\Users\renbou\Desktop\Most of the Good Stuff\projects\financial tracking app v2\backend")
sys.path.insert(0, str(backend_dir))

from sqlmodel import Session, select
from app.db.session import engine
from app.models.account import Account, AccountType
from app.models.category import Category
from app.models.savings_bucket import SavingsBucket
from app.models.transaction import Transaction, TransactionType
from app.models.debt import Debt, DebtType

def seed():
    with Session(engine) as db:
        # Clear existing data first
        db.exec(select(Transaction)).all()
        
        # 1. Accounts
        accounts = db.exec(select(Account)).all()
        if not accounts:
            acc1 = Account(name="SBI Bank", type=AccountType.CHECKING)
            acc2 = Account(name="HDFC Savings", type=AccountType.SAVINGS)
            acc3 = Account(name="Cash Wallet", type=AccountType.CASH)
            db.add_all([acc1, acc2, acc3])
            db.commit()
            accounts = db.exec(select(Account)).all()

        acc_sbi = accounts[0].id
        acc_hdfc = accounts[1].id if len(accounts) > 1 else accounts[0].id
        acc_cash = accounts[2].id if len(accounts) > 2 else accounts[0].id

        # 2. Categories
        categories = db.exec(select(Category)).all()
        if not categories:
            cat_food = Category(name="Food", color="#f59e0b")
            cat_rent = Category(name="Rent", color="#3b82f6")
            cat_petrol = Category(name="Petrol", color="#10b981")
            cat_lux = Category(name="Luxuries", color="#ec4899")
            cat_nec = Category(name="Necessities", color="#8b5cf6")
            db.add_all([cat_food, cat_rent, cat_petrol, cat_lux, cat_nec])
            db.commit()
            categories = db.exec(select(Category)).all()

        cat_map = {c.name.lower(): c.id for c in categories}
        default_cat = categories[0].id

        # 3. Savings Buckets
        b_monthly = db.exec(select(SavingsBucket).where(SavingsBucket.name == "Monthly Expenses")).first()
        if not b_monthly:
            b_monthly = SavingsBucket(name="Monthly Expenses", icon="💵", color="#3b82f6")
            db.add(b_monthly)
        
        b_emergency = db.exec(select(SavingsBucket).where(SavingsBucket.name == "Emergency Fund")).first()
        if not b_emergency:
            b_emergency = SavingsBucket(name="Emergency Fund", icon="🛡️", color="#10b981")
            db.add(b_emergency)

        b_travel = db.exec(select(SavingsBucket).where(SavingsBucket.name == "Trip to Japan")).first()
        if not b_travel:
            b_travel = SavingsBucket(name="Trip to Japan", icon="✈️", color="#f59e0b")
            db.add(b_travel)

        b_laptop = db.exec(select(SavingsBucket).where(SavingsBucket.name == "New Laptop")).first()
        if not b_laptop:
            b_laptop = SavingsBucket(name="New Laptop", icon="💻", color="#ec4899")
            db.add(b_laptop)

        b_invest = db.exec(select(SavingsBucket).where(SavingsBucket.name == "Investments")).first()
        if not b_invest:
            b_invest = SavingsBucket(name="Investments", icon="📈", color="#8b5cf6")
            db.add(b_invest)

        db.commit()

        b_monthly_id = b_monthly.id
        b_emergency_id = b_emergency.id
        b_travel_id = b_travel.id
        b_laptop_id = b_laptop.id
        b_invest_id = b_invest.id

        today = date.today()

        # 4. Transactions with both Account and Savings Bucket assignments
        mock_transactions = [
            # Income allocations
            Transaction(
                amount=Decimal("75000.00"),
                date=today - timedelta(days=25),
                description="Monthly Salary Credit",
                transaction_type=TransactionType.INCOME,
                account_id=acc_sbi,
                bucket_id=b_monthly_id,
                category_id=cat_map.get("necessities", default_cat),
                notes="Salary allocated for monthly expenses"
            ),
            Transaction(
                amount=Decimal("30000.00"),
                date=today - timedelta(days=22),
                description="Bonus Allocation to Emergency Fund",
                transaction_type=TransactionType.INCOME,
                account_id=acc_hdfc,
                bucket_id=b_emergency_id,
                category_id=cat_map.get("necessities", default_cat),
                notes="Allocated to safety net"
            ),
            Transaction(
                amount=Decimal("18500.00"),
                date=today - timedelta(days=15),
                description="Freelance Payment -> Laptop Savings",
                transaction_type=TransactionType.INCOME,
                account_id=acc_sbi,
                bucket_id=b_laptop_id,
                category_id=cat_map.get("necessities", default_cat),
                notes="Saving for MacBook Pro"
            ),
            # Expenses
            Transaction(
                amount=Decimal("18000.00"),
                date=today - timedelta(days=20),
                description="Apartment Rent Payment",
                transaction_type=TransactionType.EXPENSE,
                account_id=acc_sbi,
                bucket_id=b_monthly_id,
                category_id=cat_map.get("rent", default_cat),
                notes="Paid from monthly budget"
            ),
            Transaction(
                amount=Decimal("3450.00"),
                date=today - timedelta(days=14),
                description="Grocery Shopping at Supermarket",
                transaction_type=TransactionType.EXPENSE,
                account_id=acc_sbi,
                bucket_id=b_monthly_id,
                category_id=cat_map.get("food", default_cat),
                notes="Weekly groceries"
            ),
            Transaction(
                amount=Decimal("1500.00"),
                date=today - timedelta(days=10),
                description="Petrol Refill at Shell",
                transaction_type=TransactionType.EXPENSE,
                account_id=acc_sbi,
                bucket_id=b_monthly_id,
                category_id=cat_map.get("petrol", default_cat),
                notes="Commute fuel"
            ),
            Transaction(
                amount=Decimal("4500.00"),
                date=today - timedelta(days=8),
                description="Flight Booking Deposit",
                transaction_type=TransactionType.EXPENSE,
                account_id=acc_hdfc,
                bucket_id=b_travel_id,
                category_id=cat_map.get("luxuries", default_cat),
                notes="Advance booking for Japan trip"
            ),
            Transaction(
                amount=Decimal("850.00"),
                date=today - timedelta(days=5),
                description="Team Dinner",
                transaction_type=TransactionType.EXPENSE,
                account_id=acc_cash,
                bucket_id=b_monthly_id,
                category_id=cat_map.get("food", default_cat),
                notes="Paid with cash"
            ),
            Transaction(
                amount=Decimal("799.00"),
                date=today - timedelta(days=2),
                description="Netflix Subscription",
                transaction_type=TransactionType.EXPENSE,
                account_id=acc_sbi,
                bucket_id=b_monthly_id,
                category_id=cat_map.get("luxuries", default_cat),
                notes="Monthly subscription"
            )
        ]

        db.add_all(mock_transactions)

        # 5. Debts
        mock_debts = [
            Debt(
                person_name="Rahul Sharma",
                type=DebtType.LENT,
                amount=Decimal("2500.00"),
                account_id=acc_cash,
                description="Dinner split & cab fare",
                is_settled=False
            ),
            Debt(
                person_name="Amit Verma",
                type=DebtType.BORROWED,
                amount=Decimal("3500.00"),
                account_id=acc_sbi,
                description="Emergency cash borrowed",
                is_settled=False
            )
        ]

        db.add_all(mock_debts)
        db.commit()

        print(f"Successfully seeded mock data with {len(mock_transactions)} transactions, {len(mock_debts)} debts, and 5 Savings Buckets!")

if __name__ == "__main__":
    seed()
