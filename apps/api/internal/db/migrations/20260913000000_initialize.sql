-- +goose Up
-- Phase 0 deliberately creates no application tables.
SELECT 1;

-- +goose Down
-- There are no application objects to remove in this baseline.
SELECT 1;
