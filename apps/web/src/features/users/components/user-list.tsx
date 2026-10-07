import { useState } from "react"
import { getRouteApi, Link } from "@tanstack/react-router"
import {
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
} from "@tanstack/react-table"
import { Eye, KeyRound, Pencil, Plus, Trash2 } from "lucide-react"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import { ListScreen } from "@/shared/components/list-screen"
import { RowActions } from "@/shared/components/row-actions"
import { UserAvatar } from "@/shared/components/user-avatar"
import { FilterSelect } from "@/shared/list/filter-select"
import { matchesQuery } from "@/shared/list/search"
import { useGroupNames } from "@/features/groups/api/groups-api"
import {
  enabledStatus,
  userLabel,
  useUsers,
  type User,
} from "../api/users-api"
import type { UserSearch } from "../schemas"
import { RemoveUserDialog, ResetPasswordDialog } from "./user-dialogs"

const route = getRouteApi("/_authenticated/users/")

const roles = [
  { value: "all", label: "Todos os perfis" },
  { value: "admin", label: "Administradores" },
  { value: "member", label: "Usuários comuns" },
]

const statuses = [
  { value: "all", label: "Todas as situações" },
  { value: "enabled", label: "Ativos" },
  { value: "disabled", label: "Desativados" },
]

export function UserStatus({ user }: { user: User }) {
  return user.status === enabledStatus ? (
    <Badge variant="secondary">Ativo</Badge>
  ) : (
    <Badge variant="outline">Desativado</Badge>
  )
}

function UserIdentity({ user }: { user: User }) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <UserAvatar name={userLabel(user)} />
      <div className="min-w-0">
        <Link
          to="/users/$userId"
          params={{ userId: String(user.id) }}
          className="block w-fit max-w-full font-medium break-words underline-offset-4 hover:underline"
        >
          {userLabel(user)}
        </Link>
        <span className="mt-0.5 block text-xs break-all text-muted-foreground">
          {user.nickname ? user.username : user.email}
        </span>
      </div>
    </div>
  )
}

export function UserList() {
  const search = route.useSearch()
  const navigate = route.useNavigate()
  const users = useUsers()
  const groups = useGroupNames("user")
  const [resetting, setResetting] = useState<User | null>(null)
  const [removing, setRemoving] = useState<User | null>(null)
  const hasFilters = !!(search.q || search.role || search.status)
  const rows = (users.data ?? [])
    .filter(
      (user) =>
        matchesQuery(
          `${user.username} ${user.nickname} ${user.email}`,
          search.q
        ) &&
        (!search.role || !!user.is_admin === (search.role === "admin")) &&
        (!search.status ||
          (user.status === enabledStatus) === (search.status === "enabled"))
    )
    .sort((a, b) => userLabel(a).localeCompare(userLabel(b), "pt-BR"))

  function filter(patch: Partial<UserSearch>) {
    void navigate({
      search: (previous) => ({ ...previous, ...patch }),
      replace: true,
      resetScroll: false,
    })
  }

  const actions = (user: User) => (
    <RowActions
      name={userLabel(user)}
      actions={[
        {
          label: "Ver detalhes",
          icon: Eye,
          render: (
            <Link to="/users/$userId" params={{ userId: String(user.id) }} />
          ),
        },
        {
          label: "Editar usuário",
          icon: Pencil,
          render: (
            <Link
              to="/users/$userId/edit"
              params={{ userId: String(user.id) }}
            />
          ),
        },
        {
          label: "Redefinir senha",
          icon: KeyRound,
          onSelect: () => setResetting(user),
        },
        {
          label: "Remover",
          icon: Trash2,
          destructive: true,
          onSelect: () => setRemoving(user),
        },
      ]}
    />
  )

  const columns: ColumnDef<User>[] = [
    {
      id: "user",
      header: "Usuário",
      cell: ({ row }) => <UserIdentity user={row.original} />,
    },
    {
      id: "group",
      header: "Grupo",
      cell: ({ row }) => (
        <span className="text-muted-foreground">
          {groups.name(row.original.group_id)}
        </span>
      ),
    },
    {
      id: "role",
      header: "Perfil",
      cell: ({ row }) => (
        <span className="text-muted-foreground">
          {row.original.is_admin ? "Administrador" : "Usuário comum"}
        </span>
      ),
    },
    {
      id: "status",
      header: "Situação",
      cell: ({ row }) => <UserStatus user={row.original} />,
    },
    {
      id: "actions",
      header: () => <span className="sr-only">Ações</span>,
      cell: ({ row }) => actions(row.original),
    },
  ]
  const table = useReactTable({
    data: rows,
    columns,
    getRowId: (user) => String(user.id),
    getCoreRowModel: getCoreRowModel(),
  })

  return (
    <ListScreen
      label="Usuários"
      table={table}
      search={{
        value: search.q ?? "",
        placeholder: "Buscar por usuário, nome ou e-mail",
        onChange: (q) => filter({ q: q || undefined }),
      }}
      filters={
        <>
          <FilterSelect
            label="Perfil"
            options={roles}
            value={search.role}
            onChange={(role) => filter({ role: role as UserSearch["role"] })}
          />
          <FilterSelect
            label="Situação"
            options={statuses}
            value={search.status}
            onChange={(status) =>
              filter({ status: status as UserSearch["status"] })
            }
          />
        </>
      }
      primary={
        <Button
          render={<Link to="/users/new" />}
          nativeButton={false}
          role="link"
        >
          <Plus data-icon="inline-start" />
          Novo usuário
        </Button>
      }
      filtered={hasFilters}
      clearFilters={() =>
        filter({ q: undefined, role: undefined, status: undefined })
      }
      loading={users.isPending}
      refreshing={users.isFetching}
      error={users.isError ? users.error : null}
      errorMessage="Não foi possível carregar os usuários. Tente novamente."
      refresh={() => void users.refetch()}
      emptyMessage={
        hasFilters ? "Nenhum usuário encontrado" : "Nenhum usuário cadastrado"
      }
      mobileRow={(user) => (
        <div className="flex items-start gap-3">
          <div className="flex min-w-0 flex-1 flex-col gap-3">
            <UserIdentity user={user} />
            <div className="flex flex-wrap items-center gap-3 pl-11">
              <UserStatus user={user} />
              <span className="text-xs text-muted-foreground">
                {user.is_admin ? "Administrador" : "Usuário comum"}
              </span>
            </div>
          </div>
          {actions(user)}
        </div>
      )}
    >
      {resetting && (
        <ResetPasswordDialog
          user={resetting}
          onClose={() => setResetting(null)}
        />
      )}
      {removing && (
        <RemoveUserDialog user={removing} onClose={() => setRemoving(null)} />
      )}
    </ListScreen>
  )
}
