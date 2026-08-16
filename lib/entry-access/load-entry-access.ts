import { rethrowIfNavigationError } from "@/lib/navigation/rethrow";
import {
  defaultEntryAccessForSurface,
  type EntryAccessByDevice,
  type EntryAccessSurface,
} from "@/lib/business/entry-access";
import { getEntryAccessSettings } from "@/lib/repos/entry-access";

export async function loadEntryAccessSettings(
  surface: EntryAccessSurface,
): Promise<EntryAccessByDevice> {
  try {
    return await getEntryAccessSettings(surface);
  } catch (error) {
    rethrowIfNavigationError(error);
    return defaultEntryAccessForSurface(surface);
  }
}
