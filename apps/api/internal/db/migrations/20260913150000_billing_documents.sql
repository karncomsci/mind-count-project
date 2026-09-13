-- +goose Up
-- Separate rows keep attachment-heavy document updates independent of catalogs.
CREATE TABLE billing_entities (
    kind text NOT NULL CHECK (kind IN ('record', 'project', 'warehouse')),
    id text NOT NULL,
    body jsonb NOT NULL CHECK (jsonb_typeof(body) = 'object'),
    PRIMARY KEY (kind, id),
    CHECK (body->>'id' = id),
    CHECK (kind <> 'record' OR (body->>'status' IN ('draft', 'waiting', 'billed', 'cancelled') AND (body->>'version')::bigint > 0))
);
CREATE UNIQUE INDEX billing_document_number ON billing_entities ((body->>'number')) WHERE kind = 'record';
CREATE UNIQUE INDEX billing_catalog_name ON billing_entities (kind, lower(body->>'name')) WHERE kind IN ('project', 'warehouse');
CREATE UNIQUE INDEX billing_warehouse_code ON billing_entities (lower(body->>'code')) WHERE kind = 'warehouse' AND body->>'code' <> '';
INSERT INTO billing_entities (kind,id,body) VALUES
('project','default-project','{"id":"default-project","name":"คอมพิวเตอร์","customer":""}'),
('warehouse','default-warehouse','{"id":"default-warehouse","name":"คลังสินค้าหลัก","code":"","address":"","postalCode":"","purpose":"ซื้อและขาย","contact":"","email":"","phone":""}');

-- +goose Down
DROP TABLE billing_entities;
