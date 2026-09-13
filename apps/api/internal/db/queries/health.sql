-- name: CheckDatabase :one
-- Keeps sqlc generation executable before the first business schema exists.
SELECT 1::integer AS ok;
