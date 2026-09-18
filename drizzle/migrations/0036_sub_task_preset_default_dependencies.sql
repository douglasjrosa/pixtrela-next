ALTER TABLE "sub_task_presets"
ADD COLUMN "default_dependency_preset_ids" jsonb DEFAULT '[]'::jsonb NOT NULL;
