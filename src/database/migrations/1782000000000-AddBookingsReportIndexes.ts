import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddBookingsReportIndexes1782000000000 implements MigrationInterface {
  name = 'AddBookingsReportIndexes1782000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_bookings_status" ON "bookings" ("status")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_bookings_created_at" ON "bookings" ("created_at")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_bookings_created_at"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_bookings_status"`,
    );
  }
}
