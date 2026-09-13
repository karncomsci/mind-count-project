export interface DropdownItem {
  id: string
  label: string
  icon?: 'edit' | 'print' | 'share' | 'download' | 'envelope' | 'copy' | 'trash' | 'plus' | 'info'
  disabled?: boolean
  separator?: boolean
  danger?: boolean
}
