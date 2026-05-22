import { MigrationInterface, QueryRunner } from 'typeorm';
import { dropForeignKeyOnColumn } from './helpers/drop-fk-on-column';

export class BookingUseTenantProfessional1779300000000
  implements MigrationInterface
{
  name = 'BookingUseTenantProfessional1779300000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "tenant_professional_id" uuid`,
    );

    await queryRunner.query(`
      UPDATE "bookings" b
      SET "tenant_professional_id" = tp."id"
      FROM "barber_profiles" bp
      INNER JOIN "tenant_users" tu ON tu."id" = bp."tenant_user_id"
      INNER JOIN "professional_profiles" pp ON pp."user_id" = tu."user_id"
        AND (
          (bp."deletedAt" IS NULL AND pp."deletedAt" IS NULL)
          OR (bp."deletedAt" IS NOT NULL AND pp."deletedAt" IS NOT NULL)
        )
      INNER JOIN "tenant_professionals" tp
        ON tp."tenant_id" = bp."tenant_id"
        AND tp."professional_profile_id" = pp."id"
      WHERE b."barber_profile_id" = bp."id"
        AND b."tenant_professional_id" IS NULL
    `);

    await queryRunner.query(
      `ALTER TABLE "bookings" ALTER COLUMN "tenant_professional_id" SET NOT NULL`,
    );

    await dropForeignKeyOnColumn(queryRunner, 'bookings', 'barber_profile_id');

    await queryRunner.query(
      `ALTER TABLE "bookings" DROP CONSTRAINT IF EXISTS "FK_bookings_tenant_professional"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_bookings_barber_starts"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."UQ_bookings_barber_starts_active"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."UQ_bookings_barber_starts_active"`,
    );
    await queryRunner.query(
      `ALTER TABLE "bookings" DROP COLUMN IF EXISTS "barber_profile_id"`,
    );

    await queryRunner.query(
      `ALTER TABLE "bookings" ADD CONSTRAINT "FK_bookings_tenant_professional" FOREIGN KEY ("tenant_professional_id") REFERENCES "tenant_professionals"("id") ON DELETE CASCADE`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_bookings_tenant_professional_starts" ON "bookings" ("tenant_professional_id", "starts_at")`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS "UQ_bookings_tenant_professional_starts_active" ON "bookings" ("tenant_professional_id", "starts_at") WHERE status IN ('DRAFT','CONFIRMED')`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."UQ_bookings_tenant_professional_starts_active"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_bookings_tenant_professional_starts"`,
    );
    await queryRunner.query(
      `ALTER TABLE "bookings" DROP CONSTRAINT IF EXISTS "FK_bookings_tenant_professional"`,
    );
    await queryRunner.query(
      `ALTER TABLE "bookings" ADD "barber_profile_id" uuid`,
    );
    await queryRunner.query(
      `ALTER TABLE "bookings" DROP COLUMN "tenant_professional_id"`,
    );
  }
}
