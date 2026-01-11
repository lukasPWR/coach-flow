import { ref, reactive, watch } from "vue";
import { bookingsApi } from "@/lib/api/bookings";
import type { BookingDto, BookingViewModel, PaginationMeta, BookingStatus } from "@/types/bookings";
import { mockBookings } from "@/mocks/bookings";

interface UseBookingsParams {
  role?: "client" | "trainer";
  initialStatus?: BookingStatus[];
  initialTimeFilter?: "upcoming" | "past";
  // Add this flag
  useMock?: boolean;
}

export function useBookings(params: UseBookingsParams) {
  const bookings = ref<BookingViewModel[]>([]);
  const isLoading = ref(false);
  const pagination = ref<PaginationMeta>({
    totalItems: 0,
    itemCount: 0,
    itemsPerPage: 10,
    totalPages: 0,
    currentPage: 1,
  });

  const filters = reactive({
    status: params.initialStatus || [],
    timeFilter: params.initialTimeFilter,
    page: 1,
    limit: 10,
  });

  const formatBooking = (booking: BookingDto): BookingViewModel => {
    const start = new Date(booking.startTime);
    const now = new Date();

    // Check if future
    const isUpcoming = start > now && booking.status === "ACCEPTED";

    // Logic for cancel/reschedule based on status and time
    // Generally can cancel if pending or accepted and in future
    const canCancel = ["PENDING", "ACCEPTED"].includes(booking.status) && start > now;

    // Can reschedule if accepted and in future
    const canReschedule = ["ACCEPTED"].includes(booking.status) && start > now;

    return {
      ...booking,
      isUpcoming,
      canCancel,
      canReschedule,
      formattedDate: new Intl.DateTimeFormat("pl-PL", {
        weekday: "long",
        day: "numeric",
        month: "long",
      }).format(start),
      formattedTime: new Intl.DateTimeFormat("pl-PL", {
        hour: "2-digit",
        minute: "2-digit",
      }).format(start),
    };
  };

  const fetchBookings = async () => {
    isLoading.value = true;
    try {
      let data: BookingDto[] = [];
      let meta: PaginationMeta | undefined;

      if (params.useMock) {
        // Simulate API delay
        await new Promise((resolve) => setTimeout(resolve, 800));

        // Filter mocks based on params
        data = mockBookings.filter((b) => {
          const statusMatch = params.initialStatus?.length
            ? params.initialStatus.includes(b.status)
            : true;

          const timeMatch =
            params.initialTimeFilter === "upcoming"
              ? new Date(b.startTime) > new Date()
              : params.initialTimeFilter === "past"
                ? new Date(b.startTime) < new Date() || ["REJECTED", "CANCELLED"].includes(b.status)
                : true;

          return statusMatch && timeMatch;
        });

        meta = {
          totalItems: data.length,
          itemCount: data.length,
          itemsPerPage: 10,
          totalPages: 1,
          currentPage: 1,
        };
      } else {
        const response = await bookingsApi.getBookings({
          role: params.role,
          status: filters.status,
          timeFilter: filters.timeFilter,
          page: filters.page,
          limit: filters.limit,
        });
        data = response.data;
        meta = response.meta;
      }

      bookings.value = data.map(formatBooking);

      // Sort by date: Descending for history (past), Ascending for others
      bookings.value.sort((a, b) => {
        const dateA = new Date(a.startTime).getTime();
        const dateB = new Date(b.startTime).getTime();
        if (filters.timeFilter === "past") {
          return dateB - dateA;
        }
        return dateA - dateB;
      });

      // Update pagination
      if (meta) {
        pagination.value = meta;
      }
    } catch (error) {
      console.error("Failed to fetch bookings:", error);
      // We could add error state handling here
    } finally {
      isLoading.value = false;
    }
  };

  const nextPage = () => {
    if (filters.page < pagination.value.totalPages) {
      filters.page++;
    }
  };

  const prevPage = () => {
    if (filters.page > 1) {
      filters.page--;
    }
  };

  const refresh = () => fetchBookings();

  // Watch for page changes
  watch(() => filters.page, fetchBookings);

  return {
    bookings,
    isLoading,
    pagination,
    filters,
    fetchBookings,
    nextPage,
    prevPage,
    refresh,
  };
}
