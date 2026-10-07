import { useState } from "react"
import { Link } from "@tanstack/react-router"
import { Contact, Pencil, Plus, Trash2 } from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import { Separator } from "@workspace/ui/components/separator"
import { DetailPage, DetailSection } from "@/shared/components/detail-page"
import { LoadingLine } from "@/shared/components/loading-line"
import { RequestError } from "@/shared/components/request-error"
import { RowActions } from "@/shared/components/row-actions"
import { useUserNames } from "@/features/users/api/users-api"
import {
  permissionLabel,
  ruleTargets,
  useCollection,
  useRules,
  type Collection,
  type Rule,
} from "../api/address-books-api"
import { useRuleTargetName } from "../api/rule-target"
import { CollectionDialog, RemoveCollectionDialog } from "./collection-dialogs"
import { RemoveRuleDialog, RuleDialog } from "./rule-dialogs"

function SharingRules({ collection }: { collection: Collection }) {
  const rules = useRules(collection.id)
  const targetName = useRuleTargetName()
  const [editing, setEditing] = useState<Rule | "new" | null>(null)
  const [removing, setRemoving] = useState<Rule | null>(null)
  const nameOf = (rule: Rule) =>
    targetName(rule) ??
    (rule.type === ruleTargets.group ? "Grupo removido" : "Usuário removido")
  return (
    <DetailSection title="Compartilhamento">
      <div>
        <Button variant="outline" onClick={() => setEditing("new")}>
          <Plus data-icon="inline-start" />
          Nova regra
        </Button>
      </div>
      {rules.isPending ? (
        <LoadingLine label="Carregando regras…" className="py-4" />
      ) : rules.isError ? (
        <RequestError
          error={rules.error}
          fallback="Não foi possível carregar as regras. Tente novamente."
          retry={() => void rules.refetch()}
        />
      ) : rules.data.length ? (
        <ul className="divide-y border-y">
          {rules.data.map((rule) => (
            <li key={rule.id} className="flex items-center gap-3 py-3">
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="font-medium break-words">{nameOf(rule)}</span>
                <span className="text-xs text-muted-foreground">
                  {rule.type === ruleTargets.group ? "Grupo" : "Usuário"},{" "}
                  {permissionLabel(rule.rule)?.toLocaleLowerCase("pt-BR")}
                </span>
              </div>
              <RowActions
                name={`regra de ${nameOf(rule)}`}
                actions={[
                  {
                    label: "Editar regra",
                    icon: Pencil,
                    onSelect: () => setEditing(rule),
                  },
                  {
                    label: "Remover",
                    icon: Trash2,
                    destructive: true,
                    onSelect: () => setRemoving(rule),
                  },
                ]}
              />
            </li>
          ))}
        </ul>
      ) : (
        <p className="py-6 text-sm text-muted-foreground">
          Só o dono vê este catálogo
        </p>
      )}
      {editing && (
        <RuleDialog
          collection={collection}
          rule={editing === "new" ? undefined : editing}
          onClose={() => setEditing(null)}
        />
      )}
      {removing && (
        <RemoveRuleDialog
          rule={removing}
          targetName={nameOf(removing)}
          onClose={() => setRemoving(null)}
        />
      )}
    </DetailSection>
  )
}

export function CollectionDetail({ id }: { id: number }) {
  const query = useCollection(id)
  const users = useUserNames()
  const [dialog, setDialog] = useState<"edit" | "remove" | null>(null)
  return (
    <DetailPage
      back="/address-books"
      backLabel="Voltar para catálogos"
      query={query}
      loadingLabel="Carregando catálogo…"
      errorFallback="Não foi possível carregar o catálogo."
      notFound="Este catálogo não está mais disponível."
    >
      {(collection) => (
        <>
          <header className="flex flex-wrap items-start justify-between gap-6">
            <div className="flex min-w-0 flex-col gap-1">
              <h1 className="text-3xl font-semibold tracking-tight break-words">
                {collection.name}
              </h1>
              <span className="text-sm text-muted-foreground">
                Dono: {users.name(collection.user_id) ?? "usuário removido"}
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                render={
                  <Link
                    to="/address-book-entries"
                    search={{
                      user: collection.user_id,
                      collection: collection.id,
                    }}
                  />
                }
                nativeButton={false}
                role="link"
              >
                <Contact data-icon="inline-start" />
                Ver endereços
              </Button>
              <Button onClick={() => setDialog("edit")}>
                <Pencil data-icon="inline-start" />
                Editar catálogo
              </Button>
            </div>
          </header>
          <Separator />
          <SharingRules collection={collection} />
          <Separator />
          <div className="flex justify-end">
            <Button variant="destructive" onClick={() => setDialog("remove")}>
              <Trash2 data-icon="inline-start" />
              Remover catálogo
            </Button>
          </div>
          {dialog === "edit" && (
            <CollectionDialog
              collection={collection}
              onClose={() => setDialog(null)}
            />
          )}
          {dialog === "remove" && (
            <RemoveCollectionDialog
              collection={collection}
              onClose={() => setDialog(null)}
              fromDetail
            />
          )}
        </>
      )}
    </DetailPage>
  )
}
