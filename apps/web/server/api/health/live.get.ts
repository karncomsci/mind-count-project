import { proxyHealth } from '../../lib/health'

export default defineEventHandler(event => proxyHealth(event, '/health/live'))
