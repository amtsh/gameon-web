-- Ensure PostgREST picks up structured cost columns after the cost migration.
notify pgrst, 'reload schema';
