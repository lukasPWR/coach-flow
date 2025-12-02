import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { BookingBan } from "./entities/booking-ban.entity";
import { CreateBookingBanDto } from "./dto/create-booking-ban.dto";

/**
 * Service responsible for managing booking bans.
 *
 * Provides business logic for creating and managing booking ban restrictions.
 */
@Injectable()
export class BookingBansService {
  private readonly logger = new Logger(BookingBansService.name);

  constructor(
    @InjectRepository(BookingBan)
    private readonly bookingBanRepository: Repository<BookingBan>
  ) {}

  /**
   * Creates a new booking ban.
   *
   * This method creates a restriction that prevents a client from booking
   * with a specific trainer until the specified date.
   *
   * @param createBookingBanDto - DTO containing ban creation data
   * @returns The newly created booking ban entity
   */
  async create(createBookingBanDto: CreateBookingBanDto): Promise<BookingBan> {
    try {
      const bookingBan = this.bookingBanRepository.create({
        ...createBookingBanDto,
        bannedUntil: new Date(createBookingBanDto.bannedUntil),
      });

      const savedBookingBan = await this.bookingBanRepository.save(bookingBan);

      this.logger.log(
        `Booking ban created: Client ${createBookingBanDto.clientId} banned from trainer ${createBookingBanDto.trainerId} until ${createBookingBanDto.bannedUntil}`
      );

      return savedBookingBan;
    } catch (error) {
      this.logger.error(`Failed to create booking ban: ${error.message}`, error.stack);
      throw error;
    }
  }
}
