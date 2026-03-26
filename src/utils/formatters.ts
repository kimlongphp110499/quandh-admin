// Tiện ích format Date theo chuẩn Việt Nam
import dayjs from 'dayjs'
import 'dayjs/locale/vi'
import relativeTime from 'dayjs/plugin/relativeTime'
import customParseFormat from 'dayjs/plugin/customParseFormat'

dayjs.extend(relativeTime)
dayjs.extend(customParseFormat)
dayjs.locale('vi')

/**
 * Format date theo định dạng DD/MM/YYYY
 */
export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return ''
  return dayjs(date).format('DD/MM/YYYY')
}

/**
 * Format datetime theo định dạng HH:mm DD/MM/YYYY
 */
export function formatDateTime(date: string | Date | null | undefined): string {
  if (!date) return ''
  return dayjs(date).format('HH:mm DD/MM/YYYY')
}

/**
 * Format datetime với giây theo định dạng HH:mm:ss DD/MM/YYYY
 */
export function formatDateTimeWithSeconds(date: string | Date | null | undefined): string {
  if (!date) return ''
  return dayjs(date).format('HH:mm:ss DD/MM/YYYY')
}

/**
 * Format thời gian tương đối (vd: 2 giờ trước)
 */
export function formatRelativeTime(date: string | Date | null | undefined): string {
  if (!date) return ''
  return dayjs(date).fromNow()
}

/**
 * Format số tiền theo chuẩn Việt Nam
 */
export function formatCurrency(amount: number | string | null | undefined, currency = 'VND'): string {
  if (amount === null || amount === undefined) return ''
  
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount
  
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency,
  }).format(numAmount)
}

/**
 * Format số với dấu phẩy ngăn cách hàng nghìn
 */
export function formatNumber(value: number | string | null | undefined): string {
  if (value === null || value === undefined) return ''
  
  const numValue = typeof value === 'string' ? parseFloat(value) : value
  
  return new Intl.NumberFormat('vi-VN').format(numValue)
}

/**
 * Kiểm tra ngày có hợp lệ không
 */
export function isValidDate(date: any): boolean {
  return dayjs(date).isValid()
}

/**
 * Parse date string theo định dạng DD/MM/YYYY
 */
export function parseDate(dateString: string): Date | null {
  const parsed = dayjs(dateString, 'DD/MM/YYYY')
  return parsed.isValid() ? parsed.toDate() : null
}

/**
 * Convert Date object sang ISO string cho API
 */
export function toISOString(date: Date | string | null | undefined): string | null {
  if (!date) return null
  return dayjs(date).toISOString()
}
