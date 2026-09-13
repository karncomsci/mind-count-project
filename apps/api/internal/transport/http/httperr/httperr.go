// Package httperr maps errors to the public HTTP error contract.
package httperr

import (
	"encoding/json"
	"errors"
	"net/http"

	"github.com/google/uuid"

	"mind-count/apps/api/internal/transport/http/openapi"
)

// Error is a transport error. Domain packages must not import this package.
type Error struct {
	Status  int
	Code    string
	Message string
	Details map[string]any
}

func (e *Error) Error() string { return e.Message }

// Mapping binds a domain sentinel to a safe public response at the HTTP boundary.
type Mapping struct {
	Domain error
	HTTP   Error
}

// Map recognizes wrapped domain errors without exposing database or internal messages.
func Map(err error, mappings ...Mapping) *Error {
	for _, mapping := range mappings {
		if errors.Is(err, mapping.Domain) {
			mapped := mapping.HTTP
			return &mapped
		}
	}
	var public *Error
	if errors.As(err, &public) {
		return public
	}
	return &Error{Status: http.StatusInternalServerError, Code: "internal_error", Message: "An internal error occurred"}
}

// Write returns all four error fields, including an empty details object.
func Write(w http.ResponseWriter, _ *http.Request, err error, mappings ...Mapping) {
	public := Map(err, mappings...)
	details := public.Details
	if details == nil {
		details = map[string]any{}
	}
	requestID, parseErr := uuid.Parse(w.Header().Get("X-Request-Id"))
	if parseErr != nil {
		requestID = uuid.Nil
	}
	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Cache-Control", "no-store")
	w.WriteHeader(public.Status)
	// Encoding fixed DTO fields cannot fail except when the client disconnects.
	_ = json.NewEncoder(w).Encode(openapi.ErrorResponse{Error: openapi.Error{Code: public.Code, Message: public.Message, Details: details, RequestId: requestID}})
}
