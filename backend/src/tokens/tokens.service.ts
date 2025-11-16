import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, LessThan } from "typeorm";
import { RefreshToken } from "./entities/refresh-token.entity";
import { PasswordResetToken } from "./entities/password-reset-token.entity";
import * as bcrypt from "bcrypt";

@Injectable()
export class TokensService {
  constructor(
    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepository: Repository<RefreshToken>,
    @InjectRepository(PasswordResetToken)
    private readonly passwordResetTokenRepository: Repository<PasswordResetToken>
  ) {}

  async createRefreshToken(userId: string, token: string, expiresAt: Date): Promise<RefreshToken> {
    const hashedToken = await bcrypt.hash(token, 12);
    const refreshToken = this.refreshTokenRepository.create({
      userId,
      token: hashedToken,
      expiresAt,
    });
    return this.refreshTokenRepository.save(refreshToken);
  }

  async findRefreshTokenByUserId(userId: string): Promise<RefreshToken | null> {
    return this.refreshTokenRepository.findOne({
      where: { userId },
      order: { expiresAt: "DESC" },
    });
  }

  async validateRefreshToken(userId: string, token: string): Promise<RefreshToken | null> {
    const storedToken = await this.findRefreshTokenByUserId(userId);
    if (!storedToken) {
      return null;
    }

    if (storedToken.expiresAt < new Date()) {
      await this.deleteRefreshToken(storedToken.id);
      return null;
    }

    if (!storedToken.token || !this.isValidBcryptHash(storedToken.token)) {
      return null;
    }

    const isValid = await bcrypt.compare(token, storedToken.token);
    return isValid ? storedToken : null;
  }

  async deleteRefreshToken(id: string): Promise<void> {
    await this.refreshTokenRepository.delete(id);
  }

  async deleteAllRefreshTokensForUser(userId: string): Promise<void> {
    await this.refreshTokenRepository.delete({ userId });
  }

  async createPasswordResetToken(userId: string, token: string, expiresAt: Date): Promise<PasswordResetToken> {
    await this.passwordResetTokenRepository.delete({ userId });

    const hashedToken = await bcrypt.hash(token, 12);
    const resetToken = this.passwordResetTokenRepository.create({
      userId,
      token: hashedToken,
      expiresAt,
    });
    return this.passwordResetTokenRepository.save(resetToken);
  }

  async validatePasswordResetToken(token: string): Promise<PasswordResetToken | null> {
    const tokens = await this.passwordResetTokenRepository.find();

    for (const storedToken of tokens) {
      if (!storedToken.token || !this.isValidBcryptHash(storedToken.token)) {
        continue;
      }

      const isValid = await bcrypt.compare(token, storedToken.token);
      if (isValid) {
        if (storedToken.expiresAt < new Date()) {
          await this.deletePasswordResetToken(storedToken.id);
          return null;
        }
        return storedToken;
      }
    }

    return null;
  }

  async deletePasswordResetToken(id: string): Promise<void> {
    await this.passwordResetTokenRepository.delete(id);
  }

  async cleanupExpiredTokens(): Promise<void> {
    const now = new Date();
    await this.refreshTokenRepository.delete({ expiresAt: LessThan(now) });
    await this.passwordResetTokenRepository.delete({ expiresAt: LessThan(now) });
  }

  private isValidBcryptHash(hash: string): boolean {
    if (!hash || typeof hash !== "string") {
      return false;
    }
    // Bcrypt hash zawsze zaczyna się od $2a$, $2b$, lub $2y$ i ma długość 60 znaków
    return /^\$2[ayb]\$\d{2}\$[./A-Za-z0-9]{53}$/.test(hash);
  }
}
