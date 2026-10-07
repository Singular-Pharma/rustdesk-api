import { useState } from "react"
import { useNavigate } from "@tanstack/react-router"
import { useQuery } from "@tanstack/react-query"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { ArrowRight, Eye, EyeOff, RefreshCw } from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@workspace/ui/components/input-group"
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@workspace/ui/components/field"
import { Alert, AlertDescription } from "@workspace/ui/components/alert"
import { Spinner } from "@workspace/ui/components/spinner"
import { BrandLeaf, BrandLogo, ProductName } from "@/shared/components/brand"
import { ApiError, errorMessage } from "@/shared/api/api-error"
import { fetchCaptcha, fetchLoginOptions, login } from "../api/auth-api"

const captchaRequiredCode = 110

const schema = z.object({
  username: z.string().trim().min(1, "Informe seu usuário"),
  password: z.string().min(1, "Informe sua senha"),
  captcha: z.string(),
})

type LoginValues = z.infer<typeof schema>

export function LoginPage({
  expired,
  restoreError,
}: {
  expired?: boolean
  restoreError?: string
}) {
  const navigate = useNavigate()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(restoreError ?? "")
  const [showPassword, setShowPassword] = useState(false)
  const [captchaRound, setCaptchaRound] = useState(0)
  const options = useQuery({
    queryKey: ["login-options"],
    queryFn: ({ signal }) => fetchLoginOptions(signal),
  })
  const form = useForm<LoginValues>({
    resolver: zodResolver(schema),
    defaultValues: { username: "", password: "", captcha: "" },
  })

  const captchaRequired = !!options.data?.need_captcha || captchaRound > 0
  const captchaQuery = useQuery({
    queryKey: ["captcha", captchaRound],
    queryFn: fetchCaptcha,
    enabled: captchaRequired,
    staleTime: Infinity,
    gcTime: 0,
  })
  const captcha = captchaRequired ? (captchaQuery.data ?? null) : null

  function loadCaptcha() {
    form.resetField("captcha")
    setCaptchaRound((round) => round + 1)
  }

  async function submit(values: LoginValues) {
    if (captchaRequired && !values.captcha.trim()) {
      form.setError("captcha", { message: "Informe o código da imagem" })
      return
    }
    setBusy(true)
    setError("")
    try {
      await login({
        username: values.username,
        password: values.password,
        captcha: captcha
          ? { id: captcha.id, answer: values.captcha.trim() }
          : undefined,
      })
      form.reset()
      await navigate({ to: "/", replace: true })
    } catch (failure) {
      setError(
        errorMessage(failure, "Não foi possível entrar. Tente novamente.")
      )
      form.resetField("password")
      if (
        captcha ||
        (failure instanceof ApiError && failure.code === captchaRequiredCode)
      )
        loadCaptcha()
    } finally {
      setBusy(false)
    }
  }

  const passwordDisabled = options.data?.disable_pwd
  const errors = form.formState.errors
  return (
    <main className="grid min-h-svh bg-background lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
      <div className="relative hidden overflow-hidden bg-brand lg:flex lg:flex-col lg:justify-between lg:p-12">
        <BrandLogo onBrand className="h-14 self-start" />
        <BrandLeaf className="pointer-events-none absolute -right-16 -bottom-24 h-[28rem] opacity-15" />
      </div>
      <div className="flex flex-col px-6 py-8 sm:px-12">
        <a
          href="/login"
          aria-label="Singular Pharma"
          className="w-fit rounded-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none lg:hidden"
        >
          <BrandLogo className="h-10" />
        </a>
        <section
          className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-8 py-16"
          aria-labelledby="login-title"
        >
          <div className="flex flex-col gap-2 border-l-[3px] border-primary pl-4">
            <ProductName className="text-xs tracking-wider text-primary uppercase" />
            <h1
              id="login-title"
              className="text-3xl font-semibold tracking-tight"
            >
              Entrar
            </h1>
          </div>
          {expired && !error && (
            <Alert role="status">
              <AlertDescription>
                Sua sessão expirou. Entre novamente.
              </AlertDescription>
            </Alert>
          )}
          {error && (
            <Alert variant="destructive" role="alert">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {passwordDisabled ? (
            <p className="text-sm text-muted-foreground">
              O acesso com usuário e senha está desativado neste servidor.
            </p>
          ) : (
            <form
              onSubmit={(event) => void form.handleSubmit(submit)(event)}
              noValidate
              aria-busy={busy}
            >
              <FieldGroup>
                <Field data-invalid={!!errors.username}>
                  <FieldLabel htmlFor="username">Usuário</FieldLabel>
                  <Input
                    id="username"
                    autoComplete="username"
                    autoCapitalize="none"
                    aria-invalid={!!errors.username}
                    aria-describedby={
                      errors.username ? "username-error" : undefined
                    }
                    readOnly={busy}
                    {...form.register("username")}
                  />
                  <FieldError id="username-error" errors={[errors.username]} />
                </Field>
                <Field data-invalid={!!errors.password}>
                  <FieldLabel htmlFor="password">Senha</FieldLabel>
                  <InputGroup>
                    <InputGroupInput
                      id="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      aria-invalid={!!errors.password}
                      aria-describedby={
                        errors.password ? "password-error" : undefined
                      }
                      readOnly={busy}
                      {...form.register("password")}
                    />
                    <InputGroupAddon align="inline-end">
                      <InputGroupButton
                        size="icon-sm"
                        onClick={() => setShowPassword(!showPassword)}
                        aria-label={
                          showPassword ? "Ocultar senha" : "Mostrar senha"
                        }
                      >
                        {showPassword ? <EyeOff /> : <Eye />}
                      </InputGroupButton>
                    </InputGroupAddon>
                  </InputGroup>
                  <FieldError id="password-error" errors={[errors.password]} />
                </Field>
                {captchaRequired && (
                  <Field data-invalid={!!errors.captcha}>
                    <FieldLabel htmlFor="captcha">Código da imagem</FieldLabel>
                    <div className="flex min-h-10 items-center gap-2">
                      {captcha ? (
                        <img
                          src={captcha.b64}
                          alt="Código de verificação"
                          className="h-10 rounded-md border bg-white"
                        />
                      ) : captchaQuery.isError ? (
                        <span role="alert" className="text-sm text-destructive">
                          Não foi possível carregar o código.
                        </span>
                      ) : (
                        <Spinner aria-label="Carregando código de verificação" />
                      )}
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label="Gerar outro código"
                        disabled={busy}
                        onClick={loadCaptcha}
                      >
                        <RefreshCw />
                      </Button>
                    </div>
                    <Input
                      id="captcha"
                      autoComplete="off"
                      autoCapitalize="none"
                      aria-invalid={!!errors.captcha}
                      aria-describedby={
                        errors.captcha ? "captcha-error" : undefined
                      }
                      readOnly={busy}
                      {...form.register("captcha")}
                    />
                    <FieldError id="captcha-error" errors={[errors.captcha]} />
                  </Field>
                )}
                <Button type="submit" disabled={busy}>
                  {busy && <Spinner data-icon="inline-start" />}
                  {busy ? "Entrando…" : "Entrar"}
                  {!busy && <ArrowRight data-icon="inline-end" />}
                </Button>
              </FieldGroup>
            </form>
          )}
        </section>
      </div>
    </main>
  )
}
