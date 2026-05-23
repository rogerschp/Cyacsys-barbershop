import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateReviewTable1780000000000 implements MigrationInterface {
  name = 'CreateReviewTable1780000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."reviews_target_type_enum" AS ENUM('TENANT', 'PROFESSIONAL')`,
    );
    await queryRunner.query(
      `CREATE TABLE "reviews" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "reviewer_user_id" uuid NOT NULL,
        "target_type" "public"."reviews_target_type_enum" NOT NULL,
        "target_id" uuid NOT NULL,
        "rating" integer NOT NULL,
        "comment" character varying(1000),
        "is_edited" boolean NOT NULL DEFAULT false,
        "edited_at" TIMESTAMP,
        "reply" character varying(1000),
        "replied_at" TIMESTAMP,
        "replied_by_user_id" uuid,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "deletedAt" TIMESTAMP,
        CONSTRAINT "PK_reviews_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_reviews_reviewer" FOREIGN KEY ("reviewer_user_id") REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_reviews_replied_by" FOREIGN KEY ("replied_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL,
        CONSTRAINT "CHK_reviews_rating_range" CHECK ("rating" >= 1 AND "rating" <= 5)
      )`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_reviews_target" ON "reviews" ("target_type", "target_id")`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_reviews_reviewer_target_active" ON "reviews" ("reviewer_user_id", "target_type", "target_id") WHERE "deletedAt" IS NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "public"."UQ_reviews_reviewer_target_active"`,
    );
    await queryRunner.query(`DROP INDEX "public"."IDX_reviews_target"`);
    await queryRunner.query(`DROP TABLE "reviews"`);
    await queryRunner.query(`DROP TYPE "public"."reviews_target_type_enum"`);
  }
}
