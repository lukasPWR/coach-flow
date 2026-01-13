<script setup lang="ts">
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
</script>

<template>
  <Card>
    <CardHeader class="pb-3">
      <div class="flex items-start gap-4">
        <!-- Avatar skeleton -->
        <Skeleton class="h-16 w-16 rounded-full" />
        <div class="flex-1 space-y-2">
          <!-- Name skeleton -->
          <Skeleton class="h-6 w-3/4" />
          <!-- City skeleton -->
          <Skeleton class="h-4 w-1/2" />
        </div>
      </div>
    </CardHeader>

    <CardContent class="pb-3">
      <!-- Description skeleton -->
      <div class="space-y-2">
        <Skeleton class="h-4 w-full" />
        <Skeleton class="h-4 w-full" />
        <Skeleton class="h-4 w-2/3" />
      </div>

      <!-- Specializations skeleton -->
      <div class="flex flex-wrap gap-2 mt-3">
        <Skeleton class="h-5 w-20" />
        <Skeleton class="h-5 w-24" />
        <Skeleton class="h-5 w-16" />
      </div>
    </CardContent>

    <CardFooter>
      <!-- Button skeleton -->
      <Skeleton class="h-10 w-full" />
    </CardFooter>
  </Card>
</template>
