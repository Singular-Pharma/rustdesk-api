import { useRef } from "react"
import { Link, useNavigate } from "@tanstack/react-router"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { ArrowLeft } from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import { useAdminMutation } from "@/shared/api/mutation"
import { LoadingLine } from "@/shared/components/loading-line"
import { RequestError } from "@/shared/components/request-error"
import { SelectField, TextField } from "@/shared/form/fields"
import { FormSection } from "@/shared/form/form-section"
import { SaveBar } from "@/shared/form/save-bar"
import { useUnsavedGuard } from "@/shared/form/unsaved-guard"
import { useGroupNames } from "@/features/groups/api/groups-api"
import {
  devices,
  devicesKey,
  useDevice,
  type Device,
  type DeviceInput,
} from "../api/devices-api"
import { deviceFormSchema, type DeviceFormValues } from "../schemas"

function toInput({ groupId, ...values }: DeviceFormValues): DeviceInput {
  return { ...values, group_id: Number(groupId) || 0 }
}

const machineFields = [
  ["hostname", "Nome do computador"],
  ["username", "Usuário do sistema"],
  ["os", "Sistema operacional"],
  ["version", "Versão do aplicativo"],
  ["cpu", "Processador"],
  ["memory", "Memória"],
  ["uuid", "UUID"],
] as const

export function DeviceForm({ device }: { device?: Device }) {
  const navigate = useNavigate()
  const groups = useGroupNames("device")
  const saved = useRef(false)
  const save = useAdminMutation(
    (values: DeviceFormValues) =>
      device
        ? devices.update({ row_id: device.row_id, ...toInput(values) })
        : devices.create(toInput(values)),
    [devicesKey]
  )
  const form = useForm<DeviceFormValues>({
    mode: "onTouched",
    resolver: zodResolver(deviceFormSchema),
    defaultValues: {
      id: device?.id ?? "",
      alias: device?.alias ?? "",
      hostname: device?.hostname ?? "",
      username: device?.username ?? "",
      os: device?.os ?? "",
      version: device?.version ?? "",
      cpu: device?.cpu ?? "",
      memory: device?.memory ?? "",
      uuid: device?.uuid ?? "",
      groupId: device?.group_id ? String(device.group_id) : "",
    },
  })
  useUnsavedGuard(form.formState.isDirty, saved)

  const errors = form.formState.errors
  const pending = save.isPending
  return (
    <div className="flex flex-col gap-8">
      <Button
        variant="ghost"
        className="-ml-3 w-fit"
        render={<Link to="/devices" />}
        nativeButton={false}
        role="link"
      >
        <ArrowLeft data-icon="inline-start" />
        Voltar para dispositivos
      </Button>
      <form
        onSubmit={(event) =>
          void form.handleSubmit((values) =>
            save.mutate(values, {
              onSuccess: () => {
                saved.current = true
                void (device
                  ? navigate({
                      to: "/devices/$deviceId",
                      params: { deviceId: String(device.row_id) },
                    })
                  : navigate({ to: "/devices", search: { q: values.id } }))
              },
            })
          )(event)
        }
        noValidate
        aria-busy={pending}
        className="flex flex-col gap-6"
      >
        <div className="flex flex-col divide-y">
          <FormSection title="Identificação">
            <TextField
              id="device-id"
              label="ID"
              inputMode="numeric"
              autoComplete="off"
              className="font-mono"
              readOnly={pending}
              error={errors.id}
              note="O número que aparece no aplicativo do computador"
              {...form.register("id")}
            />
            <TextField
              id="alias"
              label="Apelido"
              readOnly={pending}
              error={errors.alias}
              {...form.register("alias")}
            />
            <SelectField
              control={form.control}
              name="groupId"
              id="device-group"
              label="Grupo"
              options={groups.options}
              disabled={pending}
            />
          </FormSection>
          <FormSection title="Máquina">
            {machineFields.map(([name, label]) => (
              <TextField
                key={name}
                id={`device-${name}`}
                label={label}
                autoComplete="off"
                readOnly={pending}
                error={errors[name]}
                {...form.register(name)}
              />
            ))}
          </FormSection>
        </div>
        {save.isError && (
          <RequestError
            error={save.error}
            fallback="Não foi possível salvar o dispositivo. Tente novamente."
            notFound="Este dispositivo não está mais disponível."
          />
        )}
        <SaveBar
          pending={pending}
          label={device ? "Salvar alterações" : "Cadastrar dispositivo"}
          cancel={
            device ? (
              <Link
                to="/devices/$deviceId"
                params={{ deviceId: String(device.row_id) }}
              />
            ) : (
              <Link to="/devices" />
            )
          }
        />
      </form>
    </div>
  )
}

export function EditDevice({ rowId }: { rowId: number }) {
  const device = useDevice(rowId)
  if (device.isPending) return <LoadingLine label="Carregando dispositivo…" />
  if (device.isError)
    return (
      <RequestError
        error={device.error}
        fallback="Não foi possível carregar o dispositivo."
        notFound="Este dispositivo não está mais disponível."
        retry={() => void device.refetch()}
      />
    )
  return <DeviceForm key={device.data.row_id} device={device.data} />
}
