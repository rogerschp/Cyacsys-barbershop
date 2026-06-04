import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateSubscriptionTables1781000000000 implements MigrationInterface {
  name = 'CreateSubscriptionTables1781000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."plans_name_enum" AS ENUM('FREE', 'STANDARD', 'PRO', 'ELITE')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."plans_billing_cycle_enum" AS ENUM('MONTHLY', 'ANNUAL', 'NONE')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."tenant_subscriptions_status_enum" AS ENUM('ACTIVE', 'GRACE_PERIOD', 'EXPIRED', 'CANCELLED')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."subscription_histories_event_enum" AS ENUM('CREATED', 'UPGRADED', 'DOWNGRADED', 'RENEWED', 'CANCELLED', 'EXPIRED', 'GRACE_STARTED', 'MANUALLY_ACTIVATED')`,
    );

    await queryRunner.query(`CREATE TABLE "plans" (
      "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
      "name" "public"."plans_name_enum" NOT NULL,
      "billing_cycle" "public"."plans_billing_cycle_enum" NOT NULL,
      "price" decimal(10,2) NOT NULL,
      "sort_weight" integer NOT NULL,
      "grace_period_days" integer NOT NULL,
      "features" jsonb NOT NULL,
      "is_active" boolean NOT NULL DEFAULT true,
      "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
      "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
      "deletedAt" TIMESTAMP,
      CONSTRAINT "PK_plans_id" PRIMARY KEY ("id"),
      CONSTRAINT "UQ_plans_name" UNIQUE ("name")
    )`);

    await queryRunner.query(`CREATE TABLE "tenant_subscriptions" (
      "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
      "tenant_id" uuid NOT NULL,
      "plan_id" uuid NOT NULL,
      "status" "public"."tenant_subscriptions_status_enum" NOT NULL,
      "current_period_start" TIMESTAMP,
      "current_period_end" TIMESTAMP,
      "grace_period_end" TIMESTAMP,
      "gateway_customer_id" character varying,
      "gateway_sub_id" character varying,
      "cancelled_at" TIMESTAMP,
      "activated_by" uuid,
      "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
      "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
      "deletedAt" TIMESTAMP,
      CONSTRAINT "PK_tenant_subscriptions_id" PRIMARY KEY ("id"),
      CONSTRAINT "FK_tenant_subscriptions_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE,
      CONSTRAINT "FK_tenant_subscriptions_plan" FOREIGN KEY ("plan_id") REFERENCES "plans"("id") ON DELETE RESTRICT
    )`);

    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_tenant_subscriptions_tenant_id" ON "tenant_subscriptions" ("tenant_id") WHERE "deletedAt" IS NULL`,
    );

    await queryRunner.query(`CREATE TABLE "subscription_histories" (
      "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
      "tenant_id" uuid NOT NULL,
      "subscription_id" uuid NOT NULL,
      "event" "public"."subscription_histories_event_enum" NOT NULL,
      "from_plan_id" uuid,
      "to_plan_id" uuid,
      "performed_by" character varying NOT NULL,
      "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
      "deletedAt" TIMESTAMP,
      CONSTRAINT "PK_subscription_histories_id" PRIMARY KEY ("id"),
      CONSTRAINT "FK_subscription_histories_subscription" FOREIGN KEY ("subscription_id") REFERENCES "tenant_subscriptions"("id") ON DELETE CASCADE
    )`);

    await queryRunner.query(
      `CREATE INDEX "IDX_subscription_histories_tenant_id" ON "subscription_histories" ("tenant_id")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "public"."IDX_subscription_histories_tenant_id"`,
    );
    await queryRunner.query(`DROP TABLE "subscription_histories"`);
    await queryRunner.query(
      `DROP INDEX "public"."UQ_tenant_subscriptions_tenant_id"`,
    );
    await queryRunner.query(`DROP TABLE "tenant_subscriptions"`);
    await queryRunner.query(`DROP TABLE "plans"`);
    await queryRunner.query(
      `DROP TYPE "public"."subscription_histories_event_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."tenant_subscriptions_status_enum"`,
    );
    await queryRunner.query(`DROP TYPE "public"."plans_billing_cycle_enum"`);
    await queryRunner.query(`DROP TYPE "public"."plans_name_enum"`);
  }
}
