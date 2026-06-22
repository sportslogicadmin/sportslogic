-- AlterTable Grade: add Found Money fields and settlement tracking
ALTER TABLE "Grade" ADD COLUMN "userParlayDecimal" DOUBLE PRECISION;
ALTER TABLE "Grade" ADD COLUMN "bestParlayDecimal" DOUBLE PRECISION;
ALTER TABLE "Grade" ADD COLUMN "bestParlayOdds"    INTEGER;
ALTER TABLE "Grade" ADD COLUMN "foundMoney"        DOUBLE PRECISION;
ALTER TABLE "Grade" ADD COLUMN "foundMoneyPercent" DOUBLE PRECISION;
ALTER TABLE "Grade" ADD COLUMN "stake"             DOUBLE PRECISION;
ALTER TABLE "Grade" ADD COLUMN "settled"           BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Grade" ADD COLUMN "won"               BOOLEAN;

-- AlterTable Leg: add per-leg odds intelligence fields
ALTER TABLE "Leg" ADD COLUMN "bestOdds"    INTEGER;
ALTER TABLE "Leg" ADD COLUMN "fairOdds"    INTEGER;
ALTER TABLE "Leg" ADD COLUMN "bestBook"    TEXT;
ALTER TABLE "Leg" ADD COLUMN "trueProb"    DOUBLE PRECISION;
ALTER TABLE "Leg" ADD COLUMN "impliedProb" DOUBLE PRECISION;
