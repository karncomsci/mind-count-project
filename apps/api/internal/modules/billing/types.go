// Package billing owns billing document validation and persistence use cases.
package billing

// Customer describes billing customer data.
type Customer struct {
	Name       string `json:"name"`
	Address    string `json:"address"`
	PostalCode string `json:"postalCode"`
	TaxID      string `json:"taxId"`
	Branch     string `json:"branch"`
}

// Line describes billing line data.
type Line struct {
	ID              string  `json:"id"`
	Description     string  `json:"description"`
	Quantity        float64 `json:"quantity"`
	Unit            string  `json:"unit"`
	UnitPrice       float64 `json:"unitPrice"`
	DiscountPercent float64 `json:"discountPercent"`
	VatRate         float64 `json:"vatRate"`
	WithholdingRate float64 `json:"withholdingRate"`
}

// Attachment describes billing attachment data.
type Attachment struct {
	ID      string `json:"id"`
	Name    string `json:"name"`
	Type    string `json:"type"`
	Size    int64  `json:"size"`
	DataURL string `json:"dataUrl"`
}

// Draft describes billing draft data.
type Draft struct {
	Customer         Customer     `json:"customer"`
	Date             string       `json:"date"`
	CreditDays       int64        `json:"creditDays"`
	CreditMode       string       `json:"creditMode"`
	DueDate          string       `json:"dueDate"`
	Salesperson      string       `json:"salesperson"`
	Project          string       `json:"project"`
	Reference        string       `json:"reference"`
	Description      string       `json:"description"`
	Warehouse        string       `json:"warehouse"`
	PriceMode        string       `json:"priceMode"`
	Items            []Line       `json:"items"`
	DocumentDiscount float64      `json:"documentDiscount"`
	Note             string       `json:"note"`
	InternalNote     string       `json:"internalNote"`
	SignatureEnabled bool         `json:"signatureEnabled"`
	Attachments      []Attachment `json:"attachments"`
}

// Project describes billing project data.
type Project struct {
	ID       string `json:"id"`
	Name     string `json:"name"`
	Customer string `json:"customer"`
}

// Warehouse describes billing warehouse data.
type Warehouse struct {
	ID         string `json:"id"`
	Name       string `json:"name"`
	Code       string `json:"code"`
	Address    string `json:"address"`
	PostalCode string `json:"postalCode"`
	Purpose    string `json:"purpose"`
	Contact    string `json:"contact"`
	Email      string `json:"email"`
	Phone      string `json:"phone"`
}

// Record describes billing record data.
type Record struct {
	ID        string  `json:"id"`
	Number    string  `json:"number"`
	UpdatedAt string  `json:"updatedAt"`
	Version   int64   `json:"version"`
	Status    string  `json:"status"`
	Kind      string  `json:"kind"`
	DeletedAt *string `json:"deletedAt"`
	Draft     Draft   `json:"draft"`
}

// Workspace describes billing workspace data.
type Workspace struct {
	Records    []Record    `json:"records"`
	Projects   []Project   `json:"projects"`
	Warehouses []Warehouse `json:"warehouses"`
}

// Command describes billing command data.
type Command struct {
	Operation string     `json:"operation"`
	ID        string     `json:"id,omitempty"`
	Version   int64      `json:"version,omitempty"`
	Draft     *Draft     `json:"draft,omitempty"`
	Status    string     `json:"status,omitempty"`
	Project   *Project   `json:"project,omitempty"`
	Warehouse *Warehouse `json:"warehouse,omitempty"`
	Record    *Record    `json:"record,omitempty"`
}

// Result describes billing result data.
type Result struct {
	Record    *Record    `json:"record,omitempty"`
	Project   *Project   `json:"project,omitempty"`
	Warehouse *Warehouse `json:"warehouse,omitempty"`
}
