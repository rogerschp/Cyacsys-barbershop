import { MigrationInterface, QueryRunner } from 'typeorm';

export class AvailabilityUseTenantProfessional1779200000000
  implements MigrationInterface
{
  name = 'AvailabilityUseTenantProfessional1779200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "working_hours" ADD "tenant_professional_id" uuid`,
    );
    await queryRunner.query(
      `ALTER TABLE "barber_services" ADD "tenant_professional_id" uuid`,
    );
    await queryRunner.query(
      `ALTER TABLE "barber_time_offs" ADD "tenant_professional_id" uuid`,
    );
    await queryRunner.query(
      `ALTER TABLE "barber_availability_blocks" ADD "tenant_professional_id" uuid`,
    );

    const backfill = `
      UPDATE "{{TABLE}}" t
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
      WHERE t."barber_profile_id" = bp."id"
    `;

    for (const table of [
      'working_hours',
      'barber_services',
      'barber_time_offs',
      'barber_availability_blocks',
    ]) {
      await queryRunner.query(backfill.replace(/\{\{TABLE\}\}/g, table));
    }

    await queryRunner.query(
      `ALTER TABLE "working_hours" ALTER COLUMN "tenant_professional_id" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "barber_services" ALTER COLUMN "tenant_professional_id" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "barber_time_offs" ALTER COLUMN "tenant_professional_id" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "barber_availability_blocks" ALTER COLUMN "tenant_professional_id" SET NOT NULL`,
    );

    await queryRunner.query(
      `ALTER TABLE "working_hours" DROP CONSTRAINT "FK_working_hours_barber_profile"`,
    );
    await queryRunner.query(
      `ALTER TABLE "barber_services" DROP CONSTRAINT "FK_barber_services_barber_profile"`,
    );
    await queryRunner.query(
      `ALTER TABLE "barber_time_offs" DROP CONSTRAINT "FK_barber_time_offs_barber_profile"`,
    );
    await queryRunner.query(
      `ALTER TABLE "barber_availability_blocks" DROP CONSTRAINT "FK_barber_availability_blocks_barber_profile"`,
    );

    await queryRunner.query(
      `ALTER TABLE "working_hours" ADD CONSTRAINT "FK_working_hours_tenant_professional" FOREIGN KEY ("tenant_professional_id") REFERENCES "tenant_professionals"("id") ON DELETE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "barber_services" ADD CONSTRAINT "FK_barber_services_tenant_professional" FOREIGN KEY ("tenant_professional_id") REFERENCES "tenant_professionals"("id") ON DELETE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "barber_time_offs" ADD CONSTRAINT "FK_barber_time_offs_tenant_professional" FOREIGN KEY ("tenant_professional_id") REFERENCES "tenant_professionals"("id") ON DELETE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "barber_availability_blocks" ADD CONSTRAINT "FK_barber_availability_blocks_tenant_professional" FOREIGN KEY ("tenant_professional_id") REFERENCES "tenant_professionals"("id") ON DELETE CASCADE`,
    );

    await queryRunner.query(
      `DROP INDEX "public"."IDX_working_hours_barber_profile_id"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."UQ_working_hours_barber_day_active"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_barber_services_barber_profile_id"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."UQ_barber_services_barber_service_active"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_barber_time_offs_barber_date"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_barber_availability_blocks_barber_date"`,
    );

    await queryRunner.query(
      `ALTER TABLE "working_hours" DROP COLUMN "barber_profile_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "barber_services" DROP COLUMN "barber_profile_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "barber_time_offs" DROP COLUMN "barber_profile_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "barber_availability_blocks" DROP COLUMN "barber_profile_id"`,
    );

    await queryRunner.query(
      `ALTER TABLE "barber_services" RENAME TO "professional_service_links"`,
    );
    await queryRunner.query(
      `ALTER TABLE "barber_time_offs" RENAME TO "professional_time_offs"`,
    );
    await queryRunner.query(
      `ALTER TABLE "barber_availability_blocks" RENAME TO "professional_availability_blocks"`,
    );

    await queryRunner.query(
      `CREATE INDEX "IDX_working_hours_tenant_professional_id" ON "working_hours" ("tenant_professional_id")`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_working_hours_tenant_professional_day_active" ON "working_hours" ("tenant_professional_id", "day_of_week") WHERE "deletedAt" IS NULL`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_professional_service_links_tenant_professional_id" ON "professional_service_links" ("tenant_professional_id")`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_professional_service_links_tp_service_active" ON "professional_service_links" ("tenant_professional_id", "service_id") WHERE "deletedAt" IS NULL`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_professional_time_offs_tp_date" ON "professional_time_offs" ("tenant_professional_id", "date")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_professional_availability_blocks_tp_date" ON "professional_availability_blocks" ("tenant_professional_id", "date")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "professional_availability_blocks" RENAME TO "barber_availability_blocks"`,
    );
    await queryRunner.query(
      `ALTER TABLE "professional_time_offs" RENAME TO "barber_time_offs"`,
    );
    await queryRunner.query(
      `ALTER TABLE "professional_service_links" RENAME TO "barber_services"`,
    );

    await queryRunner.query(
      `ALTER TABLE "working_hours" ADD "barber_profile_id" uuid`,
    );
    await queryRunner.query(
      `ALTER TABLE "barber_services" ADD "barber_profile_id" uuid`,
    );
    await queryRunner.query(
      `ALTER TABLE "barber_time_offs" ADD "barber_profile_id" uuid`,
    );
    await queryRunner.query(
      `ALTER TABLE "barber_availability_blocks" ADD "barber_profile_id" uuid`,
    );

    await queryRunner.query(
      `ALTER TABLE "working_hours" DROP COLUMN "tenant_professional_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "barber_services" DROP COLUMN "tenant_professional_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "barber_time_offs" DROP COLUMN "tenant_professional_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "barber_availability_blocks" DROP COLUMN "tenant_professional_id"`,
    );
  }
}
