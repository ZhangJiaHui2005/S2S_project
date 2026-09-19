-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "MembershipPaymentMethod" AS ENUM ('PAYOS', 'KARMA');

-- CreateEnum
CREATE TYPE "MembershipPlanType" AS ENUM ('KARMA_PASS');

-- CreateEnum
CREATE TYPE "MembershipStatus" AS ENUM ('PENDING', 'ACTIVE', 'EXPIRED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PaymentPurpose" AS ENUM ('KARMA_TOPUP', 'MEMBERSHIP');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'SUCCESS', 'FAILED', 'CANCELLED');

-- CreateTable
CREATE TABLE "user" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "image" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "session" (
    "id" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "token" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "userId" TEXT NOT NULL,

    CONSTRAINT "session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "account" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "idToken" TEXT,
    "accessTokenExpiresAt" TIMESTAMP(3),
    "refreshTokenExpiresAt" TIMESTAMP(3),
    "scope" TEXT,
    "password" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification" (
    "id" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "verification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Admin" (
    "admin_id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "last_login_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Admin_pkey" PRIMARY KEY ("admin_id")
);

-- CreateTable
CREATE TABLE "AdminNotification" (
    "notification_id" SERIAL NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "user_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "read_at" TIMESTAMP(3),

    CONSTRAINT "AdminNotification_pkey" PRIMARY KEY ("notification_id")
);

-- CreateTable
CREATE TABLE "BorrowRequest" (
    "request_id" SERIAL NOT NULL,
    "borrower_id" INTEGER NOT NULL,
    "item_id" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BorrowRequest_pkey" PRIMARY KEY ("request_id")
);

-- CreateTable
CREATE TABLE "Category" (
    "category_id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "icon" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("category_id")
);

-- CreateTable
CREATE TABLE "EscrowLog" (
    "escrow_id" SERIAL NOT NULL,
    "trans_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "locked_karma" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'LOCKED',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EscrowLog_pkey" PRIMARY KEY ("escrow_id")
);

-- CreateTable
CREATE TABLE "Insurance_Fund_Logs" (
    "log_id" UUID NOT NULL,
    "amount_karma" INTEGER NOT NULL,
    "rate_pct" DECIMAL(65,30) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "trans_id" INTEGER NOT NULL,

    CONSTRAINT "Insurance_Fund_Logs_pkey" PRIMARY KEY ("log_id")
);

-- CreateTable
CREATE TABLE "Item" (
    "item_id" SERIAL NOT NULL,
    "owner_id" INTEGER NOT NULL,
    "category_id" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "karma_value" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'AVAILABLE',
    "location" TEXT,
    "image_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Item_pkey" PRIMARY KEY ("item_id")
);

-- CreateTable
CREATE TABLE "Level" (
    "level_id" SERIAL NOT NULL,
    "level_name" TEXT NOT NULL,
    "min_karma" INTEGER NOT NULL,
    "max_karma" INTEGER NOT NULL,
    "borrow_limit" INTEGER NOT NULL,
    "deposit_discount_pct" DOUBLE PRECISION NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Level_pkey" PRIMARY KEY ("level_id")
);

-- CreateTable
CREATE TABLE "Memberships" (
    "membership_id" UUID NOT NULL,
    "user_id" INTEGER NOT NULL,
    "payment_id" UUID,
    "plan_type" "MembershipPlanType" NOT NULL,
    "payment_method" "MembershipPaymentMethod" NOT NULL,
    "karma_cost" INTEGER,
    "price_vnd" INTEGER,
    "start_at" TIMESTAMP(3) NOT NULL,
    "end_at" TIMESTAMP(3) NOT NULL,
    "status" "MembershipStatus" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Memberships_pkey" PRIMARY KEY ("membership_id")
);

-- CreateTable
CREATE TABLE "Payments" (
    "payment_id" UUID NOT NULL,
    "user_id" INTEGER NOT NULL,
    "amount_vnd" INTEGER NOT NULL,
    "karma_received" INTEGER NOT NULL DEFAULT 0,
    "payment_gateway" TEXT NOT NULL,
    "transaction_ref" TEXT NOT NULL,
    "purpose" "PaymentPurpose" NOT NULL,
    "status" "PaymentStatus" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paid_at" TIMESTAMP(3),
    "archived_at" TIMESTAMP(3),

    CONSTRAINT "Payments_pkey" PRIMARY KEY ("payment_id")
);

-- CreateTable
CREATE TABLE "Transaction" (
    "borrower_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deposit_amount" INTEGER NOT NULL DEFAULT 0,
    "due_date" TIMESTAMP(3) NOT NULL,
    "item_id" INTEGER NOT NULL,
    "karma_amount" INTEGER NOT NULL,
    "lender_id" INTEGER NOT NULL,
    "qr_code_hash" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "updated_at" TIMESTAMP(3) NOT NULL,
    "trans_id" SERIAL NOT NULL,

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("trans_id")
);

-- CreateTable
CREATE TABLE "User" (
    "user_id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT,
    "google_id" TEXT,
    "full_name" TEXT NOT NULL,
    "avatar" TEXT,
    "karma_balance" INTEGER NOT NULL DEFAULT 100,
    "level_id" INTEGER NOT NULL DEFAULT 1,
    "is_verified" BOOLEAN NOT NULL DEFAULT true,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "last_active_at" TIMESTAMP(3),

    CONSTRAINT "User_pkey" PRIMARY KEY ("user_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_email_key" ON "user"("email");

-- CreateIndex
CREATE UNIQUE INDEX "session_token_key" ON "session"("token");

-- CreateIndex
CREATE INDEX "session_userId_idx" ON "session"("userId");

-- CreateIndex
CREATE INDEX "account_userId_idx" ON "account"("userId");

-- CreateIndex
CREATE INDEX "verification_identifier_idx" ON "verification"("identifier");

-- CreateIndex
CREATE UNIQUE INDEX "Admin_email_key" ON "Admin"("email");

-- CreateIndex
CREATE INDEX "BorrowRequest_created_at_idx" ON "BorrowRequest"("created_at");

-- CreateIndex
CREATE INDEX "BorrowRequest_status_idx" ON "BorrowRequest"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Category_name_key" ON "Category"("name");

-- CreateIndex
CREATE INDEX "Item_category_id_idx" ON "Item"("category_id");

-- CreateIndex
CREATE INDEX "Item_created_at_idx" ON "Item"("created_at");

-- CreateIndex
CREATE INDEX "Item_owner_id_idx" ON "Item"("owner_id");

-- CreateIndex
CREATE INDEX "Item_status_idx" ON "Item"("status");

-- CreateIndex
CREATE INDEX "Item_type_idx" ON "Item"("type");

-- CreateIndex
CREATE UNIQUE INDEX "Memberships_payment_id_key" ON "Memberships"("payment_id");

-- CreateIndex
CREATE UNIQUE INDEX "Payments_transaction_ref_key" ON "Payments"("transaction_ref");

-- CreateIndex
CREATE INDEX "Payments_archived_at_idx" ON "Payments"("archived_at");

-- CreateIndex
CREATE INDEX "Transaction_borrower_id_idx" ON "Transaction"("borrower_id");

-- CreateIndex
CREATE INDEX "Transaction_item_id_idx" ON "Transaction"("item_id");

-- CreateIndex
CREATE INDEX "Transaction_lender_id_idx" ON "Transaction"("lender_id");

-- CreateIndex
CREATE INDEX "Transaction_status_idx" ON "Transaction"("status");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_google_id_key" ON "User"("google_id");

-- AddForeignKey
ALTER TABLE "session" ADD CONSTRAINT "session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "account" ADD CONSTRAINT "account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BorrowRequest" ADD CONSTRAINT "BorrowRequest_borrower_id_fkey" FOREIGN KEY ("borrower_id") REFERENCES "User"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BorrowRequest" ADD CONSTRAINT "BorrowRequest_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "Item"("item_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EscrowLog" ADD CONSTRAINT "EscrowLog_trans_id_fkey" FOREIGN KEY ("trans_id") REFERENCES "Transaction"("trans_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EscrowLog" ADD CONSTRAINT "EscrowLog_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Item" ADD CONSTRAINT "Item_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "Category"("category_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Item" ADD CONSTRAINT "Item_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "User"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Memberships" ADD CONSTRAINT "Memberships_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "Payments"("payment_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Memberships" ADD CONSTRAINT "Memberships_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payments" ADD CONSTRAINT "Payments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_borrower_id_fkey" FOREIGN KEY ("borrower_id") REFERENCES "User"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "Item"("item_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_lender_id_fkey" FOREIGN KEY ("lender_id") REFERENCES "User"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_level_id_fkey" FOREIGN KEY ("level_id") REFERENCES "Level"("level_id") ON DELETE RESTRICT ON UPDATE CASCADE;

