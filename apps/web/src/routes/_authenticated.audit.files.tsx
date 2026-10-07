import { createFileRoute } from "@tanstack/react-router"
import { FileTransferList } from "@/features/audit/components/file-transfer-list"
import { peerSearchSchema } from "@/features/audit/schemas"

export const Route = createFileRoute("/_authenticated/audit/files")({
  validateSearch: peerSearchSchema,
  component: FileTransferList,
})
