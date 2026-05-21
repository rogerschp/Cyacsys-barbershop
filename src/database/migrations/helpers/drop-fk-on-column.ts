import { QueryRunner } from 'typeorm';

/**
 * Drops any FK on `tableName` that references `columnName`.
 * Needed when constraint names differ (semantic vs TypeORM hash) after refactor migrations.
 */
export async function dropForeignKeyOnColumn(
  queryRunner: QueryRunner,
  tableName: string,
  columnName: string,
): Promise<void> {
  await queryRunner.query(
    `
    DO $$
    DECLARE r record;
    BEGIN
      FOR r IN (
        SELECT c.conname
        FROM pg_constraint c
        JOIN pg_class t ON t.oid = c.conrelid
        JOIN pg_namespace n ON n.oid = t.relnamespace
        WHERE n.nspname = 'public'
          AND t.relname = '${tableName}'
          AND c.contype = 'f'
          AND EXISTS (
            SELECT 1
            FROM unnest(c.conkey) AS colnum(attnum)
            JOIN pg_attribute a
              ON a.attrelid = c.conrelid
             AND a.attnum = colnum.attnum
            WHERE a.attname = '${columnName}'
          )
      ) LOOP
        EXECUTE format(
          'ALTER TABLE %I DROP CONSTRAINT %I',
          '${tableName}',
          r.conname
        );
      END LOOP;
    END $$;
    `,
  );
}
