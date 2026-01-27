<script setup lang="ts">
import { ref, watch } from 'vue';
import { useDebounceFn } from '@vueuse/core';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Trash2, GripVertical } from 'lucide-vue-next';
import type { PlanExercise } from '@/types/training-plans';

const props = defineProps<{
  exercise: PlanExercise;
}>();

const emit = defineEmits<{
  (e: 'update', id: string, data: Partial<PlanExercise>): void;
  (e: 'remove', id: string): void;
}>();

const form = ref({
  sets: props.exercise.sets || '',
  reps: props.exercise.reps || '',
  weight: props.exercise.weight || '',
  tempo: props.exercise.tempo || '',
  rest: props.exercise.rest || '',
  notes: props.exercise.notes || '',
});

watch(() => props.exercise, (newVal) => {
  // Only update if not focused? Or just deep watch. 
  // For simplicity, we sync if props change from outside, but we should be careful with overwriting active input.
  // Ideally, use v-model or similar, but here we just init.
  // Ignoring complex two-way binding issues for now, assuming mostly one-way or stable updates.
}, { deep: true });

const debouncedUpdate = useDebounceFn(() => {
    emit('update', props.exercise.id, {
        sets: form.value.sets || null,
        reps: form.value.reps || null,
        weight: form.value.weight || null,
        tempo: form.value.tempo || null,
        rest: form.value.rest || null,
        notes: form.value.notes || null,
    });
}, 800);

const onInput = () => {
    debouncedUpdate();
};

</script>

<template>
  <div class="bg-card border rounded-md p-4 mb-3 shadow-sm flex gap-3 group">
    <div class="cursor-move text-muted-foreground flex flex-col justify-center opacity-50 hover:opacity-100">
        <GripVertical class="w-5 h-5" />
    </div>
    
    <div class="flex-1 space-y-3">
        <div class="flex justify-between items-start">
            <div>
                <h4 class="font-semibold text-sm">{{ exercise.exerciseName }}</h4>
                <p class="text-xs text-muted-foreground">{{ exercise.muscleGroup }}</p>
            </div>
            <Button variant="ghost" size="icon" class="h-8 w-8 text-muted-foreground hover:text-destructive" @click="emit('remove', exercise.id)">
                <Trash2 class="w-4 h-4" />
            </Button>
        </div>

        <div class="grid grid-cols-2 md:grid-cols-5 gap-3">
             <div class="space-y-1">
                <label class="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Serie</label>
                <Input v-model="form.sets" @input="onInput" class="h-8 text-sm" placeholder="-" />
            </div>
            <div class="space-y-1">
                <label class="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Powt.</label>
                <Input v-model="form.reps" @input="onInput" class="h-8 text-sm" placeholder="-" />
            </div>
            <div class="space-y-1">
                <label class="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Ciężar</label>
                <Input v-model="form.weight" @input="onInput" class="h-8 text-sm" placeholder="-" />
            </div>
            <div class="space-y-1">
                <label class="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Tempo</label>
                <Input v-model="form.tempo" @input="onInput" class="h-8 text-sm" placeholder="-" />
            </div>
            <div class="space-y-1">
                <label class="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Przerwa</label>
                <Input v-model="form.rest" @input="onInput" class="h-8 text-sm" placeholder="-" />
            </div>
        </div>

        <div>
            <label class="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Notatki</label>
            <Input v-model="form.notes" @input="onInput" class="h-8 text-sm" placeholder="Opcjonalne instrukcje..." />
        </div>
    </div>
  </div>
</template>
