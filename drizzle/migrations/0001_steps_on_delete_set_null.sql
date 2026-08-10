-- Align live FK with Strapi-like step deletion (nullify task.step_id).
ALTER TABLE tasks DROP CONSTRAINT IF EXISTS tasks_step_id_steps_id_fk;
ALTER TABLE tasks
  ADD CONSTRAINT tasks_step_id_steps_id_fk
  FOREIGN KEY (step_id) REFERENCES steps(id) ON DELETE SET NULL;
