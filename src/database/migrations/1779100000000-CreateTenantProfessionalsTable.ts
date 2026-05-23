import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateTenantProfessionalsTable1779100000000 implements MigrationInterface {
  name = 'CreateTenantProfessionalsTable1779100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."tenant_professionals_role_enum" AS ENUM('OWNER', 'ADMIN', 'BARBER', 'STAFF')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."tenant_professionals_status_enum" AS ENUM('ACTIVE', 'INACTIVE', 'SUSPENDED', 'LEFT')`,
    );
    await queryRunner.query(`CREATE TABLE "tenant_professionals" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "tenant_id" uuid NOT NULL,
        "professional_profile_id" uuid NOT NULL,
        "role" "public"."tenant_professionals_role_enum" NOT NULL,
        "status" "public"."tenant_professionals_status_enum" NOT NULL DEFAULT 'ACTIVE',
        "joined_at" TIMESTAMP WITH TIME ZONE NOT NULL,
        "left_at" TIMESTAMP WITH TIME ZONE,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_tenant_professionals_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_tenant_professionals_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_tenant_professionals_professional_profile" FOREIGN KEY ("professional_profile_id") REFERENCES "professional_profiles"("id") ON DELETE CASCADE
      )`);
    await queryRunner.query(
      `CREATE INDEX "IDX_tenant_professionals_tenant_id" ON "tenant_professionals" ("tenant_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_tenant_professionals_professional_profile_id" ON "tenant_professionals" ("professional_profile_id")`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_tenant_professionals_tenant_profile" ON "tenant_professionals" ("tenant_id", "professional_profile_id")`,
    );

    await queryRunner.query(`
      INSERT INTO "professional_profiles" (
        "id",
        "user_id",
        "display_name",
        "bio",
        "avatar_url",
        "professional_type",
        "booking_mode",
        "whatsapp_number",
        "instagram_username",
        "experience_years",
        "is_active",
        "createdAt",
        "updatedAt",
        "deletedAt"
      )
      SELECT
        uuid_generate_v4(),
        tu."user_id",
        bp."display_name",
        bp."bio",
        bp."avatar_url",
        'BARBER'::"public"."professional_profiles_professional_type_enum",
        'DIRECT_BOOKING'::"public"."professional_profiles_booking_mode_enum",
        NULL,
        NULL,
        bp."experience_years",
        bp."is_active",
        bp."createdAt",
        bp."updatedAt",
        bp."deletedAt"
      FROM "barber_profiles" bp
      INNER JOIN "tenant_users" tu ON tu."id" = bp."tenant_user_id"
      WHERE NOT EXISTS (
        SELECT 1
        FROM "professional_profiles" pp
        WHERE pp."user_id" = tu."user_id"
          AND pp."deletedAt" IS NULL
      )
    `);

    await queryRunner.query(`
      INSERT INTO "tenant_professionals" (
        "id",
        "tenant_id",
        "professional_profile_id",
        "role",
        "status",
        "joined_at",
        "left_at",
        "createdAt"
      )
      SELECT
        uuid_generate_v4(),
        bp."tenant_id",
        pp."id",
        tu."role"::text::"public"."tenant_professionals_role_enum",
        CASE
          WHEN bp."is_active" = true AND bp."deletedAt" IS NULL THEN 'ACTIVE'::"public"."tenant_professionals_status_enum"
          WHEN bp."deletedAt" IS NOT NULL THEN 'LEFT'::"public"."tenant_professionals_status_enum"
          ELSE 'INACTIVE'::"public"."tenant_professionals_status_enum"
        END,
        bp."createdAt",
        CASE WHEN bp."deletedAt" IS NOT NULL THEN bp."deletedAt" ELSE NULL END,
        bp."createdAt"
      FROM "barber_profiles" bp
      INNER JOIN "tenant_users" tu ON tu."id" = bp."tenant_user_id"
      INNER JOIN "professional_profiles" pp ON pp."user_id" = tu."user_id"
        AND (
          (bp."deletedAt" IS NULL AND pp."deletedAt" IS NULL)
          OR (bp."deletedAt" IS NOT NULL AND pp."deletedAt" IS NOT NULL)
        )
      WHERE NOT EXISTS (
        SELECT 1
        FROM "tenant_professionals" tp
        WHERE tp."tenant_id" = bp."tenant_id"
          AND tp."professional_profile_id" = pp."id"
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "public"."UQ_tenant_professionals_tenant_profile"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_tenant_professionals_professional_profile_id"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_tenant_professionals_tenant_id"`,
    );
    await queryRunner.query(`DROP TABLE "tenant_professionals"`);
    await queryRunner.query(
      `DROP TYPE "public"."tenant_professionals_status_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."tenant_professionals_role_enum"`,
    );
  }
}
