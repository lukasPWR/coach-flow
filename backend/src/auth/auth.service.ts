import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import * as bcrypt from "bcrypt";
import { UsersService } from "../users/users.service";
import { TokensService } from "../tokens/tokens.service";
import { RegisterDto } from "./dto/register.dto";
import { LoginDto } from "./dto/login.dto";
import { RequestPasswordResetDto } from "./dto/request-password-reset.dto";
import { ResetPasswordDto } from "./dto/reset-password.dto";
import { User } from "../users/entities/user.entity";
import { JwtPayload } from "./strategies/jwt.strategy";
import { randomBytes } from "crypto";

export interface AuthResponse {
  user: Omit<User, "password">;
  accessToken: string;
  refreshToken: string;
}

export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly tokensService: TokensService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService
  ) {}

  async register(registerDto: RegisterDto): Promise<AuthResponse> {
    const existingUser = await this.usersService.findByEmail(registerDto.email);
    if (existingUser) {
      throw new ConflictException("User with this email already exists");
    }

    const saltRounds = this.getSaltRounds();
    const hashedPassword = await bcrypt.hash(registerDto.password, saltRounds);

    const user = await this.usersService.create({
      ...registerDto,
      password: hashedPassword,
    });

    const tokens = await this.generateTokens(user);

    const { password, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
      ...tokens,
    };
  }

  async login(loginDto: LoginDto): Promise<AuthResponse> {
    const user = await this.usersService.findByEmailWithPassword(loginDto.email);
    if (!user) {
      throw new UnauthorizedException("Invalid credentials");
    }

    if (!user.password || !this.isValidBcryptHash(user.password)) {
      throw new UnauthorizedException("Invalid credentials");
    }

    const isPasswordValid = await bcrypt.compare(loginDto.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException("Invalid credentials");
    }

    const tokens = await this.generateTokens(user);

    const { password, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
      ...tokens,
    };
  }

  async logout(userId: string): Promise<void> {
    await this.tokensService.deleteAllRefreshTokensForUser(userId);
  }

  async refreshTokens(refreshToken: string): Promise<TokenResponse> {
    let payload: JwtPayload;
    try {
      payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get<string>("JWT_REFRESH_SECRET"),
      });
    } catch (error) {
      throw new UnauthorizedException("Invalid or expired refresh token");
    }

    const storedToken = await this.tokensService.validateRefreshToken(payload.sub, refreshToken);

    if (!storedToken) {
      throw new UnauthorizedException("Invalid or expired refresh token");
    }

    await this.tokensService.deleteRefreshToken(storedToken.id);

    const user = await this.usersService.findOne(payload.sub);
    const tokens = await this.generateTokens(user);

    return tokens;
  }

  async requestPasswordReset(dto: RequestPasswordResetDto): Promise<void> {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) {
      throw new NotFoundException("User with this email not found");
    }

    const resetToken = randomBytes(32).toString("hex");
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1);

    await this.tokensService.createPasswordResetToken(user.id, resetToken, expiresAt);

    console.log(`Password reset token for ${user.email}: ${resetToken}`);
  }

  async resetPassword(dto: ResetPasswordDto): Promise<void> {
    const storedToken = await this.tokensService.validatePasswordResetToken(dto.token);

    if (!storedToken) {
      throw new BadRequestException("Invalid or expired password reset token");
    }

    const saltRounds = this.getSaltRounds();
    const hashedPassword = await bcrypt.hash(dto.password, saltRounds);

    await this.usersService.update(storedToken.userId, {
      password: hashedPassword,
    });

    await this.tokensService.deletePasswordResetToken(storedToken.id);
    await this.tokensService.deleteAllRefreshTokensForUser(storedToken.userId);
  }

  private async generateTokens(user: User): Promise<TokenResponse> {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const accessTokenExpiration = this.configService.get<string>("JWT_ACCESS_EXPIRATION_TIME") || "30m";
    const refreshTokenExpiration = this.configService.get<string>("JWT_REFRESH_EXPIRATION_TIME") || "7d";

    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>("JWT_ACCESS_SECRET"),
      expiresIn: accessTokenExpiration as any,
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>("JWT_REFRESH_SECRET"),
      expiresIn: refreshTokenExpiration as any,
    });

    const refreshTokenExpiresAt = new Date();
    refreshTokenExpiresAt.setDate(refreshTokenExpiresAt.getDate() + 7);

    await this.tokensService.createRefreshToken(user.id, refreshToken, refreshTokenExpiresAt);

    return {
      accessToken,
      refreshToken,
    };
  }

  private getSaltRounds(): number {
    const saltRounds = this.configService.get<string | number>("BCRYPT_SALT_ROUNDS");
    if (saltRounds === undefined || saltRounds === null) {
      return 12;
    }
    const parsed = typeof saltRounds === "number" ? saltRounds : parseInt(saltRounds, 10);
    if (isNaN(parsed) || parsed < 4 || parsed > 31) {
      return 12;
    }
    return parsed;
  }

  private isValidBcryptHash(hash: string): boolean {
    if (!hash || typeof hash !== "string") {
      return false;
    }
    // Bcrypt hash zawsze zaczyna się od $2a$, $2b$, lub $2y$ i ma długość 60 znaków
    return /^\$2[ayb]\$\d{2}\$[./A-Za-z0-9]{53}$/.test(hash);
  }
}
