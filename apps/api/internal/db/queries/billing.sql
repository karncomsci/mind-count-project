-- name: ListBillingEntities :many
SELECT kind, body FROM billing_entities ORDER BY kind, id;

-- name: GetBillingEntity :one
SELECT body FROM billing_entities WHERE kind = $1 AND id = $2;

-- name: PutBillingEntity :exec
INSERT INTO billing_entities (kind, id, body) VALUES ($1, $2, $3)
ON CONFLICT (kind, id) DO UPDATE SET body = EXCLUDED.body;

-- name: LockBillingWrites :exec
SELECT pg_advisory_xact_lock(51339811);

-- name: NextBillingNumber :one
SELECT (COALESCE(MAX(substring(body->>'number' from 11)::bigint), 0) + 1)::bigint
FROM billing_entities WHERE kind = 'record' AND left(body->>'number', 10) = sqlc.arg(prefix)::text;
