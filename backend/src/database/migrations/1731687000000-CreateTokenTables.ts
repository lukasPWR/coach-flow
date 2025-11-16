import { MigrationInterface, QueryRunner, Table, TableForeignKey } from "typeorm";

export class CreateTokenTables1731687000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create refresh_tokens table
    await queryRunner.createTable(
      new Table({
        name: "refresh_tokens",
        columns: [
          {
            name: "id",
            type: "uuid",
            isPrimary: true,
            generationStrategy: "uuid",
            default: "uuid_generate_v4()",
          },
          {
            name: "userId",
            type: "uuid",
            isNullable: false,
          },
          {
            name: "token",
            type: "text",
            isNullable: false,
          },
          {
            name: "expiresAt",
            type: "timestamp",
            isNullable: false,
          },
        ],
      }),
      true
    );

    // Create foreign key for refresh_tokens
    await queryRunner.createForeignKey(
      "refresh_tokens",
      new TableForeignKey({
        columnNames: ["userId"],
        referencedColumnNames: ["id"],
        referencedTableName: "users",
        onDelete: "CASCADE",
      })
    );

    // Create password_reset_tokens table
    await queryRunner.createTable(
      new Table({
        name: "password_reset_tokens",
        columns: [
          {
            name: "id",
            type: "uuid",
            isPrimary: true,
            generationStrategy: "uuid",
            default: "uuid_generate_v4()",
          },
          {
            name: "userId",
            type: "uuid",
            isNullable: false,
          },
          {
            name: "token",
            type: "text",
            isNullable: false,
            isUnique: true,
          },
          {
            name: "expiresAt",
            type: "timestamp",
            isNullable: false,
          },
        ],
      }),
      true
    );

    // Create foreign key for password_reset_tokens
    await queryRunner.createForeignKey(
      "password_reset_tokens",
      new TableForeignKey({
        columnNames: ["userId"],
        referencedColumnNames: ["id"],
        referencedTableName: "users",
        onDelete: "CASCADE",
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign keys first
    const refreshTokensTable = await queryRunner.getTable("refresh_tokens");
    const passwordResetTokensTable = await queryRunner.getTable("password_reset_tokens");

    if (refreshTokensTable) {
      const refreshTokensForeignKey = refreshTokensTable.foreignKeys.find(
        (fk) => fk.columnNames.indexOf("userId") !== -1
      );
      if (refreshTokensForeignKey) {
        await queryRunner.dropForeignKey("refresh_tokens", refreshTokensForeignKey);
      }
    }

    if (passwordResetTokensTable) {
      const passwordResetTokensForeignKey = passwordResetTokensTable.foreignKeys.find(
        (fk) => fk.columnNames.indexOf("userId") !== -1
      );
      if (passwordResetTokensForeignKey) {
        await queryRunner.dropForeignKey("password_reset_tokens", passwordResetTokensForeignKey);
      }
    }

    // Drop tables
    await queryRunner.dropTable("refresh_tokens", true);
    await queryRunner.dropTable("password_reset_tokens", true);
  }
}
