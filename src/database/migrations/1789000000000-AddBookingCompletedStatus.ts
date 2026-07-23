import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddBookingCompletedStatus1789000000000 implements MigrationInterface {
  name = 'AddBookingCompletedStatus1789000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TYPE "public"."bookings_status_enum" ADD VALUE IF NOT EXISTS 'COMPLETED'`,
    );
  }

  public async down(): Promise<void> {
    // Postgres não remove valores de enum com segurança; noop.
  }
}
