<script setup lang="ts">
import { ref, watch } from "vue";
import { useDebounceFn } from "@vueuse/core";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import type { TrainingPlanDetails, ClientSimpleDTO } from "@/types/training-plans";
import { PlanStatus } from "@/types/training-plans";
import { Save, Loader2 } from "lucide-vue-next";

const props = defineProps<{
  plan: TrainingPlanDetails;
  clients: ClientSimpleDTO[];
  savingStatus: "saved" | "saving" | "error";
}>();

const emit = defineEmits<{
  (e: "update", data: { name?: string; clientId?: string; status?: PlanStatus }): void;
}>();

const localName = ref(props.plan.name);

// Sync local name if prop changes
watch(
  () => props.plan.name,
  (newVal) => {
    if (newVal !== localName.value) {
      localName.value = newVal;
    }
  }
);

const debouncedUpdateName = useDebounceFn((name: string) => {
  emit("update", { name });
}, 500);

const handleNameInput = (e: Event) => {
  const target = e.target as HTMLInputElement;
  localName.value = target.value;
  debouncedUpdateName(target.value);
};

const handleStatusChange = () => {
  const newStatus =
    props.plan.status === PlanStatus.ACTIVE ? PlanStatus.ARCHIVED : PlanStatus.ACTIVE;
  emit("update", { status: newStatus });
};

const handleClientChange = (clientId: string) => {
  emit("update", { clientId });
};
</script>

<template>
  <div class="flex items-center justify-between gap-4 p-4 border-b bg-card">
    <div class="flex items-center gap-4 flex-1">
      <Input
        v-model="localName"
        @input="handleNameInput"
        class="text-lg font-semibold h-10 w-full max-w-md"
        placeholder="Nazwa planu"
      />

      <div class="w-[200px]">
        <Select
          :model-value="plan.clientId || undefined"
          @update:model-value="(val) => handleClientChange(val as string)"
        >
          <SelectTrigger>
            <SelectValue placeholder="Wybierz klienta" />
          </SelectTrigger>
          <SelectContent>
            <template v-if="clients.length > 0">
              <SelectItem v-for="client in clients" :key="client.id" :value="client.id">
                {{ client.name }}
              </SelectItem>
            </template>
            <div v-else class="p-2 text-sm text-muted-foreground text-center">Brak klientów</div>
          </SelectContent>
        </Select>
      </div>
    </div>

    <div class="flex items-center gap-3">
      <Badge
        :variant="plan.status === PlanStatus.ACTIVE ? 'default' : 'secondary'"
        class="cursor-pointer"
        @click="handleStatusChange"
      >
        {{ plan.status === PlanStatus.ACTIVE ? "AKTYWNY" : "ZARCHIWIZOWANY" }}
      </Badge>

      <div class="flex items-center text-xs text-muted-foreground w-24 justify-end">
        <span v-if="savingStatus === 'saving'" class="flex items-center gap-1">
          <Loader2 class="w-3 h-3 animate-spin" /> Zapisywanie...
        </span>
        <span v-else-if="savingStatus === 'saved'" class="flex items-center gap-1 text-green-600">
          <Save class="w-3 h-3" /> Zapisano
        </span>
        <span v-else class="text-destructive">Błąd</span>
      </div>
    </div>
  </div>
</template>
