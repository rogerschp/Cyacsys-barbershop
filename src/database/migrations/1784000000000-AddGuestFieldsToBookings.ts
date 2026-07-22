import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddGuestFieldsToBookings1784000000000
  implements MigrationInterface
{
  name = 'AddGuestFieldsToBookings1784000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "bookings" ADD "guest_name" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "bookings" ADD "guest_phone" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "bookings" ADD "guest_email" character varying`,
    );

    await queryRunner.query(`
      ALTER TABLE "bookings"
      ADD CONSTRAINT "CHK_bookings_customer_xor"
      CHECK (
        (
          "client_user_id" IS NOT NULL
          AND "guest_phone" IS NULL
          AND "guest_name" IS NULL
          AND "guest_email" IS NULL
        )
        OR
        (
          "client_user_id" IS NULL
          AND "guest_phone" IS NOT NULL
          AND "guest_name" IS NOT NULL
        )
        OR
        (
          "client_user_id" IS NULL
          AND "guest_phone" IS NULL
          AND "guest_name" IS NULL
          AND "guest_email" IS NULL
        )
      )
    `);

    await queryRunner.query(
      `CREATE INDEX "IDX_bookings_tenant_guest_phone" ON "bookings" ("tenant_id", "guest_phone")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_bookings_tenant_client_user" ON "bookings" ("tenant_id", "client_user_id")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_bookings_tenant_client_user"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_bookings_tenant_guest_phone"`,
    );
    await queryRunner.query(
      `ALTER TABLE "bookings" DROP CONSTRAINT "CHK_bookings_customer_xor"`,
    );
    await queryRunner.query(
      `ALTER TABLE "bookings" DROP COLUMN "guest_email"`,
    );
    await queryRunner.query(
      `ALTER TABLE "bookings" DROP COLUMN "guest_phone"`,
    );
    await queryRunner.query(
      `ALTER TABLE "bookings" DROP COLUMN "guest_name"`,
    );
  }
}
