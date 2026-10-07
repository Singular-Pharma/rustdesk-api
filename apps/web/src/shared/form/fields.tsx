import type { ComponentProps } from "react"
import {
  Controller,
  type Control,
  type FieldError as FormFieldError,
  type FieldValues,
  type Path,
} from "react-hook-form"
import { Input } from "@workspace/ui/components/input"
import { Switch } from "@workspace/ui/components/switch"
import { Textarea } from "@workspace/ui/components/textarea"
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@workspace/ui/components/field"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import { cn } from "@workspace/ui/lib/utils"

function FieldMessage({
  id,
  note,
  error,
}: {
  id: string
  note?: string
  error?: FormFieldError
}) {
  return (
    <div className="-mt-1 grid min-h-5 text-sm">
      {note && (
        <FieldDescription
          id={`${id}-note`}
          aria-hidden={!!error}
          className={cn(
            "col-start-1 row-start-1 transition-opacity duration-150 motion-reduce:transition-none",
            error && "opacity-0"
          )}
        >
          {note}
        </FieldDescription>
      )}
      {error && (
        <FieldError
          id={`${id}-error`}
          errors={[error]}
          className="col-start-1 row-start-1 line-clamp-2 animate-message-in motion-reduce:animate-none"
        />
      )}
    </div>
  )
}

export function TextField({
  id,
  label,
  error,
  note,
  className,
  ...input
}: ComponentProps<typeof Input> & {
  id: string
  label: string
  error?: FormFieldError
  note?: string
}) {
  const describedBy = error ? `${id}-error` : note ? `${id}-note` : undefined
  return (
    <Field data-invalid={!!error}>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <Input
        id={id}
        className={className}
        aria-invalid={!!error}
        aria-describedby={describedBy}
        {...input}
      />
      <FieldMessage id={id} note={note} error={error} />
    </Field>
  )
}

export function SelectField<T extends FieldValues>({
  control,
  name,
  id,
  label,
  options,
  disabled,
  note,
  className,
}: {
  control: Control<T>
  name: Path<T>
  id: string
  label: string
  options: { value: string; label: string }[]
  disabled: boolean
  note?: string
  className?: string
}) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <Field
          data-invalid={fieldState.invalid}
          data-disabled={disabled}
          className={className}
        >
          <FieldLabel htmlFor={id}>{label}</FieldLabel>
          <Select
            items={options}
            value={field.value || null}
            onValueChange={(value) => field.onChange(value ?? "")}
            disabled={disabled}
          >
            <SelectTrigger
              id={id}
              ref={field.ref}
              onBlur={field.onBlur}
              aria-invalid={fieldState.invalid}
              aria-describedby={
                fieldState.invalid
                  ? `${id}-error`
                  : note
                    ? `${id}-note`
                    : undefined
              }
              className="w-full"
            >
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {options.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
          <FieldMessage id={id} note={note} error={fieldState.error} />
        </Field>
      )}
    />
  )
}

export function SwitchField<T extends FieldValues>({
  control,
  name,
  id,
  label,
  note,
  disabled,
}: {
  control: Control<T>
  name: Path<T>
  id: string
  label: string
  note?: string
  disabled: boolean
}) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <Field orientation="horizontal" data-disabled={disabled}>
          <FieldContent>
            <FieldLabel htmlFor={id}>{label}</FieldLabel>
            {note && (
              <FieldDescription id={`${id}-note`}>{note}</FieldDescription>
            )}
          </FieldContent>
          <Switch
            id={id}
            aria-describedby={note ? `${id}-note` : undefined}
            checked={!!field.value}
            onCheckedChange={field.onChange}
            disabled={disabled}
          />
        </Field>
      )}
    />
  )
}

export function TextareaField({
  id,
  label,
  error,
  note,
  ...textarea
}: ComponentProps<typeof Textarea> & {
  id: string
  label: string
  error?: FormFieldError
  note?: string
}) {
  const describedBy = error ? `${id}-error` : note ? `${id}-note` : undefined
  return (
    <Field data-invalid={!!error}>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <Textarea
        id={id}
        aria-invalid={!!error}
        aria-describedby={describedBy}
        {...textarea}
      />
      <FieldMessage id={id} note={note} error={error} />
    </Field>
  )
}
