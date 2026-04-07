import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateBookingsTable1772170000000 implements MigrationInterface {
  name = 'CreateBookingsTable1772170000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."bookings_status_enum" AS ENUM('DRAFT', 'CONFIRMED', 'CANCELLED')`,
    );

    await queryRunner.query(
      `CREATE TABLE "bookings" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "tenant_id" uuid NOT NULL,
        "barber_profile_id" uuid NOT NULL,
        "service_id" uuid NOT NULL,
        "starts_at" TIMESTAMP WITH TIME ZONE NOT NULL,
        "ends_at" TIMESTAMP WITH TIME ZONE NOT NULL,
        "status" "public"."bookings_status_enum" NOT NULL DEFAULT 'DRAFT',
        "created_by_tenant_user_id" uuid,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_bookings_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_bookings_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_bookings_barber_profile" FOREIGN KEY ("barber_profile_id") REFERENCES "barber_profiles"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_bookings_service" FOREIGN KEY ("service_id") REFERENCES "services"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_bookings_created_by_tenant_user" FOREIGN KEY ("created_by_tenant_user_id") REFERENCES "tenant_users"("id") ON DELETE SET NULL
      )`,
    );

    await queryRunner.query(
      `CREATE INDEX "IDX_bookings_tenant_id" ON "bookings" ("tenant_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_bookings_barber_starts" ON "bookings" ("barber_profile_id", "starts_at")`,
    );

    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_bookings_barber_starts_active" ON "bookings" ("barber_profile_id", "starts_at") WHERE status IN ('DRAFT','CONFIRMED')`,
    );

    await queryRunner.query(
      `ALTER TABLE "barber_availability_blocks" ADD CONSTRAINT "FK_barber_availability_blocks_booking" FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE SET NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "barber_availability_blocks" DROP CONSTRAINT "FK_barber_availability_blocks_booking"`,
    );
    await queryRunner.query(`DROP INDEX "public"."UQ_bookings_barber_starts_active"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_bookings_barber_starts"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_bookings_tenant_id"`);
    await queryRunner.query(`DROP TABLE "bookings"`);
    await queryRunner.query(`DROP TYPE "public"."bookings_status_enum"`);
  }
}
