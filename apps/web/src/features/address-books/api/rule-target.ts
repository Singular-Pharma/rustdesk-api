import { useGroupNames } from "@/features/groups/api/groups-api"
import { useUserNames } from "@/features/users/api/users-api"
import { ruleTargets, type Rule } from "./address-books-api"

export function useRuleTargetName() {
  const users = useUserNames()
  const groups = useGroupNames("user")
  return (rule: Pick<Rule, "type" | "to_id">) =>
    rule.type === ruleTargets.group
      ? groups.name(rule.to_id)
      : users.name(rule.to_id)
}
