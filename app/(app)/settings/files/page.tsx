import { MediaFilesManager } from "@/components/settings/media-files-manager";
import { listMediaAssets } from "@/lib/repos/media";

import {
  deleteLibraryMedia,
  listLibraryMedia,
  replaceLibraryMedia,
  updateLibraryMediaMetadata,
  uploadLibraryMedia,
} from "../themes/media-actions";

export default async function SettingsFilesPage() {
  const { items, total } = await listMediaAssets({ page: 1, pageSize: 24 });

  return (
    <MediaFilesManager
      initialItems={items}
      initialTotal={total}
      onList={listLibraryMedia}
      onUpload={uploadLibraryMedia}
      onReplace={replaceLibraryMedia}
      onUpdateMetadata={updateLibraryMediaMetadata}
      onDelete={deleteLibraryMedia}
    />
  );
}
