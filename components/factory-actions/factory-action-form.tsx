"use client";

import { Controller, useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";

import { Input } from "@/components/ui/input";
import { NumberInput } from "@/components/ui/number-input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  factoryActionFormSchema,
  type FactoryActionFormInput,
} from "@/lib/schemas/factory-action";

export interface FactoryActionFormProps {
  formId: string;
  defaultValues: FactoryActionFormInput;
  disabled?: boolean;
  onSubmit: (values: FactoryActionFormInput) => void;
}

const UNIT_TIME_STEP = 0.01;

export function FactoryActionForm({
  formId,
  defaultValues,
  disabled = false,
  onSubmit,
}: FactoryActionFormProps) {
  const tActions = useTranslations("factoryActions");

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FactoryActionFormInput>({
    resolver: zodResolver(
      factoryActionFormSchema,
    ) as Resolver<FactoryActionFormInput>,
    defaultValues,
  });

  return (
    <form id={formId} className="grid gap-4" onSubmit={handleSubmit(onSubmit)}>
      <div className="space-y-2">
        <Label htmlFor={`${formId}-name`}>{tActions("name")}</Label>
        <Input id={`${formId}-name`} disabled={disabled} {...register("name")} />
        {errors.name ? (
          <p className="text-sm text-destructive">{errors.name.message}</p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor={`${formId}-description`}>
          {tActions("description")}
        </Label>
        <Textarea
          id={`${formId}-description`}
          disabled={disabled}
          {...register("description")}
        />
        {errors.description ? (
          <p className="text-sm text-destructive">
            {errors.description.message}
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor={`${formId}-unitTime`}>{tActions("unitTime")}</Label>
        <Controller
          name="unitTime"
          control={control}
          render={({ field }) => (
            <NumberInput
              id={`${formId}-unitTime`}
              min={UNIT_TIME_STEP}
              step={UNIT_TIME_STEP}
              disabled={disabled}
              value={field.value}
              onChange={(event) => field.onChange(Number(event.target.value))}
            />
          )}
        />
        {errors.unitTime ? (
          <p className="text-sm text-destructive">{errors.unitTime.message}</p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor={`${formId}-qtyQuestion`}>
          {tActions("qtyQuestion")}
        </Label>
        <Textarea
          id={`${formId}-qtyQuestion`}
          disabled={disabled}
          {...register("qtyQuestion")}
        />
        {errors.qtyQuestion ? (
          <p className="text-sm text-destructive">
            {errors.qtyQuestion.message}
          </p>
        ) : null}
      </div>
    </form>
  );
}
