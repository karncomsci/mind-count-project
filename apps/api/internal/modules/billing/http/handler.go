// Package http maps the generated billing contract to domain use cases.
package http

import (
	"encoding/json"
	"errors"
	"io"
	"net/http"

	"mind-count/apps/api/internal/modules/billing"
	"mind-count/apps/api/internal/transport/http/httperr"
	"mind-count/apps/api/internal/transport/http/openapi"
)

// Handler implements generated billing routes.
type Handler struct{ service *billing.Service }

// NewHandler constructs the HTTP adapter.
func NewHandler(service *billing.Service) *Handler { return &Handler{service: service} }
func writeError(w http.ResponseWriter, r *http.Request, err error) {
	status, code, message := 500, "internal_error", "ไม่สามารถบันทึกข้อมูลได้ กรุณาลองใหม่"
	switch {
	case errors.Is(err, billing.ErrInvalid):
		status, code, message = 400, "invalid_billing", err.Error()
	case errors.Is(err, billing.ErrMissing):
		status, code, message = 404, "not_found", err.Error()
	case errors.Is(err, billing.ErrConflict):
		status, code, message = 409, "version_conflict", err.Error()
	case errors.Is(err, billing.ErrDuplicate):
		status, code, message = 409, "duplicate", err.Error()
	}
	httperr.Write(w, r, &httperr.Error{Status: status, Code: code, Message: message})
}

// DTO mapping passes only domain fields described by the public contract; sqlc types never cross this boundary.
func mapDTO[T any](value any) (T, error) {
	var out T
	raw, err := json.Marshal(value)
	if err == nil {
		err = json.Unmarshal(raw, &out)
	}
	return out, err
}
func respond(w http.ResponseWriter, r *http.Request, value any, err error) {
	if err != nil {
		writeError(w, r, err)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Cache-Control", "no-store")
	_ = json.NewEncoder(w).Encode(value)
}

// GetBilling reads durable data.
func (h *Handler) GetBilling(w http.ResponseWriter, r *http.Request) {
	if h == nil || h.service == nil {
		httperr.Write(w, r, &httperr.Error{Status: 503, Code: "not_ready", Message: "Billing is unavailable"})
		return
	}
	result, err := h.service.Read(r.Context())
	if err != nil {
		writeError(w, r, err)
		return
	}
	dto, err := mapDTO[openapi.BillingWorkspace](result)
	respond(w, r, dto, err)
}

// MutateBilling accepts one bounded, non-retried command.
func (h *Handler) MutateBilling(w http.ResponseWriter, r *http.Request) {
	if h == nil || h.service == nil {
		httperr.Write(w, r, &httperr.Error{Status: 503, Code: "not_ready", Message: "Billing is unavailable"})
		return
	}
	r.Body = http.MaxBytesReader(w, r.Body, 4*1024*1024)
	decoder := json.NewDecoder(r.Body)
	decoder.DisallowUnknownFields()
	var dto openapi.BillingCommand
	if err := decoder.Decode(&dto); err != nil {
		writeError(w, r, billing.ErrInvalid)
		return
	}
	if err := decoder.Decode(new(any)); err != io.EOF {
		writeError(w, r, billing.ErrInvalid)
		return
	}
	command, err := mapDTO[billing.Command](dto)
	if err != nil {
		writeError(w, r, billing.ErrInvalid)
		return
	}
	result, err := h.service.Mutate(r.Context(), command)
	if err != nil {
		writeError(w, r, err)
		return
	}
	out, err := mapDTO[openapi.BillingResult](result)
	respond(w, r, out, err)
}
