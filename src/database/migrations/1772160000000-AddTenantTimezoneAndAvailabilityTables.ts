import { MigrationInterface, QueryRunner } from 'typeorm';
export class AddTenantTimezoneAndAvailabilityTables1772160000000 implements MigrationInterface {
  name = 'AddTenantTimezoneAndAvailabilityTables1772160000000';
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "tenants" ADD "timezone" character varying(64) NOT NULL DEFAULT 'America/Sao_Paulo'`,
    );
    await queryRunner.query(`CREATE TABLE "working_hours" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "tenant_id" uuid NOT NULL,
        "barber_profile_id" uuid NOT NULL,
        "day_of_week" character varying(16) NOT NULL,
        "is_active" boolean NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "deletedAt" TIMESTAMP,
        CONSTRAINT "PK_working_hours_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_working_hours_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_working_hours_barber_profile" FOREIGN KEY ("barber_profile_id") REFERENCES "barber_profiles"("id") ON DELETE CASCADE
      )`);
    await queryRunner.query(
      `CREATE INDEX "IDX_working_hours_tenant_id" ON "working_hours" ("tenant_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_working_hours_barber_profile_id" ON "working_hours" ("barber_profile_id")`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_working_hours_barber_day_active" ON "working_hours" ("barber_profile_id", "day_of_week") WHERE "deletedAt" IS NULL`,
    );
    await queryRunner.query(`CREATE TABLE "working_hours_periods" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "working_hours_id" uuid NOT NULL,
        "start_time" character varying(5) NOT NULL,
        "end_time" character varying(5) NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "deletedAt" TIMESTAMP,
        CONSTRAINT "PK_working_hours_periods_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_working_hours_periods_wh" FOREIGN KEY ("working_hours_id") REFERENCES "working_hours"("id") ON DELETE CASCADE
      )`);
    await queryRunner.query(
      `CREATE INDEX "IDX_working_hours_periods_wh_id" ON "working_hours_periods" ("working_hours_id")`,
    );
    await queryRunner.query(`CREATE TABLE "barber_time_offs" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "tenant_id" uuid NOT NULL,
        "barber_profile_id" uuid NOT NULL,
        "date" date NOT NULL,
        "start_time" character varying(5),
        "end_time" character varying(5),
        "reason" character varying(32) NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "deletedAt" TIMESTAMP,
        CONSTRAINT "PK_barber_time_offs_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_barber_time_offs_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_barber_time_offs_barber_profile" FOREIGN KEY ("barber_profile_id") REFERENCES "barber_profiles"("id") ON DELETE CASCADE
      )`);
    await queryRunner.query(
      `CREATE INDEX "IDX_barber_time_offs_tenant_id" ON "barber_time_offs" ("tenant_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_barber_time_offs_barber_date" ON "barber_time_offs" ("barber_profile_id", "date")`,
    );
    await queryRunner.query(`CREATE TABLE "barber_availability_blocks" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "tenant_id" uuid NOT NULL,
        "barber_profile_id" uuid NOT NULL,
        "date" date NOT NULL,
        "start_time" character varying(5) NOT NULL,
        "end_time" character varying(5) NOT NULL,
        "reason" character varying(32) NOT NULL,
        "booking_id" uuid,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "deletedAt" TIMESTAMP,
        CONSTRAINT "PK_barber_availability_blocks_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_barber_availability_blocks_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_barber_availability_blocks_barber_profile" FOREIGN KEY ("barber_profile_id") REFERENCES "barber_profiles"("id") ON DELETE CASCADE
      )`);
    await queryRunner.query(
      `CREATE INDEX "IDX_barber_availability_blocks_tenant_id" ON "barber_availability_blocks" ("tenant_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_barber_availability_blocks_barber_date" ON "barber_availability_blocks" ("barber_profile_id", "date")`,
    );
    await queryRunner.query(`CREATE TABLE "barber_services" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "tenant_id" uuid NOT NULL,
        "barber_profile_id" uuid NOT NULL,
        "service_id" uuid NOT NULL,
        "is_active" boolean NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "deletedAt" TIMESTAMP,
        CONSTRAINT "PK_barber_services_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_barber_services_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_barber_services_barber_profile" FOREIGN KEY ("barber_profile_id") REFERENCES "barber_profiles"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_barber_services_service" FOREIGN KEY ("service_id") REFERENCES "services"("id") ON DELETE CASCADE
      )`);
    await queryRunner.query(
      `CREATE INDEX "IDX_barber_services_tenant_id" ON "barber_services" ("tenant_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_barber_services_barber_profile_id" ON "barber_services" ("barber_profile_id")`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_barber_services_barber_service_active" ON "barber_services" ("barber_profile_id", "service_id") WHERE "deletedAt" IS NULL`,
    );
  }
  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "public"."UQ_barber_services_barber_service_active"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_barber_services_barber_profile_id"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_barber_services_tenant_id"`,
    );
    await queryRunner.query(`DROP TABLE "barber_services"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_barber_availability_blocks_barber_date"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_barber_availability_blocks_tenant_id"`,
    );
    await queryRunner.query(`DROP TABLE "barber_availability_blocks"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_barber_time_offs_barber_date"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_barber_time_offs_tenant_id"`,
    );
    await queryRunner.query(`DROP TABLE "barber_time_offs"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_working_hours_periods_wh_id"`,
    );
    await queryRunner.query(`DROP TABLE "working_hours_periods"`);
    await queryRunner.query(
      `DROP INDEX "public"."UQ_working_hours_barber_day_active"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_working_hours_barber_profile_id"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_working_hours_tenant_id"`,
    );
    await queryRunner.query(`DROP TABLE "working_hours"`);
    await queryRunner.query(`ALTER TABLE "tenants" DROP COLUMN "timezone"`);
  }
}
