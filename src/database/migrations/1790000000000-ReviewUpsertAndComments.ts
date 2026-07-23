import { MigrationInterface, QueryRunner } from 'typeorm';

export class ReviewUpsertAndComments1790000000000
  implements MigrationInterface
{
  name = 'ReviewUpsertAndComments1790000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "reviews" DROP COLUMN IF EXISTS "is_edited"`,
    );
    await queryRunner.query(
      `ALTER TABLE "reviews" DROP COLUMN IF EXISTS "edited_at"`,
    );

    await queryRunner.query(`
      CREATE TABLE "review_comments" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "review_id" uuid NOT NULL,
        "author_user_id" uuid NOT NULL,
        "body" character varying(1000) NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "deletedAt" TIMESTAMP,
        CONSTRAINT "PK_review_comments_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_review_comments_review" FOREIGN KEY ("review_id") REFERENCES "reviews"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_review_comments_author" FOREIGN KEY ("author_user_id") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_review_comments_review_id" ON "review_comments" ("review_id")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "review_comments"`);
    await queryRunner.query(
      `ALTER TABLE "reviews" ADD COLUMN IF NOT EXISTS "is_edited" boolean NOT NULL DEFAULT false`,
    );
    await queryRunner.query(
      `ALTER TABLE "reviews" ADD COLUMN IF NOT EXISTS "edited_at" TIMESTAMP`,
    );
  }
}
