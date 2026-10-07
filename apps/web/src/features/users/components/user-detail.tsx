import { useState } from "react"
import { Link } from "@tanstack/react-router"
import { KeyRound, Pencil, Trash2 } from "lucide-react"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import { Separator } from "@workspace/ui/components/separator"
import { DetailPage, DetailSection } from "@/shared/components/detail-page"
import { DetailItem } from "@/shared/components/detail-item"
import { formatServerDateTime } from "@/shared/format"
import { useGroupNames } from "@/features/groups/api/groups-api"
import { userLabel, useUser } from "../api/users-api"
import { RemoveUserDialog, ResetPasswordDialog } from "./user-dialogs"
import { UserStatus } from "./user-list"

export function UserDetail({ id }: { id: number }) {
  const query = useUser(id)
  const groups = useGroupNames("user")
  const [dialog, setDialog] = useState<"reset" | "remove" | null>(null)
  return (
    <DetailPage
      back="/users"
      backLabel="Voltar para usuários"
      query={query}
      loadingLabel="Carregando usuário…"
      errorFallback="Não foi possível carregar o usuário."
      notFound="Este usuário não está mais disponível."
    >
      {(user) => (
        <>
          <header className="flex flex-wrap items-start justify-between gap-6">
            <div className="flex min-w-0 flex-col gap-3">
              <div className="flex flex-wrap items-baseline gap-3">
                <h1 className="text-3xl font-semibold tracking-tight break-words">
                  {userLabel(user)}
                </h1>
                {user.nickname && (
                  <span className="font-mono text-sm text-muted-foreground">
                    {user.username}
                  </span>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                <UserStatus user={user} />
                {user.is_admin && (
                  <Badge variant="outline">Administrador</Badge>
                )}
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={() => setDialog("reset")}>
                <KeyRound data-icon="inline-start" />
                Redefinir senha
              </Button>
              <Button
                render={
                  <Link
                    to="/users/$userId/edit"
                    params={{ userId: String(user.id) }}
                  />
                }
                nativeButton={false}
                role="link"
              >
                <Pencil data-icon="inline-start" />
                Editar usuário
              </Button>
            </div>
          </header>
          <Separator />
          <DetailSection title="Cadastro">
            <dl className="grid gap-6 sm:grid-cols-3">
              {user.email && (
                <DetailItem label="E-mail">
                  <span className="break-all">{user.email}</span>
                </DetailItem>
              )}
              <DetailItem label="Grupo">
                {groups.name(user.group_id) ?? "Sem grupo"}
              </DetailItem>
              {user.created_at && (
                <DetailItem label="Cadastrado em">
                  <span className="tabular-nums">
                    {formatServerDateTime(user.created_at)}
                  </span>
                </DetailItem>
              )}
              {user.updated_at && (
                <DetailItem label="Última atualização">
                  <span className="tabular-nums">
                    {formatServerDateTime(user.updated_at)}
                  </span>
                </DetailItem>
              )}
              {user.remark && (
                <DetailItem label="Observação">
                  <span className="whitespace-pre-line">{user.remark}</span>
                </DetailItem>
              )}
            </dl>
          </DetailSection>
          <Separator />
          <div className="flex justify-end">
            <Button variant="destructive" onClick={() => setDialog("remove")}>
              <Trash2 data-icon="inline-start" />
              Remover usuário
            </Button>
          </div>
          {dialog === "reset" && (
            <ResetPasswordDialog user={user} onClose={() => setDialog(null)} />
          )}
          {dialog === "remove" && (
            <RemoveUserDialog
              user={user}
              onClose={() => setDialog(null)}
              fromDetail
            />
          )}
        </>
      )}
    </DetailPage>
  )
}
