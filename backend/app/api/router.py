from fastapi import APIRouter
from app.api.v1.transactions import router as transactions_router
from app.api.v1.accounts import router as accounts_router
from app.api.v1.categories import router as categories_router
from app.api.v1.debts import router as debts_router
from app.api.v1.buckets import router as buckets_router

api_router = APIRouter()
api_router.include_router(transactions_router, prefix="/transactions", tags=["transactions"])
api_router.include_router(accounts_router, prefix="/accounts", tags=["accounts"])
api_router.include_router(categories_router, prefix="/categories", tags=["categories"])
api_router.include_router(debts_router, prefix="/debts", tags=["debts"])
api_router.include_router(buckets_router, prefix="/buckets", tags=["buckets"])
