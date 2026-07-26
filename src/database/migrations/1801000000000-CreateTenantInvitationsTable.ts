import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateTenantInvitationsTable1801000000000 implements MigrationInterface {
  name = 'CreateTenantInvitationsTable1801000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "public"."tenant_invitations_status_enum" AS ENUM(
        'PENDING',
        'ACCEPTED',
        'EXPIRED',
        'CANCELLED'
      )
    `);
    await queryRunner.query(`
      CREATE TABLE "tenant_invitations" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "tenant_id" uuid NOT NULL,
        "email" character varying(320) NOT NULL,
        "role" "public"."tenant_users_role_enum" NOT NULL,
        "status" "public"."tenant_invitations_status_enum" NOT NULL,
        "token" character varying(64) NOT NULL,
        "expires_at" TIMESTAMP WITH TIME ZONE NOT NULL,
        "accepted_at" TIMESTAMP WITH TIME ZONE,
        "created_by_user_id" uuid NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_tenant_invitations" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_tenant_invitations_token" UNIQUE ("token"),
        CONSTRAINT "FK_tenant_invitations_tenant"
          FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_tenant_invitations_created_by"
          FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_tenant_invitations_tenant_email"
      ON "tenant_invitations" ("tenant_id", "email")
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX "UQ_tenant_invitations_pending_tenant_email"
      ON "tenant_invitations" ("tenant_id", "email")
      WHERE status = 'PENDING'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "public"."UQ_tenant_invitations_pending_tenant_email"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_tenant_invitations_tenant_email"`,
    );
    await queryRunner.query(`DROP TABLE "tenant_invitations"`);
    await queryRunner.query(
      `DROP TYPE "public"."tenant_invitations_status_enum"`,
    );
  }
}
