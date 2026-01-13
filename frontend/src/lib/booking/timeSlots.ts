import { type DateValue, getLocalTimeZone } from "@internationalized/date";
import type { TimeSlot } from "@/types/bookings";

export type WorkHours = {
  start: number;
  end: number;
};

type UnavailabilityRange = {
  startTime: string;
  endTime: string;
};

const addMinutes = (date: Date, minutes: number) => {
  return new Date(date.getTime() + minutes * 60 * 1000);
};

const isSameDay = (left: Date, right: Date) => {
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  );
};

const isSlotInPast = (slotStart: Date, now: Date) => {
  if (!isSameDay(slotStart, now)) return false;
  return slotStart.getTime() <= now.getTime();
};

const overlaps = (start: Date, end: Date, blockStart: Date, blockEnd: Date) => {
  return start < blockEnd && end > blockStart;
};

const getSlotStepMinutes = (durationMinutes: number) => {
  return durationMinutes % 30 === 0 ? 30 : 15;
};

export const buildTimeSlots = ({
  date,
  durationMinutes,
  unavailabilities,
  workHours = { start: 8, end: 20 },
  now = new Date(),
}: {
  date: DateValue;
  durationMinutes: number;
  unavailabilities: UnavailabilityRange[];
  workHours?: WorkHours;
  now?: Date;
}): TimeSlot[] => {
  if (durationMinutes <= 0) return [];

  const slots: TimeSlot[] = [];
  const baseDate = date.toDate(getLocalTimeZone());
  const startOfDay = new Date(baseDate);
  const endOfDay = new Date(baseDate);

  startOfDay.setHours(workHours.start, 0, 0, 0);
  endOfDay.setHours(workHours.end, 0, 0, 0);

  const stepMinutes = getSlotStepMinutes(durationMinutes);

  for (
    let slotStart = new Date(startOfDay);
    slotStart.getTime() + durationMinutes * 60 * 1000 <= endOfDay.getTime();
    slotStart = addMinutes(slotStart, stepMinutes)
  ) {
    if (isSlotInPast(slotStart, now)) {
      continue;
    }

    const slotEnd = addMinutes(slotStart, durationMinutes);
    const isBlocked = unavailabilities.some((unavail) =>
      overlaps(slotStart, slotEnd, new Date(unavail.startTime), new Date(unavail.endTime))
    );

    slots.push({
      start: new Date(slotStart),
      end: slotEnd,
      isAvailable: !isBlocked,
    });
  }

  return slots;
};
