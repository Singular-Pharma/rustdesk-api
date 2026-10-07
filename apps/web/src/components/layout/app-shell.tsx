import { Fragment, useEffect } from "react"
import { Link, Outlet, useRouterState } from "@tanstack/react-router"
import {
  BookUser,
  Boxes,
  Cable,
  ChevronRight,
  ChevronsUpDown,
  Contact,
  FileStack,
  House,
  KeyRound,
  LogIn,
  LogOut,
  Monitor,
  Moon,
  Settings2,
  Share2,
  Sun,
  Tag,
  Terminal,
  Users,
  UsersRound,
  X,
} from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@workspace/ui/components/sidebar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@workspace/ui/components/breadcrumb"
import { Button } from "@workspace/ui/components/button"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@workspace/ui/components/collapsible"
import { Separator } from "@workspace/ui/components/separator"
import { useAuthStore } from "@/stores/auth-store"
import { useThemeStore } from "@/stores/theme-store"
import { useSidebarGroupsStore } from "@/stores/sidebar-groups-store"
import { logout } from "@/features/auth/api/auth-api"
import { displayName, isAdmin } from "@/features/auth/types"
import { UserAvatar } from "@/shared/components/user-avatar"
import { BrandMark, BrandName } from "@/shared/components/brand"

const navigation = [
  {
    group: "Visão geral",
    items: [{ base: "/", label: "Início", icon: House }],
  },
  {
    group: "Acesso remoto",
    items: [
      { base: "/devices", label: "Dispositivos", icon: Monitor },
      {
        base: "/device-groups",
        label: "Grupos de dispositivo",
        icon: Boxes,
      },
    ],
  },
  {
    group: "Pessoas",
    items: [
      { base: "/users", label: "Usuários", icon: Users },
      { base: "/user-groups", label: "Grupos de usuário", icon: UsersRound },
    ],
  },
  {
    group: "Catálogos",
    items: [
      {
        base: "/address-books",
        label: "Catálogos de endereços",
        icon: BookUser,
      },
      { base: "/address-book-entries", label: "Endereços", icon: Contact },
      { base: "/tags", label: "Tags", icon: Tag },
    ],
  },
  {
    group: "Auditoria",
    items: [
      { base: "/audit/connections", label: "Conexões", icon: Cable },
      { base: "/audit/files", label: "Arquivos", icon: FileStack },
      { base: "/audit/logins", label: "Log de login", icon: LogIn },
      { base: "/audit/sessions", label: "Sessões", icon: KeyRound },
      { base: "/audit/shares", label: "Compartilhamentos", icon: Share2 },
    ],
  },
  {
    group: "Servidor",
    items: [
      { base: "/server/settings", label: "Configurações", icon: Settings2 },
      { base: "/server/commands", label: "Comandos", icon: Terminal },
    ],
  },
] as const

type Crumb = { label: string; to?: string }

const createLabels: Record<string, string> = {
  "/devices": "Novo dispositivo",
  "/users": "Novo usuário",
}

const editLabels: Record<string, string> = {
  "/devices": "Editar dispositivo",
  "/users": "Editar usuário",
}

function belongsTo(path: string, base: string) {
  return base === "/"
    ? path === "/"
    : path === base || path.startsWith(`${base}/`)
}

function locate(path: string) {
  for (const { group, items } of navigation) {
    const item = items.find(({ base }) => belongsTo(path, base))
    if (!item) continue
    const segments = path.slice(item.base.length).split("/").filter(Boolean)
    const root: Crumb = { label: item.label, to: item.base }
    let crumbs: Crumb[]
    if (!segments.length) crumbs = [{ label: item.label }]
    else if (segments[0] === "new")
      crumbs = [root, { label: createLabels[item.base] ?? "" }]
    else if (segments[1] === "edit")
      crumbs = [root, { label: editLabels[item.base] ?? "" }]
    else crumbs = [root, { label: "Detalhes" }]
    return { group, base: item.base, crumbs }
  }
  return undefined
}

function AccountMenu() {
  const principal = useAuthStore((state) => state.principal)
  const { isMobile } = useSidebar()
  const name = displayName(principal)
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<SidebarMenuButton size="lg" />}
        aria-label="Opções da conta"
      >
        <UserAvatar name={name} />
        <span className="flex min-w-0 flex-1 flex-col gap-0.5 text-left group-data-[collapsible=icon]:hidden">
          <span className="truncate font-medium">{name}</span>
          <span className="text-xs text-muted-foreground">Administrador</span>
        </span>
        <ChevronsUpDown className="group-data-[collapsible=icon]:hidden" />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        side={isMobile ? "top" : "right"}
        className="w-64"
      >
        <DropdownMenuGroup>
          <DropdownMenuLabel className="break-all whitespace-normal">
            {principal?.email || principal?.username}
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem onClick={() => void logout()}>
            <LogOut />
            Sair da conta
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function ThemeToggle() {
  const theme = useThemeStore((store) => store.theme)
  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label={theme === "light" ? "Ativar tema escuro" : "Ativar tema claro"}
      onClick={() => useThemeStore.getState().toggle()}
    >
      {theme === "light" ? <Moon /> : <Sun />}
    </Button>
  )
}

function Workspace() {
  const { isMobile, state, setOpenMobile, openMobile } = useSidebar()
  const path = useRouterState({ select: (router) => router.location.pathname })
  const location = locate(path)
  const closedGroups = useSidebarGroupsStore((store) => store.closed)
  const setGroupOpen = useSidebarGroupsStore((store) => store.setOpen)
  const iconOnly = !isMobile && state === "collapsed"
  const activeGroup = location?.group

  useEffect(() => {
    if (activeGroup) setGroupOpen(activeGroup, true)
  }, [activeGroup, setGroupOpen])

  return (
    <>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
      >
        Ir para o conteúdo
      </a>
      <Sidebar collapsible="icon">
        <SidebarHeader className="p-3">
          <div className="flex h-10 items-center justify-between px-2 group-data-[collapsible=icon]:px-0">
            <Link
              to="/"
              className="flex items-center gap-2 rounded-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            >
              <BrandMark />
              <BrandName className="group-data-[collapsible=icon]:hidden" />
            </Link>
            {isMobile && (
              <Button
                variant="ghost"
                size="icon"
                aria-label="Fechar navegação"
                onClick={() => setOpenMobile(false)}
              >
                <X />
              </Button>
            )}
          </div>
        </SidebarHeader>
        <SidebarContent>
          {navigation.map(({ group, items }) => {
            const open = iconOnly || !closedGroups.includes(group)
            return (
              <Collapsible
                key={group}
                open={open}
                onOpenChange={(next) => setGroupOpen(group, next)}
              >
                <SidebarGroup>
                  <SidebarGroupLabel
                    render={
                      <CollapsibleTrigger
                        tabIndex={iconOnly ? -1 : undefined}
                      />
                    }
                    className="group/label w-full cursor-pointer hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  >
                    {group}
                    <ChevronRight className="ml-auto transition-transform duration-200 group-data-panel-open/label:rotate-90 motion-reduce:transition-none" />
                  </SidebarGroupLabel>
                  <CollapsibleContent>
                    <SidebarGroupContent>
                      <nav aria-label={group}>
                        <SidebarMenu>
                          {items.map(({ base, label, icon: Icon }) => {
                            const active = location?.base === base
                            return (
                              <SidebarMenuItem key={base}>
                                <SidebarMenuButton
                                  isActive={active}
                                  render={<Link to={base} />}
                                  onClick={() => setOpenMobile(false)}
                                  aria-current={active ? "page" : undefined}
                                  tooltip={label}
                                >
                                  <Icon />
                                  <span>{label}</span>
                                </SidebarMenuButton>
                              </SidebarMenuItem>
                            )
                          })}
                        </SidebarMenu>
                      </nav>
                    </SidebarGroupContent>
                  </CollapsibleContent>
                </SidebarGroup>
              </Collapsible>
            )
          })}
        </SidebarContent>
        <SidebarFooter className="p-3">
          <AccountMenu />
        </SidebarFooter>
      </Sidebar>
      <SidebarInset className="min-w-0">
        <header
          role="banner"
          className="flex min-h-16 items-center gap-3 border-b px-4 md:px-8"
        >
          <SidebarTrigger
            aria-label={
              isMobile
                ? openMobile
                  ? "Fechar navegação"
                  : "Abrir navegação"
                : state === "expanded"
                  ? "Recolher navegação"
                  : "Expandir navegação"
            }
          />
          <Separator
            orientation="vertical"
            className="h-4 data-vertical:self-center"
          />
          <div className="min-w-0 flex-1 py-3">
            <Breadcrumb aria-label="Localização">
              <BreadcrumbList>
                {location && (
                  <>
                    <BreadcrumbItem className="hidden md:inline-flex">
                      {location.group}
                    </BreadcrumbItem>
                    {location.crumbs.map((crumb, index) => (
                      <Fragment key={index}>
                        <BreadcrumbSeparator
                          className={
                            index ? undefined : "hidden md:inline-flex"
                          }
                        />
                        <BreadcrumbItem>
                          {crumb.to ? (
                            <BreadcrumbLink render={<Link to={crumb.to} />}>
                              {crumb.label}
                            </BreadcrumbLink>
                          ) : (
                            <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                          )}
                        </BreadcrumbItem>
                      </Fragment>
                    ))}
                  </>
                )}
              </BreadcrumbList>
            </Breadcrumb>
          </div>
          <ThemeToggle />
        </header>
        <div
          id="main-content"
          tabIndex={-1}
          className="mx-auto w-full max-w-7xl flex-1 p-4 outline-none md:p-8"
        >
          <Outlet />
        </div>
      </SidebarInset>
    </>
  )
}

function AdminOnly() {
  const principal = useAuthStore((state) => state.principal)
  return (
    <main className="flex min-h-svh flex-col bg-background px-6 py-8 sm:px-12">
      <div className="flex items-center justify-between gap-4">
        <span className="flex items-center gap-2">
          <BrandMark />
          <BrandName />
        </span>
        <ThemeToggle />
      </div>
      <section
        className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-4 py-16"
        aria-labelledby="admin-only-title"
      >
        <h1
          id="admin-only-title"
          className="text-2xl font-semibold tracking-tight"
        >
          Sem permissão
        </h1>
        <p className="text-sm">
          O usuário <strong>{principal?.username}</strong> não é administrador.
          Este painel é usado apenas pela administração do acesso remoto.
        </p>
        <Button
          variant="outline"
          className="w-fit"
          onClick={() => void logout()}
        >
          <LogOut data-icon="inline-start" />
          Sair da conta
        </Button>
      </section>
    </main>
  )
}

export function AppShell() {
  const session = useAuthStore((state) => state.session)
  const principal = useAuthStore((state) => state.principal)
  if (!session) return null
  if (!isAdmin(principal)) return <AdminOnly />
  return (
    <SidebarProvider>
      <Workspace />
    </SidebarProvider>
  )
}
