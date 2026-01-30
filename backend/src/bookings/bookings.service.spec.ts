import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
  ConflictException,
  InternalServerErrorException,
} from "@nestjs/common";
import { Repository } from "typeorm";
import { BookingsService } from "./bookings.service";
import { Booking, BookingStatus } from "./entities/booking.entity";
import { Service } from "../services/entities/service.entity";
import { User } from "../users/entities/user.entity";
import { BookingBan } from "../booking-bans/entities/booking-ban.entity";
import { Unavailability } from "../unavailabilities/entities/unavailability.entity";
import { BookingBansService } from "../booking-bans/booking-bans.service";
import { CreateBookingDto } from "./dto/create-booking.dto";
import { GetBookingsQueryDto, UserBookingRole, TimeFilter } from "./dto/get-bookings-query.dto";

describe("BookingsService", () => {
  let service: BookingsService;
  let bookingRepository: jest.Mocked<Repository<Booking>>;
  let serviceRepository: jest.Mocked<Repository<Service>>;
  let userRepository: jest.Mocked<Repository<User>>;
  let bookingBanRepository: jest.Mocked<Repository<BookingBan>>;
  let unavailabilityRepository: jest.Mocked<Repository<Unavailability>>;
  let bookingBansService: jest.Mocked<BookingBansService>;

  // Test data constants
  const CLIENT_ID = "client-uuid-123";
  const TRAINER_ID = "trainer-uuid-456";
  const SERVICE_ID = "service-uuid-789";
  const BOOKING_ID = "booking-uuid-abc";

  const mockUser = {
    id: TRAINER_ID,
    email: "trainer@example.com",
    name: "Test Trainer",
    createdAt: new Date(),
    updatedAt: new Date(),
  } as User;

  const mockService = {
    id: SERVICE_ID,
    trainerId: TRAINER_ID,
    serviceTypeId: "service-type-uuid",
    durationMinutes: 60,
    price: 100,
    createdAt: new Date(),
    updatedAt: new Date(),
    trainer: mockUser,
  } as Service;

  beforeEach(async () => {
    // Create mock repository functions
    const mockBookingRepository = {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
      createQueryBuilder: jest.fn(),
    };

    const mockServiceRepository = {
      findOne: jest.fn(),
    };

    const mockUserRepository = {
      findOne: jest.fn(),
    };

    const mockBookingBanRepository = {
      findOne: jest.fn(),
    };

    const mockUnavailabilityRepository = {
      createQueryBuilder: jest.fn(),
    };

    const mockBookingBansService = {
      create: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BookingsService,
        {
          provide: getRepositoryToken(Booking),
          useValue: mockBookingRepository,
        },
        {
          provide: getRepositoryToken(Service),
          useValue: mockServiceRepository,
        },
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
        {
          provide: getRepositoryToken(BookingBan),
          useValue: mockBookingBanRepository,
        },
        {
          provide: getRepositoryToken(Unavailability),
          useValue: mockUnavailabilityRepository,
        },
        {
          provide: BookingBansService,
          useValue: mockBookingBansService,
        },
      ],
    }).compile();

    service = module.get<BookingsService>(BookingsService);
    bookingRepository = module.get(getRepositoryToken(Booking));
    serviceRepository = module.get(getRepositoryToken(Service));
    userRepository = module.get(getRepositoryToken(User));
    bookingBanRepository = module.get(getRepositoryToken(BookingBan));
    unavailabilityRepository = module.get(getRepositoryToken(Unavailability));
    bookingBansService = module.get(BookingBansService);

    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  describe("create", () => {
    // 24 hours from now
    const futureDate = new Date(Date.now() + 86400000);
    const createBookingDto: CreateBookingDto = {
      trainerId: TRAINER_ID,
      serviceId: SERVICE_ID,
      startTime: futureDate.toISOString(),
    };

    beforeEach(() => {
      // Default successful path setup
      bookingBanRepository.findOne.mockResolvedValue(null);
      serviceRepository.findOne.mockResolvedValue(mockService);
      userRepository.findOne.mockResolvedValue(mockUser);
    });

    describe("validation", () => {
      it("should throw BadRequestException when booking time is in the past", async () => {
        // 24 hours ago
        const pastDate = new Date(Date.now() - 86400000);
        const dto = { ...createBookingDto, startTime: pastDate.toISOString() };

        await expect(service.create(CLIENT_ID, dto)).rejects.toThrow(
          new BadRequestException("Cannot book a time in the past.")
        );
      });

      it("should throw BadRequestException when booking time is exactly now", async () => {
        jest.spyOn(Date, "now").mockReturnValue(1000000);
        const now = new Date(1000000);
        const dto = { ...createBookingDto, startTime: now.toISOString() };

        await expect(service.create(CLIENT_ID, dto)).rejects.toThrow(
          new BadRequestException("Cannot book a time in the past.")
        );
      });
    });

    describe("client ban check", () => {
      it("should throw ForbiddenException when client has active ban", async () => {
        const activeBan = {
          id: "ban-uuid",
          clientId: CLIENT_ID,
          trainerId: TRAINER_ID,
          bannedUntil: new Date(Date.now() + 86400000),
          createdAt: new Date(),
        } as BookingBan;

        bookingBanRepository.findOne.mockResolvedValue(activeBan);

        await expect(service.create(CLIENT_ID, createBookingDto)).rejects.toThrow(
          new ForbiddenException("You are currently banned from making bookings.")
        );
      });

      it("should proceed when client has no active ban", async () => {
        bookingBanRepository.findOne.mockResolvedValue(null);
        serviceRepository.findOne.mockResolvedValue(mockService);
        userRepository.findOne.mockResolvedValue(mockUser);

        const queryBuilder = {
          where: jest.fn().mockReturnThis(),
          andWhere: jest.fn().mockReturnThis(),
          getOne: jest.fn().mockResolvedValue(null),
        };
        bookingRepository.createQueryBuilder.mockReturnValue(queryBuilder as any);
        unavailabilityRepository.createQueryBuilder.mockReturnValue(queryBuilder as any);

        const savedBooking = {
          id: BOOKING_ID,
          clientId: CLIENT_ID,
          trainerId: TRAINER_ID,
          serviceId: SERVICE_ID,
          startTime: futureDate,
          endTime: new Date(futureDate.getTime() + 3600000),
          status: BookingStatus.PENDING,
        };

        bookingRepository.create.mockReturnValue(savedBooking as any);
        bookingRepository.save.mockResolvedValue(savedBooking as any);

        const result = await service.create(CLIENT_ID, createBookingDto);

        expect(result).toEqual(savedBooking);
        expect(bookingBanRepository.findOne).toHaveBeenCalledWith({
          where: expect.objectContaining({
            clientId: CLIENT_ID,
            trainerId: TRAINER_ID,
          }),
        });
      });
    });

    describe("service validation", () => {
      it("should throw NotFoundException when service does not exist", async () => {
        bookingBanRepository.findOne.mockResolvedValue(null);
        serviceRepository.findOne.mockResolvedValue(null);

        await expect(service.create(CLIENT_ID, createBookingDto)).rejects.toThrow(
          new NotFoundException("Service not found")
        );
      });

      it("should throw BadRequestException when service does not belong to trainer", async () => {
        const wrongService = { ...mockService, trainerId: "different-trainer-uuid" };
        bookingBanRepository.findOne.mockResolvedValue(null);
        serviceRepository.findOne.mockResolvedValue(wrongService as any);

        await expect(service.create(CLIENT_ID, createBookingDto)).rejects.toThrow(
          new BadRequestException("Service does not belong to the specified trainer")
        );
      });

      it("should throw NotFoundException when trainer does not exist", async () => {
        bookingBanRepository.findOne.mockResolvedValue(null);
        serviceRepository.findOne.mockResolvedValue(mockService);
        userRepository.findOne.mockResolvedValue(null);

        await expect(service.create(CLIENT_ID, createBookingDto)).rejects.toThrow(
          new NotFoundException("Trainer not found")
        );
      });
    });

    describe("time slot availability", () => {
      beforeEach(() => {
        bookingBanRepository.findOne.mockResolvedValue(null);
        serviceRepository.findOne.mockResolvedValue(mockService);
        userRepository.findOne.mockResolvedValue(mockUser);
      });

      it("should throw BadRequestException when time slot conflicts with existing booking", async () => {
        const conflictingBooking = {
          id: "conflicting-booking-uuid",
          startTime: futureDate,
          endTime: new Date(futureDate.getTime() + 3600000),
          status: BookingStatus.ACCEPTED,
        };

        const queryBuilder = {
          where: jest.fn().mockReturnThis(),
          andWhere: jest.fn().mockReturnThis(),
          getOne: jest.fn().mockResolvedValue(conflictingBooking),
        };

        bookingRepository.createQueryBuilder.mockReturnValue(queryBuilder as any);

        await expect(service.create(CLIENT_ID, createBookingDto)).rejects.toThrow(
          new BadRequestException("The selected time slot is not available.")
        );
      });

      it("should throw BadRequestException when time slot conflicts with unavailability", async () => {
        const conflictingUnavailability = {
          id: "unavailability-uuid",
          startTime: futureDate,
          endTime: new Date(futureDate.getTime() + 3600000),
        };

        const bookingQueryBuilder = {
          where: jest.fn().mockReturnThis(),
          andWhere: jest.fn().mockReturnThis(),
          getOne: jest.fn().mockResolvedValue(null),
        };

        const unavailabilityQueryBuilder = {
          where: jest.fn().mockReturnThis(),
          andWhere: jest.fn().mockReturnThis(),
          getOne: jest.fn().mockResolvedValue(conflictingUnavailability),
        };

        bookingRepository.createQueryBuilder.mockReturnValue(bookingQueryBuilder as any);
        unavailabilityRepository.createQueryBuilder.mockReturnValue(unavailabilityQueryBuilder as any);

        await expect(service.create(CLIENT_ID, createBookingDto)).rejects.toThrow(
          new BadRequestException("The selected time slot is not available.")
        );
      });

      it("should allow booking when time slot is available", async () => {
        const queryBuilder = {
          where: jest.fn().mockReturnThis(),
          andWhere: jest.fn().mockReturnThis(),
          getOne: jest.fn().mockResolvedValue(null),
        };

        bookingRepository.createQueryBuilder.mockReturnValue(queryBuilder as any);
        unavailabilityRepository.createQueryBuilder.mockReturnValue(queryBuilder as any);

        const expectedEndTime = new Date(futureDate.getTime() + mockService.durationMinutes * 60 * 1000);
        const savedBooking = {
          id: BOOKING_ID,
          clientId: CLIENT_ID,
          trainerId: TRAINER_ID,
          serviceId: SERVICE_ID,
          startTime: futureDate,
          endTime: expectedEndTime,
          status: BookingStatus.PENDING,
        };

        bookingRepository.create.mockReturnValue(savedBooking as any);
        bookingRepository.save.mockResolvedValue(savedBooking as any);

        const result = await service.create(CLIENT_ID, createBookingDto);

        expect(result).toEqual(savedBooking);
        expect(bookingRepository.create).toHaveBeenCalledWith({
          clientId: CLIENT_ID,
          trainerId: TRAINER_ID,
          serviceId: SERVICE_ID,
          startTime: futureDate,
          endTime: expectedEndTime,
          status: BookingStatus.PENDING,
        });
      });

      it("should ignore CANCELLED bookings when checking conflicts", async () => {
        const queryBuilder = {
          where: jest.fn().mockReturnThis(),
          andWhere: jest.fn().mockReturnThis(),
          getOne: jest.fn().mockResolvedValue(null),
        };

        bookingRepository.createQueryBuilder.mockReturnValue(queryBuilder as any);
        unavailabilityRepository.createQueryBuilder.mockReturnValue(queryBuilder as any);

        bookingRepository.create.mockReturnValue({} as any);
        bookingRepository.save.mockResolvedValue({} as any);

        await service.create(CLIENT_ID, createBookingDto);

        expect(queryBuilder.andWhere).toHaveBeenCalledWith("booking.status != :cancelledStatus", {
          cancelledStatus: BookingStatus.CANCELLED,
        });
      });
    });

    describe("error handling", () => {
      it("should wrap unexpected errors in InternalServerErrorException", async () => {
        bookingBanRepository.findOne.mockRejectedValue(new Error("Database connection failed"));

        await expect(service.create(CLIENT_ID, createBookingDto)).rejects.toThrow(
          new InternalServerErrorException("Failed to create booking. Please try again later.")
        );
      });
    });
  });

  describe("approveBooking", () => {
    const mockBooking = {
      id: BOOKING_ID,
      clientId: CLIENT_ID,
      trainerId: TRAINER_ID,
      serviceId: SERVICE_ID,
      startTime: new Date(),
      endTime: new Date(),
      status: BookingStatus.PENDING,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as Booking;

    it("should successfully approve a pending booking", async () => {
      bookingRepository.findOne.mockResolvedValue(mockBooking);
      const approvedBooking = { ...mockBooking, status: BookingStatus.ACCEPTED };
      bookingRepository.save.mockResolvedValue(approvedBooking);

      const result = await service.approveBooking(BOOKING_ID, TRAINER_ID);

      expect(result.status).toBe(BookingStatus.ACCEPTED);
      expect(bookingRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          status: BookingStatus.ACCEPTED,
        })
      );
    });

    it("should throw NotFoundException when booking does not exist", async () => {
      bookingRepository.findOne.mockResolvedValue(null);

      await expect(service.approveBooking(BOOKING_ID, TRAINER_ID)).rejects.toThrow(
        new NotFoundException("Booking not found")
      );
    });

    it("should throw NotFoundException when trainer does not own the booking", async () => {
      const otherTrainerBooking = { ...mockBooking, trainerId: "other-trainer-uuid" };
      bookingRepository.findOne.mockResolvedValue(otherTrainerBooking);

      await expect(service.approveBooking(BOOKING_ID, TRAINER_ID)).rejects.toThrow(
        new NotFoundException("Booking not found")
      );
    });

    it("should throw ConflictException when booking is not in PENDING status", async () => {
      const acceptedBooking = { ...mockBooking, status: BookingStatus.ACCEPTED };
      bookingRepository.findOne.mockResolvedValue(acceptedBooking);

      await expect(service.approveBooking(BOOKING_ID, TRAINER_ID)).rejects.toThrow(
        new ConflictException("Booking is not in PENDING status")
      );
    });

    it("should wrap unexpected errors in InternalServerErrorException", async () => {
      bookingRepository.findOne.mockRejectedValue(new Error("Database error"));

      await expect(service.approveBooking(BOOKING_ID, TRAINER_ID)).rejects.toThrow(
        new InternalServerErrorException("Failed to approve booking. Please try again later.")
      );
    });
  });

  describe("rejectBooking", () => {
    const mockBooking = {
      id: BOOKING_ID,
      clientId: CLIENT_ID,
      trainerId: TRAINER_ID,
      serviceId: SERVICE_ID,
      startTime: new Date(),
      endTime: new Date(),
      status: BookingStatus.PENDING,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as Booking;

    it("should successfully reject a pending booking", async () => {
      bookingRepository.findOne.mockResolvedValue(mockBooking);
      const rejectedBooking = { ...mockBooking, status: BookingStatus.REJECTED };
      bookingRepository.save.mockResolvedValue(rejectedBooking);

      const result = await service.rejectBooking(BOOKING_ID, TRAINER_ID);

      expect(result.status).toBe(BookingStatus.REJECTED);
      expect(bookingRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          status: BookingStatus.REJECTED,
        })
      );
    });

    it("should throw NotFoundException when booking does not exist", async () => {
      bookingRepository.findOne.mockResolvedValue(null);

      await expect(service.rejectBooking(BOOKING_ID, TRAINER_ID)).rejects.toThrow(
        new NotFoundException("Booking not found")
      );
    });

    it("should throw NotFoundException when trainer does not own the booking", async () => {
      const otherTrainerBooking = { ...mockBooking, trainerId: "other-trainer-uuid" };
      bookingRepository.findOne.mockResolvedValue(otherTrainerBooking);

      await expect(service.rejectBooking(BOOKING_ID, TRAINER_ID)).rejects.toThrow(
        new NotFoundException("Booking not found")
      );
    });

    it("should throw ConflictException when booking is not in PENDING status", async () => {
      const rejectedBooking = { ...mockBooking, status: BookingStatus.REJECTED };
      bookingRepository.findOne.mockResolvedValue(rejectedBooking);

      await expect(service.rejectBooking(BOOKING_ID, TRAINER_ID)).rejects.toThrow(
        new ConflictException("Booking is not in PENDING status")
      );
    });
  });

  describe("cancelBooking", () => {
    // 24 hours from now
    const futureDate = new Date(Date.now() + 86400000);
    const mockBooking = {
      id: BOOKING_ID,
      clientId: CLIENT_ID,
      trainerId: TRAINER_ID,
      serviceId: SERVICE_ID,
      startTime: futureDate,
      endTime: new Date(futureDate.getTime() + 3600000),
      status: BookingStatus.ACCEPTED,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as Booking;

    afterEach(() => {
      // Restore all mocks after each test
      jest.restoreAllMocks();
    });

    it("should successfully cancel an accepted booking by client", async () => {
      const acceptedBooking = { ...mockBooking, status: BookingStatus.ACCEPTED };
      bookingRepository.findOne.mockResolvedValue(acceptedBooking);
      const cancelledBooking = { ...acceptedBooking, status: BookingStatus.CANCELLED };
      bookingRepository.save.mockResolvedValue(cancelledBooking);

      const result = await service.cancelBooking(BOOKING_ID, CLIENT_ID);

      expect(result.status).toBe(BookingStatus.CANCELLED);
      expect(bookingRepository.save).toHaveBeenCalled();
    });

    it("should successfully cancel an accepted booking by trainer", async () => {
      const acceptedBooking = { ...mockBooking, status: BookingStatus.ACCEPTED };
      bookingRepository.findOne.mockResolvedValue(acceptedBooking);
      const cancelledBooking = { ...acceptedBooking, status: BookingStatus.CANCELLED };
      bookingRepository.save.mockResolvedValue(cancelledBooking);

      const result = await service.cancelBooking(BOOKING_ID, TRAINER_ID);

      expect(result.status).toBe(BookingStatus.CANCELLED);
      expect(bookingBansService.create).not.toHaveBeenCalled();
    });

    it("should throw NotFoundException when booking does not exist", async () => {
      bookingRepository.findOne.mockResolvedValue(null);

      await expect(service.cancelBooking(BOOKING_ID, CLIENT_ID)).rejects.toThrow(
        new NotFoundException("Booking not found")
      );
    });

    it("should throw NotFoundException when user is not part of the booking", async () => {
      const acceptedBooking = { ...mockBooking, status: BookingStatus.ACCEPTED };
      bookingRepository.findOne.mockResolvedValue(acceptedBooking);
      const unauthorizedUserId = "unauthorized-user-uuid";

      await expect(service.cancelBooking(BOOKING_ID, unauthorizedUserId)).rejects.toThrow(
        new NotFoundException("Booking not found")
      );
    });

    it("should successfully cancel a PENDING booking by client", async () => {
      const pendingBooking = { ...mockBooking, status: BookingStatus.PENDING };
      bookingRepository.findOne.mockResolvedValue(pendingBooking);
      const cancelledBooking = { ...pendingBooking, status: BookingStatus.CANCELLED };
      bookingRepository.save.mockResolvedValue(cancelledBooking);

      const result = await service.cancelBooking(BOOKING_ID, CLIENT_ID);

      expect(result.status).toBe(BookingStatus.CANCELLED);
      expect(bookingRepository.save).toHaveBeenCalled();
    });

    it("should throw ConflictException when booking is REJECTED", async () => {
      const rejectedBooking = { ...mockBooking, status: BookingStatus.REJECTED };
      bookingRepository.findOne.mockResolvedValue(rejectedBooking);

      await expect(service.cancelBooking(BOOKING_ID, CLIENT_ID)).rejects.toThrow(
        new ConflictException("Booking is not in ACCEPTED or PENDING status")
      );
    });

    describe("late cancellation penalty", () => {
      it("should apply 7-day ban when client cancels less than 12 hours before start", async () => {
        const now = new Date("2024-01-01T10:00:00Z");
        // 10 hours from now
        const startTime = new Date("2024-01-01T20:00:00Z");
        const lateBooking = {
          ...mockBooking,
          startTime,
          clientId: CLIENT_ID,
          status: BookingStatus.ACCEPTED,
        };

        // Mock Date constructor only for this test
        const RealDate = Date;
        const mockDate = jest.fn((dateStr?: any) => {
          if (dateStr !== undefined) {
            return new RealDate(dateStr);
          }
          return now;
        }) as any;
        mockDate.now = () => now.getTime();
        mockDate.prototype = RealDate.prototype;
        global.Date = mockDate;

        bookingRepository.findOne.mockResolvedValue(lateBooking);
        bookingRepository.save.mockResolvedValue({ ...lateBooking, status: BookingStatus.CANCELLED });
        bookingBansService.create.mockResolvedValue({} as any);

        await service.cancelBooking(BOOKING_ID, CLIENT_ID);

        expect(bookingBansService.create).toHaveBeenCalledWith({
          clientId: CLIENT_ID,
          trainerId: TRAINER_ID,
          bannedUntil: expect.any(RealDate),
        });

        const banCall = bookingBansService.create.mock.calls[0][0];
        const bannedUntil = new RealDate(banCall.bannedUntil);
        const expectedBanDate = new RealDate(now.getTime() + 7 * 24 * 60 * 60 * 1000);

        expect(bannedUntil.getTime()).toBe(expectedBanDate.getTime());

        // Restore Date
        global.Date = RealDate;
      });

      it("should NOT apply ban when client cancels a PENDING booking less than 12 hours before start", async () => {
        const now = new Date("2024-01-01T10:00:00Z");
        // 10 hours from now
        const startTime = new Date("2024-01-01T20:00:00Z");
        const latePendingBooking = {
          ...mockBooking,
          startTime,
          clientId: CLIENT_ID,
          status: BookingStatus.PENDING,
        };

        // Mock Date constructor only for this test
        const RealDate = Date;
        const mockDate = jest.fn((dateStr?: any) => {
          if (dateStr !== undefined) {
            return new RealDate(dateStr);
          }
          return now;
        }) as any;
        mockDate.now = () => now.getTime();
        mockDate.prototype = RealDate.prototype;
        global.Date = mockDate;

        bookingRepository.findOne.mockResolvedValue(latePendingBooking);
        bookingRepository.save.mockResolvedValue({
          ...latePendingBooking,
          status: BookingStatus.CANCELLED,
        });

        await service.cancelBooking(BOOKING_ID, CLIENT_ID);

        expect(bookingBansService.create).not.toHaveBeenCalled();

        // Restore Date
        global.Date = RealDate;
      });

      it("should NOT apply ban when client cancels more than 12 hours before start", async () => {
        // 48 hours from now
        const farFutureDate = new Date(Date.now() + 2 * 86400000);
        const earlyBooking = {
          ...mockBooking,
          startTime: farFutureDate,
          status: BookingStatus.ACCEPTED,
        };

        bookingRepository.findOne.mockResolvedValue(earlyBooking);
        bookingRepository.save.mockResolvedValue({ ...earlyBooking, status: BookingStatus.CANCELLED });

        await service.cancelBooking(BOOKING_ID, CLIENT_ID);

        expect(bookingBansService.create).not.toHaveBeenCalled();
      });

      it("should NOT apply ban when trainer cancels the booking", async () => {
        // 1 hour from now
        const soonDate = new Date(Date.now() + 3600000);
        const soonBooking = {
          ...mockBooking,
          startTime: soonDate,
          status: BookingStatus.ACCEPTED,
        };

        bookingRepository.findOne.mockResolvedValue(soonBooking);
        bookingRepository.save.mockResolvedValue({ ...soonBooking, status: BookingStatus.CANCELLED });

        await service.cancelBooking(BOOKING_ID, TRAINER_ID);

        expect(bookingBansService.create).not.toHaveBeenCalled();
      });
    });
  });

  describe("findUserBookings", () => {
    const queryDto: GetBookingsQueryDto = {
      page: 1,
      limit: 10,
    };

    beforeEach(() => {
      const queryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
      };

      bookingRepository.createQueryBuilder.mockReturnValue(queryBuilder as any);
    });

    it("should retrieve bookings for user as both client and trainer by default", async () => {
      const queryBuilder = bookingRepository.createQueryBuilder();

      await service.findUserBookings(CLIENT_ID, queryDto);

      expect(queryBuilder.where).toHaveBeenCalledWith("(booking.clientId = :userId OR booking.trainerId = :userId)", {
        userId: CLIENT_ID,
      });
    });

    it("should filter bookings by CLIENT role when specified", async () => {
      const queryBuilder = bookingRepository.createQueryBuilder();
      const clientRoleQuery = { ...queryDto, role: UserBookingRole.CLIENT };

      await service.findUserBookings(CLIENT_ID, clientRoleQuery);

      expect(queryBuilder.where).toHaveBeenCalledWith("booking.clientId = :userId", { userId: CLIENT_ID });
    });

    it("should filter bookings by TRAINER role when specified", async () => {
      const queryBuilder = bookingRepository.createQueryBuilder();
      const trainerRoleQuery = { ...queryDto, role: UserBookingRole.TRAINER };

      await service.findUserBookings(TRAINER_ID, trainerRoleQuery);

      expect(queryBuilder.where).toHaveBeenCalledWith("booking.trainerId = :userId", { userId: TRAINER_ID });
    });

    it("should filter bookings by status when provided", async () => {
      const queryBuilder = bookingRepository.createQueryBuilder();
      const statusQuery = { ...queryDto, status: [BookingStatus.PENDING, BookingStatus.ACCEPTED] };

      await service.findUserBookings(CLIENT_ID, statusQuery);

      expect(queryBuilder.andWhere).toHaveBeenCalledWith("booking.status IN (:...status)", {
        status: [BookingStatus.PENDING, BookingStatus.ACCEPTED],
      });
    });

    it("should filter UPCOMING bookings when timeFilter is UPCOMING", async () => {
      const queryBuilder = bookingRepository.createQueryBuilder();
      const upcomingQuery = { ...queryDto, timeFilter: TimeFilter.UPCOMING };

      await service.findUserBookings(CLIENT_ID, upcomingQuery);

      // Check that andWhere was called with the correct SQL and a Date parameter
      const andWhereCalls = (queryBuilder.andWhere as jest.Mock).mock.calls;
      const relevantCall = andWhereCalls.find((call) => call[0] === "booking.startTime > :now");

      expect(relevantCall).toBeDefined();
      expect(relevantCall[1]).toHaveProperty("now");
      expect(relevantCall[1].now).toBeInstanceOf(Date);
      expect(queryBuilder.orderBy).toHaveBeenCalledWith("booking.startTime", "ASC");
    });

    it("should filter PAST bookings when timeFilter is PAST", async () => {
      const queryBuilder = bookingRepository.createQueryBuilder();
      const pastQuery = { ...queryDto, timeFilter: TimeFilter.PAST };

      await service.findUserBookings(CLIENT_ID, pastQuery);

      // Check that andWhere was called with the correct SQL and a Date parameter
      const andWhereCalls = (queryBuilder.andWhere as jest.Mock).mock.calls;
      const relevantCall = andWhereCalls.find((call) => call[0] === "booking.startTime < :now");

      expect(relevantCall).toBeDefined();
      expect(relevantCall[1]).toHaveProperty("now");
      expect(relevantCall[1].now).toBeInstanceOf(Date);
      expect(queryBuilder.orderBy).toHaveBeenCalledWith("booking.startTime", "DESC");
    });

    it("should apply pagination correctly", async () => {
      const queryBuilder = bookingRepository.createQueryBuilder();
      const paginationQuery = { ...queryDto, page: 3, limit: 20 };

      await service.findUserBookings(CLIENT_ID, paginationQuery);

      // (3 - 1) * 20
      expect(queryBuilder.skip).toHaveBeenCalledWith(40);
      expect(queryBuilder.take).toHaveBeenCalledWith(20);
    });

    it("should return paginated response with bookings and metadata", async () => {
      const mockBookings = [
        {
          id: BOOKING_ID,
          startTime: new Date(),
          endTime: new Date(),
          status: BookingStatus.PENDING,
          client: { id: CLIENT_ID, name: "Client", email: "client@test.com" },
          trainer: { id: TRAINER_ID, name: "Trainer", email: "trainer@test.com" },
          service: { id: SERVICE_ID, serviceType: { name: "Consultation" } },
        },
      ];

      const queryBuilder = bookingRepository.createQueryBuilder();
      (queryBuilder.getManyAndCount as jest.Mock).mockResolvedValue([mockBookings, 1]);

      const result = await service.findUserBookings(CLIENT_ID, queryDto);

      expect(result).toHaveProperty("data");
      expect(result).toHaveProperty("meta");
      expect(result.data).toHaveLength(1);
      expect(result.meta.totalItems).toBe(1);
    });

    it("should wrap unexpected errors in InternalServerErrorException", async () => {
      // Create a fresh query builder for this test that will throw
      const errorQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockRejectedValue(new Error("Database error")),
      };

      bookingRepository.createQueryBuilder.mockReturnValue(errorQueryBuilder as any);

      await expect(service.findUserBookings(CLIENT_ID, queryDto)).rejects.toThrow(
        new InternalServerErrorException("Failed to retrieve bookings. Please try again later.")
      );
    });
  });

  describe("getBookingById", () => {
    const mockBooking = {
      id: BOOKING_ID,
      clientId: CLIENT_ID,
      trainerId: TRAINER_ID,
      serviceId: SERVICE_ID,
      startTime: new Date(),
      endTime: new Date(),
      status: BookingStatus.ACCEPTED,
      createdAt: new Date(),
      updatedAt: new Date(),
      client: {
        id: CLIENT_ID,
        name: "Client Name",
        email: "client@test.com",
      } as User,
      trainer: {
        id: TRAINER_ID,
        name: "Trainer Name",
        email: "trainer@test.com",
      } as User,
      service: mockService,
    } as Booking;

    it("should retrieve booking details for client", async () => {
      bookingRepository.findOne.mockResolvedValue(mockBooking);

      const result = await service.getBookingById(BOOKING_ID, CLIENT_ID);

      expect(result).toHaveProperty("id", BOOKING_ID);
      expect(result).toHaveProperty("clientName", "Client Name");
      expect(result).toHaveProperty("trainerName", "Trainer Name");
      expect(bookingRepository.findOne).toHaveBeenCalledWith({
        where: { id: BOOKING_ID },
        relations: ["client", "trainer", "service"],
      });
    });

    it("should retrieve booking details for trainer", async () => {
      bookingRepository.findOne.mockResolvedValue(mockBooking);

      const result = await service.getBookingById(BOOKING_ID, TRAINER_ID);

      expect(result).toHaveProperty("id", BOOKING_ID);
    });

    it("should throw NotFoundException when booking does not exist", async () => {
      bookingRepository.findOne.mockResolvedValue(null);

      await expect(service.getBookingById(BOOKING_ID, CLIENT_ID)).rejects.toThrow(
        new NotFoundException("Booking not found")
      );
    });

    it("should throw ForbiddenException when user is not part of the booking", async () => {
      bookingRepository.findOne.mockResolvedValue(mockBooking);
      const unauthorizedUserId = "unauthorized-user-uuid";

      await expect(service.getBookingById(BOOKING_ID, unauthorizedUserId)).rejects.toThrow(
        new ForbiddenException("Access denied to this booking")
      );
    });

    it("should wrap unexpected errors in InternalServerErrorException", async () => {
      // Mock findOne to throw a synchronous error (not a promise rejection)
      bookingRepository.findOne.mockImplementation(() => {
        throw new Error("Database error");
      });

      await expect(service.getBookingById(BOOKING_ID, CLIENT_ID)).rejects.toThrow(
        new InternalServerErrorException("Failed to retrieve booking details. Please try again later.")
      );
    });
  });
});
