import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddBookingsTenantStartsAtReportIndex1786000000000
  implements MigrationInterface
{
  name = 'AddBookingsTenantStartsAtReportIndex1786000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_bookings_tenant_starts_at" ON "bookings" ("tenant_id", "starts_at")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_bookings_tenant_starts_at"`,
    );
  }
}
