-- Remove Better Auth specific artifacts for local auth migration
ALTER TABLE "session" DROP COLUMN IF EXISTS "impersonated_by";

DROP TABLE IF EXISTS "account";
DROP TABLE IF EXISTS "verification";
