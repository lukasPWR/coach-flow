import { ref, reactive, computed } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import type {
  OnboardingState,
  CreateServiceDto,
  CreateUnavailabilityDto,
  UnavailabilityResponseDto,
} from "@/types/onboarding";
import * as api from "@/lib/api/onboarding";

// Shared state (Singleton pattern for this composable)
const state = reactive<OnboardingState>({
  currentStep: 1,
  isLoading: false,
  profileCreated: false,
  profileData: {
    description: "",
    city: "",
    profilePictureUrl: "",
    specializationIds: [],
  },
  addedServices: [],
});

const specializations = ref<{ id: string; name: string }[]>([]);
const serviceTypes = ref<{ id: string; name: string }[]>([]);
const errors = ref<Record<string, string>>({});
const unavailabilities = ref<UnavailabilityResponseDto[]>([]);
const unavailabilitiesLoaded = ref(false);

export function useOnboarding() {
  const router = useRouter();
  const authStore = useAuthStore();

  // Computed
  const isProfileStepValid = computed(() => {
    return (
      state.profileData.city.length > 0 &&
      state.profileData.specializationIds.length > 0 &&
      state.profileData.description.length > 0
    );
  });

  const isServicesStepValid = computed(() => {
    return state.addedServices.length > 0;
  });

  // Actions
  const fetchDictionaries = async () => {
    // If dictionaries are already loaded, don't fetch again
    if (specializations.value.length > 0 && serviceTypes.value.length > 0) return;

    try {
      state.isLoading = true;
      const [specs, types] = await Promise.all([api.getSpecializations(), api.getServiceTypes()]);
      specializations.value = specs;
      serviceTypes.value = types;
    } catch (error) {
      console.error("Failed to fetch dictionaries", error);
    } finally {
      state.isLoading = false;
    }
  };

  const checkExistingProfile = async () => {
    try {
      state.isLoading = true;
      const profile = await api.getMyTrainerProfile();
      if (profile) {
        state.profileCreated = true;
        // If profile exists, fill data
        state.profileData = {
          city: profile.city || "",
          description: profile.description || "",
          profilePictureUrl: profile.profilePictureUrl || "",
          specializationIds: profile.specializations?.map((s: any) => s.id) || [],
        };

        // Also fetch services
        state.addedServices = profile.services || [];

        // Determine which step the user should be on based on completion status
        // Step 1: Profile created
        // Step 2: Services added
        // Step 3: Availability (last step, always accessible if steps 1&2 done)

        if (state.addedServices.length > 0) {
          // Profile exists AND services added -> go to step 3 (availability)
          state.currentStep = 3;
        } else {
          // Profile exists but NO services -> go to step 2 (services)
          state.currentStep = 2;
        }
      } else {
        // No profile exists -> stay on step 1
        state.currentStep = 1;
      }
    } catch (error) {
      console.error("Failed to check profile", error);
      // If error (e.g., 404 not found), assume no profile and stay on step 1
      state.currentStep = 1;
    } finally {
      state.isLoading = false;
    }
  };

  const submitProfileStep = async () => {
    if (!isProfileStepValid.value) return;

    // Clean payload: empty strings for optional fields should be undefined to pass backend validation
    const payload = {
      ...state.profileData,
      profilePictureUrl: state.profileData.profilePictureUrl?.trim() || undefined,
    };

    try {
      state.isLoading = true;
      await api.createTrainerProfile(payload);
      state.profileCreated = true;
      state.currentStep = 2;
    } catch (error: any) {
      if (error.response?.status === 409) {
        // Profile already exists
        state.profileCreated = true;
        state.currentStep = 2;
      } else {
        console.error("Failed to create profile", error);
        errors.value = { global: error.response?.data?.message || "Failed to create profile" };
      }
    } finally {
      state.isLoading = false;
    }
  };

  const addService = async (serviceData: CreateServiceDto) => {
    try {
      state.isLoading = true;

      // We need trainerId for the backend DTO validation
      // Even though backend gets userId from token, DTO @IsNotEmpty on trainerId blocks request
      let trainerId = authStore.trainerProfile?.id;
      if (!trainerId) {
        const profile = await api.getMyTrainerProfile();
        trainerId = profile?.id;
      }

      if (!trainerId) {
        throw new Error("Trainer profile ID missing. Cannot add service.");
      }

      await api.createService({ ...serviceData, trainerId });

      // Refresh services list via profile
      const profile = await api.getMyTrainerProfile();
      state.addedServices = profile?.services || [];
    } catch (error) {
      console.error("Failed to add service", error);
      // Let component handle error display
      throw error;
    } finally {
      state.isLoading = false;
    }
  };

  const removeService = async (serviceId: string) => {
    try {
      state.isLoading = true;
      await api.deleteService(serviceId);
      // Refresh services list via profile
      const profile = await api.getMyTrainerProfile();
      state.addedServices = profile?.services || [];
    } catch (error) {
      console.error("Failed to remove service", error);
    } finally {
      state.isLoading = false;
    }
  };

  const fetchUnavailabilities = async (force = false) => {
    // If already loaded and not forcing refresh, skip
    if (unavailabilitiesLoaded.value && !force) {
      return;
    }

    try {
      state.isLoading = true;
      unavailabilities.value = await api.getUnavailabilities();
      unavailabilitiesLoaded.value = true;
    } catch (error) {
      console.error("Failed to fetch unavailabilities", error);
    } finally {
      state.isLoading = false;
    }
  };

  const submitUnavailability = async (data: CreateUnavailabilityDto) => {
    try {
      state.isLoading = true;
      await api.createUnavailability(data);
      // Force refresh list after adding
      await fetchUnavailabilities(true);
    } catch (error) {
      console.error("Failed to add unavailability", error);
      throw error;
    } finally {
      state.isLoading = false;
    }
  };

  const removeUnavailability = async (id: string) => {
    try {
      state.isLoading = true;
      await api.deleteUnavailability(id);
      // Force refresh list after removing
      await fetchUnavailabilities(true);
    } catch (error) {
      console.error("Failed to remove unavailability", error);
      throw error;
    } finally {
      state.isLoading = false;
    }
  };

  const finishOnboarding = async () => {
    await authStore.refreshTrainerProfile();
    router.push("/trainer/dashboard");
    // Optional: Reset state after finishing?
    // resetState()
  };

  const nextStep = () => {
    if (state.currentStep === 1 && state.profileCreated) {
      state.currentStep = 2;
    } else if (state.currentStep === 2 && isServicesStepValid.value) {
      state.currentStep = 3;
    }
  };

  const prevStep = () => {
    if (state.currentStep > 1) {
      state.currentStep--;
    }
  };

  const resetState = () => {
    state.currentStep = 1;
    state.isLoading = false;
    state.profileCreated = false;
    state.profileData = {
      description: "",
      city: "",
      profilePictureUrl: "",
      specializationIds: [],
    };
    state.addedServices = [];
    specializations.value = [];
    serviceTypes.value = [];
    errors.value = {};
    unavailabilities.value = [];
    unavailabilitiesLoaded.value = false;
  };

  return {
    state,
    errors,
    specializations,
    serviceTypes,
    unavailabilities,
    isProfileStepValid,
    isServicesStepValid,
    fetchDictionaries,
    checkExistingProfile,
    submitProfileStep,
    addService,
    removeService,
    fetchUnavailabilities,
    submitUnavailability,
    removeUnavailability,
    nextStep,
    prevStep,
    finishOnboarding,
    resetState,
  };
}
