import uuid
from datetime import datetime
from sqlalchemy import (
    Column, String, Float, Integer, Boolean, DateTime, ForeignKey, Text, Index
)
from sqlalchemy.orm import declarative_base, relationship

Base = declarative_base()

class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    email = Column(String, unique=True, nullable=False, index=True)
    password_hash = Column(String, nullable=False)
    full_name = Column(String, nullable=False)
    role = Column(String, default="user")
    created_at = Column(DateTime, default=datetime.utcnow)

    profile = relationship("UserProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    accounts = relationship("Account", back_populates="user", cascade="all, delete-orphan")
    transactions = relationship("Transaction", back_populates="user", cascade="all, delete-orphan")
    budgets = relationship("Budget", back_populates="user", cascade="all, delete-orphan")
    savings_goals = relationship("SavingsGoal", back_populates="user", cascade="all, delete-orphan")
    recurring = relationship("RecurringTransaction", back_populates="user", cascade="all, delete-orphan")
    notifications = relationship("Notification", back_populates="user", cascade="all, delete-orphan")


class UserProfile(Base):
    __tablename__ = "user_profiles"

    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    currency = Column(String, default="INR")
    currency_symbol = Column(String, default="₹")
    monthly_income_target = Column(Float, default=75000.0)
    monthly_savings_target = Column(Float, default=20000.0)
    theme_preference = Column(String, default="dark")

    user = relationship("User", back_populates="profile")


class Account(Base):
    __tablename__ = "accounts"

    id = Column(String, primary_key=True, default=lambda: f"acc_{uuid.uuid4().hex[:8]}")
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String, nullable=False)
    type = Column(String, nullable=False) # savings, checking, credit_card, cash, investment, digital_wallet
    opening_balance = Column(Float, default=0.0)
    current_balance = Column(Float, default=0.0)
    currency = Column(String, default="INR")
    account_number = Column(String, nullable=True)
    color = Column(String, default="#10B981")
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="accounts")
    transactions = relationship("Transaction", back_populates="account", cascade="all, delete-orphan")


class Category(Base):
    __tablename__ = "categories"

    id = Column(String, primary_key=True)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=True)
    name = Column(String, nullable=False)
    type = Column(String, nullable=False) # income, expense
    icon = Column(String, default="Tag")
    color = Column(String, default="#10B981")
    is_system = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)


class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(String, primary_key=True, default=lambda: f"tx_{uuid.uuid4().hex[:10]}")
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    account_id = Column(String, ForeignKey("accounts.id", ondelete="CASCADE"), nullable=False, index=True)
    category_id = Column(String, ForeignKey("categories.id"), nullable=False, index=True)
    type = Column(String, nullable=False) # income, expense, transfer
    amount = Column(Float, nullable=False)
    date = Column(String, nullable=False, index=True) # YYYY-MM-DD
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    merchant = Column(String, nullable=True)
    payment_method = Column(String, default="UPI")
    tags = Column(Text, nullable=True) # JSON
    is_recurring = Column(Boolean, default=False)
    anomaly_flag = Column(Boolean, default=False)
    anomaly_score = Column(Float, default=0.0)
    anomaly_reason = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="transactions")
    account = relationship("Account", back_populates="transactions")


class Budget(Base):
    __tablename__ = "budgets"

    id = Column(String, primary_key=True, default=lambda: f"bgt_{uuid.uuid4().hex[:8]}")
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    category_id = Column(String, ForeignKey("categories.id"), nullable=False)
    period_month = Column(String, nullable=False, index=True) # YYYY-MM
    limit_amount = Column(Float, nullable=False)
    alert_threshold_pct = Column(Float, default=80.0)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="budgets")


class SavingsGoal(Base):
    __tablename__ = "savings_goals"

    id = Column(String, primary_key=True, default=lambda: f"goal_{uuid.uuid4().hex[:8]}")
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String, nullable=False)
    target_amount = Column(Float, nullable=False)
    current_amount = Column(Float, default=0.0)
    target_date = Column(String, nullable=False)
    category = Column(String, default="General")
    color = Column(String, default="#38BDF8")
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="savings_goals")


class RecurringTransaction(Base):
    __tablename__ = "recurring_transactions"

    id = Column(String, primary_key=True, default=lambda: f"rec_{uuid.uuid4().hex[:8]}")
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    account_id = Column(String, ForeignKey("accounts.id", ondelete="CASCADE"), nullable=False)
    category_id = Column(String, ForeignKey("categories.id"), nullable=False)
    title = Column(String, nullable=False)
    amount = Column(Float, nullable=False)
    type = Column(String, default="expense")
    frequency = Column(String, default="monthly")
    start_date = Column(String, nullable=False)
    end_date = Column(String, nullable=True)
    next_due_date = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="recurring")


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    type = Column(String, nullable=False)
    title = Column(String, nullable=False)
    message = Column(Text, nullable=False)
    severity = Column(String, default="info")
    is_read = Column(Boolean, default=False)
    link = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="notifications")
