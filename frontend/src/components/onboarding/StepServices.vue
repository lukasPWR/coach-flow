<script setup lang="ts">
import { ref, reactive } from "vue";
import { useOnboarding } from "@/composables/useOnboarding";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Plus, Trash2, Clock, Banknote } from "lucide-vue-next";
import type { CreateServiceDto } from "@/types/onboarding";

const { state, serviceTypes, addService, removeService } = useOnboarding();

const isDialogOpen = ref(false);
const newService = reactive<CreateServiceDto>({
  serviceTypeId: "",
  price: 0,
  durationMinutes: 60,
});

const resetForm = () => {
  newService.serviceTypeId = "";
  newService.price = 0;
  newService.durationMinutes = 60;
};

const handleAddService = async () => {
  if (!newService.serviceTypeId || newService.price <= 0) return;

  await addService({ ...newService });
  isDialogOpen.value = false;
  resetForm();
};

const getServiceName = (service: any) => {
  if (service.serviceType?.name) return service.serviceType.name;
  if (service.name) return service.name;
  if (service.serviceTypeId)
    return serviceTypes.value.find((t) => t.id === service.serviceTypeId)?.name;
  return "Nieznana usługa";
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("pl-PL", { style: "currency", currency: "PLN" }).format(amount);
};
</script>

<template>
  <div class="space-y-6">
    <div class="flex justify-between items-center">
      <h3 class="text-lg font-medium">Twoje usługi</h3>
      <Dialog v-model:open="isDialogOpen">
        <DialogTrigger as-child>
          <Button size="sm"
class="gap-2">
            <Plus class="w-4 h-4" />
            Dodaj usługę
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Dodaj nową usługę</DialogTitle>
            <DialogDescription>
              Zdefiniuj rodzaj usługi, cenę oraz czas trwania.
            </DialogDescription>
          </DialogHeader>

          <div class="grid gap-4 py-4">
            <div class="grid gap-2">
              <Label html-for="serviceType">Typ usługi</Label>
              <Select v-model="newService.serviceTypeId">
                <SelectTrigger id="serviceType">
                  <SelectValue placeholder="Wybierz typ usługi" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem v-for="type in serviceTypes"
:key="type.id" :value="type.id">
                    {{ type.name }}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div class="grid gap-2">
                <Label html-for="price">Cena (PLN)</Label>
                <Input
                  id="price"
                  v-model.number="newService.price"
                  type="number"
                  min="0"
                  step="1"
                />
              </div>
              <div class="grid gap-2">
                <Label html-for="duration">Czas (min)</Label>
                <Input
                  id="duration"
                  v-model.number="newService.durationMinutes"
                  type="number"
                  min="15"
                  step="15"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
variant="outline" @click="isDialogOpen = false"> Anuluj </Button>
            <Button
              :disabled="!newService.serviceTypeId || newService.price <= 0"
              @click="handleAddService"
            >
              Dodaj
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>

    <!-- Empty State -->
    <div
      v-if="state.addedServices.length === 0"
      class="text-center py-12 border-2 border-dashed rounded-lg bg-muted/50"
    >
      <p class="text-muted-foreground">Nie dodałeś jeszcze żadnych usług.</p>
      <p class="text-sm text-muted-foreground">Kliknij "Dodaj usługę", aby zdefiniować ofertę.</p>
    </div>

    <!-- Services List -->
    <div v-else
class="grid gap-4 md:grid-cols-2">
      <Card v-for="service in state.addedServices"
:key="service.id" class="relative group">
        <CardHeader class="pb-2">
          <CardTitle class="text-base font-medium flex justify-between items-start">
            <span>{{ getServiceName(service) }}</span>
            <Button
              variant="ghost"
              size="icon"
              class="h-8 w-8 text-muted-foreground hover:text-destructive absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
              @click="removeService(service.id)"
            >
              <Trash2 class="w-4 h-4" />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div class="flex items-center space-x-4 text-sm text-muted-foreground">
            <div class="flex items-center">
              <Banknote class="w-4 h-4 mr-1" />
              {{ formatCurrency(service.price) }}
            </div>
            <div class="flex items-center">
              <Clock class="w-4 h-4 mr-1" />
              {{ service.durationMinutes }} min
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
</template>
