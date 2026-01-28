<script setup lang="ts">
import { Pencil, Trash2, Package } from "lucide-vue-next";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { Service } from "@/types/services";

interface Props {
  services: Service[];
  serviceTypesMap: Record<string, string>;
  isLoading?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  isLoading: false,
});

const emit = defineEmits<{
  edit: [service: Service];
  delete: [service: Service];
}>();

// Get service type name
// The service object from /trainers/me includes the name directly
// or we can use the serviceTypesMap as fallback
function getServiceTypeName(service: Service): string {
  // First try to get name from serviceType relation
  if (service.serviceType?.name) {
    return service.serviceType.name;
  }
  // Fallback to serviceTypesMap if serviceTypeId is available
  if (service.serviceTypeId) {
    return props.serviceTypesMap[service.serviceTypeId] || "Nieznany typ";
  }
  // Last resort - check if service has name directly (from /trainers/me response)
  if ((service as any).name) {
    return (service as any).name;
  }
  return "Nieznany typ";
}

// Format price
function formatPrice(price: number): string {
  return new Intl.NumberFormat("pl-PL", {
    style: "currency",
    currency: "PLN",
  }).format(price);
}

// Format duration
function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} min`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (remainingMinutes === 0) {
    return `${hours} godz.`;
  }
  return `${hours} godz. ${remainingMinutes} min`;
}
</script>

<template>
  <div class="space-y-4">
    <!-- Loading State -->
    <div v-if="isLoading"
class="space-y-4">
      <Card v-for="i in 3"
:key="i">
        <CardContent class="p-6">
          <div class="flex items-center justify-between">
            <div class="space-y-2 flex-1">
              <Skeleton class="h-5 w-[200px]" />
              <Skeleton class="h-4 w-[150px]" />
            </div>
            <div class="flex gap-2">
              <Skeleton class="h-9 w-9" />
              <Skeleton class="h-9 w-9" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>

    <!-- Services List -->
    <div
      v-else-if="services.length > 0"
      class="space-y-4 md:grid md:grid-cols-2 md:gap-4 md:space-y-0 lg:grid-cols-1"
    >
      <Card v-for="service in services"
:key="service.id" class="hover:shadow-md transition-shadow">
        <CardContent class="p-6">
          <div class="flex items-start justify-between gap-4">
            <!-- Service Info -->
            <div class="flex-1 space-y-2">
              <div class="flex items-center gap-2">
                <h3 class="font-semibold text-lg">
                  {{ getServiceTypeName(service) }}
                </h3>
              </div>

              <div class="flex flex-wrap items-center gap-2">
                <Badge variant="secondary"
class="font-medium">
                  {{ formatPrice(service.price) }}
                </Badge>
                <Badge variant="outline">
                  {{ formatDuration(service.durationMinutes) }}
                </Badge>
              </div>
            </div>

            <!-- Actions -->
            <div class="flex gap-2">
              <Button
                variant="ghost"
                size="icon"
                title="Edytuj usługę"
                @click="emit('edit', service)"
              >
                <Pencil class="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                title="Usuń usługę"
                @click="emit('delete', service)"
              >
                <Trash2 class="h-4 w-4 text-destructive" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>

    <!-- Empty State -->
    <div v-else
class="flex flex-col items-center justify-center py-12 text-center space-y-3">
      <div class="bg-muted/20 p-4 rounded-full">
        <Package class="h-8 w-8 text-muted-foreground" />
      </div>
      <div class="space-y-1">
        <p class="text-lg font-medium">Brak usług</p>
        <p class="text-sm text-muted-foreground max-w-[300px]">
          Nie dodałeś jeszcze żadnych usług. Kliknij "Dodaj usługę", aby rozpocząć.
        </p>
      </div>
      <slot name="empty-action" />
    </div>
  </div>
</template>
