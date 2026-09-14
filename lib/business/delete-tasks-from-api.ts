import { deleteTasksByCrmPedidoId } from "@/lib/repos/tasks";

export type DeleteTasksFromApiResult = {
  deletedCount: number;
};

export async function deleteTasksFromApiByCrmPedidoId(
  crmPedidoId: number,
): Promise<DeleteTasksFromApiResult> {
  const deletedCount = await deleteTasksByCrmPedidoId(crmPedidoId);
  return { deletedCount };
}
