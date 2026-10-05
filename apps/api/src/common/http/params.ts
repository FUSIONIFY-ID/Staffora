export function getParam(param: unknown): string {
  if (Array.isArray(param)) return param[0] ?? ''
  return typeof param === 'string' ? param : ''
}
