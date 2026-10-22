import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddNotificationChannels1802000000000 implements MigrationInterface {
  name = 'AddNotificationChannels1802000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TYPE "public"."notification_records_status_enum" ADD VALUE IF NOT EXISTS 'SKIPPED'`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "telegram_chat_id" character varying(64)`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "telegram_linked_at" TIMESTAMP WITH TIME ZONE`,
    );
    await queryRunner.query(`
      CREATE TYPE "public"."user_device_tokens_platform_enum" AS ENUM('ANDROID','IOS','WEB')
    `);
    await queryRunner.query(`
      CREATE TABLE "user_device_tokens" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "user_id" uuid NOT NULL,
        "token" character varying(512) NOT NULL,
        "platform" "public"."user_device_tokens_platform_enum" NOT NULL,
        "device_id" character varying(128),
        "is_active" boolean NOT NULL DEFAULT true,
        "last_seen_at" TIMESTAMP WITH TIME ZONE,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_user_device_tokens" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_user_device_tokens_token" UNIQUE ("token"),
        CONSTRAINT "FK_user_device_tokens_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_user_device_tokens_user_active" ON "user_device_tokens" ("user_id", "is_active")`,
    );
    await queryRunner.query(`
      CREATE TABLE "user_notification_preferences" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "user_id" uuid NOT NULL,
        "event" "public"."notification_records_event_enum" NOT NULL,
        "channel" "public"."notification_records_channel_enum" NOT NULL,
        "enabled" boolean NOT NULL DEFAULT true,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_user_notification_preferences" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_user_notif_pref" UNIQUE ("user_id", "event", "channel"),
        CONSTRAINT "FK_user_notif_pref_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`
      CREATE TABLE "notification_link_tokens" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "user_id" uuid NOT NULL,
        "channel" "public"."notification_records_channel_enum" NOT NULL,
        "token_hash" character varying(128) NOT NULL,
        "expires_at" TIMESTAMP WITH TIME ZONE NOT NULL,
        "used_at" TIMESTAMP WITH TIME ZONE,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_notification_link_tokens" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_notification_link_tokens_hash" UNIQUE ("token_hash"),
        CONSTRAINT "FK_notification_link_tokens_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      `ALTER TABLE "notification_records" ADD COLUMN IF NOT EXISTS "user_id" uuid`,
    );
    await queryRunner.query(
      `ALTER TABLE "notification_records" ADD COLUMN IF NOT EXISTS "tenant_id" uuid`,
    );
    await queryRunner.query(
      `ALTER TABLE "notification_records" ADD COLUMN IF NOT EXISTS "attempts" integer NOT NULL DEFAULT 0`,
    );
    await queryRunner.query(
      `ALTER TABLE "notification_records" ADD COLUMN IF NOT EXISTS "provider_message_id" character varying(256)`,
    );
    await queryRunner.query(
      `ALTER TABLE "notification_records" ADD COLUMN IF NOT EXISTS "sent_at" TIMESTAMP WITH TIME ZONE`,
    );
    await queryRunner.query(
      `ALTER TABLE "notification_records" ADD COLUMN IF NOT EXISTS "next_retry_at" TIMESTAMP WITH TIME ZONE`,
    );
    await queryRunner.query(
      `ALTER TABLE "notification_records" ADD COLUMN IF NOT EXISTS "idempotency_key" character varying(256)`,
    );
    await queryRunner.query(
      `ALTER TABLE "notification_records" ADD COLUMN IF NOT EXISTS "updated_at" TIMESTAMP NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_notification_records_idempotency" ON "notification_records" ("idempotency_key") WHERE "idempotency_key" IS NOT NULL`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_notification_records_status_next_retry" ON "notification_records" ("status", "next_retry_at")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_notification_records_status_next_retry"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "UQ_notification_records_idempotency"`);
    await queryRunner.query(`ALTER TABLE "notification_records" DROP COLUMN IF EXISTS "updated_at"`);
    await queryRunner.query(`ALTER TABLE "notification_records" DROP COLUMN IF EXISTS "idempotency_key"`);
    await queryRunner.query(`ALTER TABLE "notification_records" DROP COLUMN IF EXISTS "next_retry_at"`);
    await queryRunner.query(`ALTER TABLE "notification_records" DROP COLUMN IF EXISTS "sent_at"`);
    await queryRunner.query(`ALTER TABLE "notification_records" DROP COLUMN IF EXISTS "provider_message_id"`);
    await queryRunner.query(`ALTER TABLE "notification_records" DROP COLUMN IF EXISTS "attempts"`);
    await queryRunner.query(`ALTER TABLE "notification_records" DROP COLUMN IF EXISTS "tenant_id"`);
    await queryRunner.query(`ALTER TABLE "notification_records" DROP COLUMN IF EXISTS "user_id"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "notification_link_tokens"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "user_notification_preferences"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_user_device_tokens_user_active"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "user_device_tokens"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."user_device_tokens_platform_enum"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "telegram_linked_at"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "telegram_chat_id"`);
    // SKIPPED no enum status: Postgres não remove valor de enum com segurança; noop.
  }
}
