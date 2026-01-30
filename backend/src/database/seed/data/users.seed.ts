import { UserRole } from "../../../users/entities/user.entity";

/**
 * Seed data for demo users
 * Passwords will be hashed during seeding
 */
export interface UserSeedData {
  name: string;
  email: string;
  password: string;
  role: UserRole;
}

export const USERS_SEED: UserSeedData[] = [
  {
    name: "Administrator",
    email: "admin@coachflow.pl",
    password: "Admin123!",
    role: UserRole.ADMIN,
  },
  {
    name: "Jan Kowalski",
    email: "trener@coachflow.pl",
    password: "Trener123!",
    role: UserRole.TRAINER,
  },
  {
    name: "Anna Nowak",
    email: "klient@coachflow.pl",
    password: "Klient123!",
    role: UserRole.CLIENT,
  },
];

/**
 * Trainer profile seed data - linked to trainer user
 */
export interface TrainerProfileSeedData {
  trainerEmail: string;
  description: string;
  city: string;
  specializationNames: string[];
}

export const TRAINER_PROFILES_SEED: TrainerProfileSeedData[] = [
  {
    trainerEmail: "trener@coachflow.pl",
    description:
      "Certyfikowany trener personalny z 5-letnim doświadczeniem. Specjalizuję się w treningu siłowym i przygotowaniu motorycznym. Pomagam osiągać cele zarówno początkującym, jak i zaawansowanym sportowcom.",
    city: "Warszawa",
    specializationNames: ["Trening siłowy", "Przygotowanie motoryczne", "Budowa masy mięśniowej"],
  },
];

/**
 * Services seed data - linked to trainer and service types
 */
export interface ServiceSeedData {
  trainerEmail: string;
  serviceTypeName: string;
  price: number;
  durationMinutes: number;
}

export const SERVICES_SEED: ServiceSeedData[] = [
  {
    trainerEmail: "trener@coachflow.pl",
    serviceTypeName: "Trening personalny",
    price: 150,
    durationMinutes: 60,
  },
  {
    trainerEmail: "trener@coachflow.pl",
    serviceTypeName: "Konsultacja dietetyczna",
    price: 100,
    durationMinutes: 45,
  },
  {
    trainerEmail: "trener@coachflow.pl",
    serviceTypeName: "Plan treningowy",
    price: 200,
    durationMinutes: 90,
  },
];
