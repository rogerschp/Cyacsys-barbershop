import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateNotificationRecordsTable1800000000000 implements MigrationInterface {
  name = 'CreateNotificationRecordsTable1800000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "public"."notification_records_event_enum" AS ENUM(
        'TEAM_INVITATION',
        'BOOKING_CREATED',
        'BOOKING_CONFIRMED',
        'BOOKING_CANCELLED',
        'REVIEW_CREATED',
        'PASSWORD_RESET',
        'SUBSCRIPTION_EXPIRED'
      )
    `);
    await queryRunner.query(`
      CREATE TYPE "public"."notification_records_channel_enum" AS ENUM(
        'EMAIL',
        'TELEGRAM',
        'WHATSAPP',
        'PUSH'
      )
    `);
    await queryRunner.query(`
      CREATE TYPE "public"."notification_records_status_enum" AS ENUM(
        'PENDING',
        'SENT',
        'FAILED'
      )
    `);
    await queryRunner.query(`
      CREATE TABLE "notification_records" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "event" "public"."notification_records_event_enum" NOT NULL,
        "channel" "public"."notification_records_channel_enum" NOT NULL,
        "to" character varying(320) NOT NULL,
        "status" "public"."notification_records_status_enum" NOT NULL,
        "error_message" text,
        "payload" jsonb,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_notification_records" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_notification_records_event_created_at"
      ON "notification_records" ("event", "created_at")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "public"."IDX_notification_records_event_created_at"`,
    );
    await queryRunner.query(`DROP TABLE "notification_records"`);
    await queryRunner.query(
      `DROP TYPE "public"."notification_records_status_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."notification_records_channel_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."notification_records_event_enum"`,
    );
  }
}
