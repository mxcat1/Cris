import { describe, it, expect } from 'vitest'
import { http, HttpResponse } from 'msw'
import { server } from '../test/msw-handlers'
import {
  getBanner,
  getTarjetas,
  getTarjetaById,
  getBanners,
  getBannerById,
} from './marketingService'

const BASE = 'http://localhost:3100/api'

// B7 — S11 (D3-A): propagar 403 en lugar de retornar [] / {}
describe('marketingService — propagación 403 (S11)', () => {
  it('getBanner: rechaza con error cuando la API devuelve 403', async () => {
    server.use(
      http.get(`${BASE}/marketing/banner`, () =>
        HttpResponse.json({ message: 'Acceso denegado' }, { status: 403 })
      )
    )
    await expect(getBanner()).rejects.toThrow()
  })

  it('getTarjetas: rechaza con error cuando la API devuelve 403', async () => {
    server.use(
      http.get(`${BASE}/marketing/tarjetas`, () =>
        HttpResponse.json({ message: 'Acceso denegado' }, { status: 403 })
      )
    )
    await expect(getTarjetas()).rejects.toThrow()
  })

  it('getTarjetaById: rechaza con error cuando la API devuelve 403', async () => {
    server.use(
      http.get(`${BASE}/marketing/tarjetas/:id`, () =>
        HttpResponse.json({ message: 'Acceso denegado' }, { status: 403 })
      )
    )
    await expect(getTarjetaById(1)).rejects.toThrow()
  })

  it('getBanners: rechaza con error cuando la API devuelve 403', async () => {
    server.use(
      http.get(`${BASE}/marketing/banners`, () =>
        HttpResponse.json({ message: 'Acceso denegado' }, { status: 403 })
      )
    )
    await expect(getBanners()).rejects.toThrow()
  })

  it('getBannerById: rechaza con error cuando la API devuelve 403', async () => {
    server.use(
      http.get(`${BASE}/marketing/banners/:id`, () =>
        HttpResponse.json({ message: 'Acceso denegado' }, { status: 403 })
      )
    )
    await expect(getBannerById(1)).rejects.toThrow()
  })
})
