import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddClientUserIdToBookings1779500000000
  implements MigrationInterface
{
  name = 'AddClientUserIdToBookings1779500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "client_user_id" uuid`,
    );
    await queryRunner.query(
      `ALTER TABLE "bookings" ADD CONSTRAINT "FK_bookings_client_user" FOREIGN KEY ("client_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_bookings_client_user_id" ON "bookings" ("client_user_id")`,
    );
    await queryRunner.query(`
      UPDATE "bookings" b
      SET "client_user_id" = tu."user_id"
      FROM "tenant_users" tu
      WHERE b."created_by_tenant_user_id" = tu."id"
        AND b."client_user_id" IS NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_bookings_client_user_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "bookings" DROP CONSTRAINT IF EXISTS "FK_bookings_client_user"`,
    );
    await queryRunner.query(
      `ALTER TABLE "bookings" DROP COLUMN IF EXISTS "client_user_id"`,
    );
  }
}
