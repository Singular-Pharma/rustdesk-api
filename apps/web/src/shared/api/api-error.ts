import axios from "axios"

export const loginRequiredReply = "Please log in first."

export class ApiError extends Error {
  readonly code: number

  constructor(code: number, message: string) {
    super(message)
    this.code = code
  }
}

const serverReplies: [fragment: string, message: string][] = [
  ["Username or password error", "Usuário ou senha incorretos."],
  ["Captcha error", "O código de verificação está incorreto."],
  ["UserDisabled", "Este usuário está desativado."],
  [
    "LoginBanned",
    "Muitas tentativas de acesso. Aguarde alguns minutos e tente novamente.",
  ],
  ["Password login disabled", "O acesso com senha está desativado."],
  ["UsernameExists", "Já existe um usuário com esse nome de usuário."],
  ["Item already exists", "Já existe um cadastro com esses dados."],
  [
    "last admin user cannot be deleted",
    "Não é possível remover o último administrador.",
  ],
  [
    "last admin user cannot be disabled or demoted",
    "O último administrador não pode ser desativado nem deixar de ser administrador.",
  ],
  [
    "Cannot share to self",
    "O catálogo não pode ser compartilhado com o próprio dono.",
  ],
  [
    "Params validation failed",
    "Confira os dados informados e tente novamente.",
  ],
]

export function isLoginRequired(error: unknown) {
  return (
    (error instanceof ApiError &&
      error.code === 403 &&
      error.message === loginRequiredReply) ||
    (axios.isAxiosError(error) && error.response?.status === 401)
  )
}

export function isForbidden(error: unknown) {
  return (
    error instanceof ApiError && error.code === 403 && !isLoginRequired(error)
  )
}

export function errorMessage(
  error: unknown,
  fallback: string,
  notFound = "Este registro não está mais disponível."
) {
  if (isLoginRequired(error))
    return "Sua sessão expirou. Entre novamente para continuar."
  if (isForbidden(error))
    return "Você não tem permissão para realizar esta ação."
  if (error instanceof ApiError) {
    if (error.message.includes("Item not found")) return notFound
    return (
      serverReplies.find(([fragment]) =>
        error.message.includes(fragment)
      )?.[1] ?? fallback
    )
  }
  if (!axios.isAxiosError(error)) return fallback
  if (error.code === "ECONNABORTED")
    return "A operação demorou demais. Tente novamente."
  if (!error.response)
    return "Não foi possível conectar ao servidor. Tente novamente."
  if (error.response.status === 429)
    return "Muitas tentativas. Aguarde um momento antes de tentar novamente."
  if (error.response.status === 400)
    return "Confira os dados informados e tente novamente."
  return fallback
}
