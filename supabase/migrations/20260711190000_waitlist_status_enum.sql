-- Step 1 of merging event_waitlist into event_join_requests: a waitlist
-- entry is just a join request with status 'waitlisted'. (Separate migration
-- because a new enum value cannot be used in the same transaction.)

alter type public.join_request_status add value if not exists 'waitlisted';
