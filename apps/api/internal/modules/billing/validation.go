package billing

import (
	"encoding/base64"
	"math"
	"net/mail"
	"regexp"
	"strings"
	"time"
	"unicode/utf8"
)

var idPattern = regexp.MustCompile(`^[A-Za-z0-9_-]{1,100}$`)
var numberPattern = regexp.MustCompile(`^BL[0-9]{12,14}$`)
var postalPattern = regexp.MustCompile(`^([0-9]{5})?$`)
var taxPattern = regexp.MustCompile(`^([0-9]{13})?$`)

func validID(s string) bool     { return idPattern.MatchString(s) }
func validNumber(s string) bool { return numberPattern.MatchString(s) }
func validStatus(s string) bool {
	return s == "draft" || s == "waiting" || s == "billed" || s == "cancelled"
}
func length(s string, maximum int) bool {
	return utf8.RuneCountInString(s) <= maximum && !strings.ContainsRune(s, 0)
}
func required(s string, maximum int) bool { return strings.TrimSpace(s) != "" && length(s, maximum) }
func amount(v, minimum, maximum float64) bool {
	return !math.IsNaN(v) && !math.IsInf(v, 0) && v >= minimum && v <= maximum
}
func validProject(p Project) bool {
	return validID(p.ID) && required(p.Name, 200) && length(p.Customer, 200)
}
func validWarehouse(w Warehouse) bool {
	if !validID(w.ID) || !required(w.Name, 100) || !length(w.Code, 30) || !length(w.Address, 1000) || !postalPattern.MatchString(w.PostalCode) || !length(w.Contact, 200) || !length(w.Phone, 30) || !length(w.Email, 254) {
		return false
	}
	if w.Purpose != "ซื้อและขาย" && w.Purpose != "ซื้อสินค้า" && w.Purpose != "ขายสินค้า" {
		return false
	}
	if w.Email != "" {
		a, err := mail.ParseAddress(w.Email)
		if err != nil || a.Address != w.Email {
			return false
		}
	}
	return true
}

// ValidateDraft verifies dates, credit terms, money bounds and attachment bytes before persistence.
func ValidateDraft(d Draft) error {
	if !required(d.Customer.Name, 200) || !length(d.Customer.Address, 1000) || !postalPattern.MatchString(d.Customer.PostalCode) || !taxPattern.MatchString(d.Customer.TaxID) || !length(d.Customer.Branch, 100) {
		return ErrInvalid
	}
	date, err := time.Parse("2006-01-02", d.Date)
	if err != nil {
		return ErrInvalid
	}
	if _, err = time.Parse("2006-01-02", d.DueDate); err != nil {
		return ErrInvalid
	}
	if d.CreditDays < 0 || d.CreditDays > 365 {
		return ErrInvalid
	}
	switch d.CreditMode {
	case "days":
		if d.DueDate != date.AddDate(0, 0, int(d.CreditDays)).Format("2006-01-02") {
			return ErrInvalid
		}
	case "cash":
		if d.CreditDays != 0 || d.DueDate != d.Date {
			return ErrInvalid
		}
	case "undated":
	default:
		return ErrInvalid
	}
	if d.PriceMode != "exclusive" && d.PriceMode != "inclusive" {
		return ErrInvalid
	}
	if !length(d.Salesperson, 200) || !length(d.Project, 200) || !length(d.Reference, 100) || !length(d.Description, 1000) || !length(d.Warehouse, 100) || !length(d.Note, 2000) || !length(d.InternalNote, 2000) || len(d.Items) < 1 || len(d.Items) > 100 {
		return ErrInvalid
	}
	available := float64(0)
	ids := map[string]bool{}
	for _, line := range d.Items {
		if !validID(line.ID) || ids[line.ID] || !required(line.Description, 1000) || !required(line.Unit, 30) || !amount(line.Quantity, 0.000001, 100000) || !amount(line.UnitPrice, 0, 1000000) || !amount(line.DiscountPercent, 0, 100) || (line.VatRate != 0 && line.VatRate != 7) || (line.WithholdingRate != 0 && line.WithholdingRate != 1 && line.WithholdingRate != 3 && line.WithholdingRate != 5) {
			return ErrInvalid
		}
		ids[line.ID] = true
		gross := math.Round(line.Quantity * line.UnitPrice * 100)
		available += gross - math.Round(gross*line.DiscountPercent/100)
	}
	if !amount(d.DocumentDiscount, 0, 100000000) || math.Round(d.DocumentDiscount*100) > available || len(d.Attachments) > 3 {
		return ErrInvalid
	}
	size := int64(0)
	ids = map[string]bool{}
	for _, a := range d.Attachments {
		prefix := "data:" + a.Type + ";base64,"
		if !validID(a.ID) || ids[a.ID] || !required(a.Name, 200) || (a.Type != "image/png" && a.Type != "image/jpeg" && a.Type != "application/pdf") || a.Size < 1 || a.Size > 1048576 || len(a.DataURL) > 1400000 || !strings.HasPrefix(a.DataURL, prefix) {
			return ErrInvalid
		}
		data, err := base64.StdEncoding.Strict().DecodeString(strings.TrimPrefix(a.DataURL, prefix))
		if err != nil || int64(len(data)) != a.Size {
			return ErrInvalid
		}
		ids[a.ID] = true
		size += a.Size
	}
	if size > 1536*1024 {
		return ErrInvalid
	}
	return nil
}
