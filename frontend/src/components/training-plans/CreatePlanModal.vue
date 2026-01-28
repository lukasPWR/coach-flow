<script setup lang="ts">
import { watch } from "vue";
import { useForm } from "vee-validate";
import { toTypedSchema } from "@vee-validate/zod";
import * as z from "zod";
import { Loader2 } from "lucide-vue-next";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { type CreatePlanForm, type ClientSimpleDTO } from "@/types/training-plans";

const props = defineProps<{
  isOpen: boolean;
  isLoadingClients: boolean;
  clients: ClientSimpleDTO[];
  isSubmitting: boolean;
}>();

const emit = defineEmits<{
  (e: "update:isOpen", value: boolean): void;
  (e: "submit", values: CreatePlanForm): void;
}>();

const formSchema = toTypedSchema(
  z.object({
    name: z.string().min(3, "Nazwa musi mieć co najmniej 3 znaki"),
    clientId: z.string().min(1, "Wybierz klienta"),
    description: z.string().optional(),
  })
);

const form = useForm({
  validationSchema: formSchema,
});

const onSubmit = form.handleSubmit((values) => {
  emit("submit", values as CreatePlanForm);
});

// Reset form when modal opens
watch(
  () => props.isOpen,
  (newVal) => {
    if (newVal) {
      form.resetForm();
    }
  }
);

const onOpenChange = (value: boolean) => {
  emit("update:isOpen", value);
};
</script>

<template>
  <Dialog :open="isOpen"
@update:open="onOpenChange">
    <DialogContent class="sm:max-w-[500px]">
      <DialogHeader>
        <DialogTitle>Utwórz Plan Treningowy</DialogTitle>
        <DialogDescription>
          Utwórz nowy plan treningowy dla jednego ze swoich podopiecznych.
        </DialogDescription>
      </DialogHeader>

      <form class="space-y-4" @submit="onSubmit">
        <FormField v-slot="{ componentField }"
name="name">
          <FormItem>
            <FormLabel>Nazwa Planu</FormLabel>
            <FormControl>
              <Input type="text"
placeholder="np. Cykl Siłowy 1" v-bind="componentField" />
            </FormControl>
            <FormMessage />
          </FormItem>
        </FormField>

        <FormField v-slot="{ componentField }"
name="clientId">
          <FormItem>
            <FormLabel>Klient</FormLabel>
            <Select v-bind="componentField">
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Wybierz klienta" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem v-for="client in clients"
:key="client.id" :value="client.id">
                  {{ client.name }}
                </SelectItem>
                <div
                  v-if="clients.length === 0 && !isLoadingClients"
                  class="p-2 text-sm text-center text-muted-foreground"
                >
                  Brak dostępnych klientów.
                </div>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        </FormField>

        <FormField v-slot="{ componentField }"
name="description">
          <FormItem>
            <FormLabel>Opis (Opcjonalnie)</FormLabel>
            <FormControl>
              <Textarea
                placeholder="Dodaj notatki do tego planu..."
                class="resize-none"
                v-bind="componentField"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        </FormField>

        <DialogFooter>
          <Button
type="button" variant="secondary" @click="onOpenChange(false)"> Anuluj </Button>
          <Button type="submit"
:disabled="isSubmitting">
            <Loader2 v-if="isSubmitting"
class="mr-2 h-4 w-4 animate-spin" />
            Utwórz Plan
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>
