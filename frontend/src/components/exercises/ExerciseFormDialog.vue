<script setup lang="ts">
import { useForm } from "vee-validate";
import { toTypedSchema } from "@vee-validate/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { MuscleGroupType, MUSCLE_GROUP_LABELS } from "@/types/exercises";
import type { CreateExerciseDto } from "@/types/exercises";
import { watch } from "vue";

const props = defineProps<{
  open: boolean;
  isSubmitting: boolean;
}>();

const emit = defineEmits<{
  (_e: "update:open", _value: boolean): void;
  (_e: "submit", _values: CreateExerciseDto): void;
}>();

const formSchema = toTypedSchema(
  z.object({
    name: z
      .string()
      .min(3, "Nazwa musi mieć co najmniej 3 znaki")
      .max(255, "Nazwa jest zbyt długa"),
    muscleGroup: z.nativeEnum(MuscleGroupType, {
      errorMap: () => ({ message: "Wybierz partię mięśniową" }),
    }),
  })
);

const { handleSubmit, errors, resetForm, defineField } = useForm({
  validationSchema: formSchema,
});

const [name, nameAttrs] = defineField("name");
const [muscleGroup] = defineField("muscleGroup");

const onSubmit = handleSubmit((values) => {
  emit("submit", values as CreateExerciseDto);
});

// Reset form when dialog closes
watch(
  () => props.open,
  (isOpen) => {
    if (!isOpen) {
      resetForm();
    }
  }
);
</script>

<template>
  <Dialog :open="open" @update:open="$emit('update:open', $event)">
    <DialogContent class="sm:max-w-[425px]">
      <DialogHeader>
        <DialogTitle>Dodaj nowe ćwiczenie</DialogTitle>
        <DialogDescription>
          Wypełnij formularz, aby dodać nowe ćwiczenie do swojej biblioteki.
        </DialogDescription>
      </DialogHeader>

      <form class="grid gap-4 py-4" @submit="onSubmit">
        <div class="grid gap-2">
          <Label html-for="name">Nazwa ćwiczenia</Label>
          <Input
            id="name"
            v-model="name"
            v-bind="nameAttrs"
            placeholder="np. Wyciskanie na ławce"
            :class="{ 'border-destructive': errors.name }"
          />
          <span v-if="errors.name" class="text-sm text-destructive">
            {{ errors.name }}
          </span>
        </div>

        <div class="grid gap-2">
          <Label>Partia mięśniowa</Label>
          <Select v-model="muscleGroup">
            <SelectTrigger :class="{ 'border-destructive': errors.muscleGroup }">
              <SelectValue placeholder="Wybierz partię" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem v-for="(label, key) in MUSCLE_GROUP_LABELS" :key="key" :value="key">
                {{ label }}
              </SelectItem>
            </SelectContent>
          </Select>
          <span v-if="errors.muscleGroup" class="text-sm text-destructive">
            {{ errors.muscleGroup }}
          </span>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" @click="$emit('update:open', false)">
            Anuluj
          </Button>
          <Button type="submit" :disabled="isSubmitting">
            {{ isSubmitting ? "Zapisywanie..." : "Zapisz" }}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>
