BEGIN;

-- These are existing domain tables, maintained before Prisma migrations were added.
ALTER TABLE "Admin" ADD COLUMN "session_version" INTEGER NOT NULL DEFAULT 0;
CREATE TABLE "AdminSession" (
  "token_hash" TEXT PRIMARY KEY,
  "admin_id" INTEGER NOT NULL REFERENCES "Admin"("admin_id") ON DELETE CASCADE ON UPDATE CASCADE,
  "version" INTEGER NOT NULL,
  "expires_at" TIMESTAMP(3) NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX "AdminSession_admin_id_idx" ON "AdminSession"("admin_id");
CREATE INDEX "AdminSession_expires_at_idx" ON "AdminSession"("expires_at");
CREATE TABLE "AdminLoginAttempt" (
  "key" TEXT PRIMARY KEY,
  "count" INTEGER NOT NULL,
  "expires_at" TIMESTAMP(3) NOT NULL
);
CREATE INDEX "AdminLoginAttempt_expires_at_idx" ON "AdminLoginAttempt"("expires_at");

ALTER TABLE "User" ADD COLUMN "auth_user_id" TEXT;
CREATE UNIQUE INDEX "User_auth_user_id_key" ON "User"("auth_user_id");
ALTER TABLE "User" ADD CONSTRAINT "User_auth_user_id_fkey"
  FOREIGN KEY ("auth_user_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Fail atomically instead of granting an unverified account ownership of existing data.
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM "user" a JOIN "User" b ON lower(a.email) = lower(b.email)) THEN
    RAISE EXCEPTION 'Auth/domain email collision: review ownership before linking existing profiles';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM "Level" WHERE level_id = 1) THEN
    RAISE EXCEPTION 'Default membership Level 1 must exist before creating user profiles';
  END IF;
END $$;

INSERT INTO "User" ("auth_user_id", "email", "full_name", "avatar", "is_verified", "karma_balance", "level_id", "status", "created_at", "updated_at")
SELECT "id", "email", "name", "image", "emailVerified", 100, 1, 'ACTIVE', "createdAt", "updatedAt"
FROM "user";

COMMIT;
