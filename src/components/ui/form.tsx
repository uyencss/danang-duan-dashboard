"use client"

import * as React from "react"
import {
  useFormContext,
  Controller,
  type ControllerProps,
  type FieldPath,
  type FieldValues,
  FormProvider,
} from "react-hook-form"

import { cn } from "@/lib/utils"
import { Label } from "@/components/ui/label"

const Form = FormProvider

type FormItemContextValue = {
  id: string
}

const FormItemContext = React.createContext<FormItemContextValue>(
  {} as FormItemContextValue
)

const FormFieldContext = React.createContext<{ name: string }>({} as { name: string });

const FormField = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
>({
  ...props
}: ControllerProps<TFieldValues, TName>) => {
  return (
    <FormItemContext.Provider value={{ id: React.useId() }}>
      <FormFieldContext.Provider value={{ name: props.name }}>
         <Controller {...props} />
      </FormFieldContext.Provider>
    </FormItemContext.Provider>
  )
}

const useFormField = () => {
    const { getFieldState, formState } = useFormContext();
    const { name } = React.useContext(FormFieldContext);
    const fieldState = getFieldState(name, formState);
    return { name, ...fieldState };
}

const FormItem = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  const id = React.useId()
  return (
    <FormItemContext.Provider value={{ id }}>
      <div ref={ref} className={cn("space-y-1.5", className)} {...props} />
    </FormItemContext.Provider>
  )
})
FormItem.displayName = "FormItem"

const FormLabel = React.forwardRef<
  React.ElementRef<typeof Label>,
  React.ComponentPropsWithoutRef<typeof Label>
>(({ className, ...props }, ref) => {
  return (
    <Label
      ref={ref}
      className={cn("text-xs font-bold uppercase text-gray-500", className)}
      {...props}
    />
  )
})
FormLabel.displayName = "FormLabel"

const FormControl = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ ...props }, ref) => {
  return (
    <div
      ref={ref}
      {...props}
    />
  )
})
FormControl.displayName = "FormControl"

const FormMessage = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, children, ...props }, ref) => {
  const { error } = useFormField();
  const body = error ? String(error?.message) : children;

  if (!body) return null;

  return (
    <p
      ref={ref}
      className={cn("text-[0.7rem] font-semibold text-red-500", className)}
      {...props}
    >
      {body}
    </p>
  )
})
FormMessage.displayName = "FormMessage"

export {
  Form,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  FormField,
}
