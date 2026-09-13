package httperr

import (
	"errors"
	"fmt"
	"testing"
)

func TestMapWrappedDomainError(t *testing.T) {
	sentinel := errors.New("domain failure")
	got := Map(fmt.Errorf("repository context: %w", sentinel), Mapping{Domain: sentinel, HTTP: Error{Status: 409, Code: "conflict", Message: "Already exists"}})
	if got.Status != 409 || got.Code != "conflict" {
		t.Fatalf("unexpected mapping: %+v", got)
	}
	unknown := Map(errors.New("password=secret"))
	if unknown.Status != 500 || unknown.Message != "An internal error occurred" {
		t.Fatalf("unsafe mapping: %+v", unknown)
	}
}
