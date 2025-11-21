-- DropIndex
DROP INDEX IF EXISTS "magazine_issues_year_month_issue_number_key";

-- DropIndex
DROP INDEX IF EXISTS "magazine_issues_year_month_idx";

-- AlterTable
ALTER TABLE "magazine_issues" DROP COLUMN IF EXISTS "year",
DROP COLUMN IF EXISTS "month",
DROP COLUMN IF EXISTS "description_kz",
DROP COLUMN IF EXISTS "description_ru";
