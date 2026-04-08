const MSG_403 = 'Người dùng không có quyền.'

export function getErrorMessage(err: any, fallback: string): string {
  if (err?.response?.status === 403)
    return MSG_403
  return err?.response?.data?.message || fallback
}
