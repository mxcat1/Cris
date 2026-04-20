'use strict';
const request = require('supertest');
const jwt = require('jsonwebtoken');
const { app } = require('../../src/app');
const { setupTestDb } = require('../helpers/db');
const { createUser } = require('../helpers/seed');
const { getAuthToken } = require('../helpers/auth');
const { gerente } = require('../fixtures/users.fixture');
const { User } = require('../../src/models');

describe('POST /api/auth/login', () => {
  let gerenteUser;

  beforeAll(async () => {
    await setupTestDb();
    gerenteUser = await createUser(gerente);
  });

  // TEST 1 — Happy path: credenciales correctas → 200 con token
  it('devuelve 200 y token JWT para credenciales correctas', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: gerente.email, password: gerente.password });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.token).toBeDefined();
    expect(res.body.user).toMatchObject({
      email: gerente.email,
      id_role: gerente.id_role,
    });
  });

  // TEST 2.1 — Password incorrecto → 400
  // NOTA: El comportamiento correcto sería 401; esto es un bug conocido.
  // El fix irá en fix-wave-1. El test refleja el comportamiento ACTUAL.
  it('devuelve 400 (no 401) para password incorrecto [BUG: debería ser 401]', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: gerente.email, password: 'password_incorrecto' });

    // Comportamiento actual: 400 en lugar de 401
    expect(res.statusCode).toBe(400);
    expect(res.body.token).toBeUndefined();
  });

  // TEST 2.2 — Email inexistente → 400
  it('devuelve 400 para email no registrado', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'noexiste@test.local', password: 'cualquier_pass' });

    expect(res.statusCode).toBe(400);
    expect(res.body.token).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// S5 + S7 — Register: hash de password y JWT con exp
// ---------------------------------------------------------------------------
describe('POST /api/auth/register — S5/S7', () => {
  let gerenteToken;

  beforeAll(async () => {
    await setupTestDb();
    const gerenteUser = await createUser(gerente); // necesario para login en S7
    gerenteToken = getAuthToken(gerenteUser);      // necesario para register en S5
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // TEST S5 — El password que llega a User.create debe ser un hash bcrypt, NO texto plano
  it('hashea el password ANTES de persistir en DB — S5', async () => {
    // Spy puro: llama a la implementación original pero registra los argumentos
    const createSpy = jest.spyOn(User, 'create');

    const email = `test-s5-${Date.now()}@test.local`;
    const res = await request(app)
      .post('/api/auth/register')
      .set('Authorization', `Bearer ${gerenteToken}`)
      .send({ email, password: 'Secret123!', name: 'Test S5' });

    expect(res.statusCode).toBe(200);
    // El password capturado en la llamada a User.create debe ser hash bcrypt (empieza con $2)
    expect(createSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        password: expect.stringMatching(/^\$2/),
      })
    );
  });

  // TEST S7 — El token JWT debe incluir claim exp aunque JWT_EXPIRES_IN no esté definido
  it('el token incluye claim exp aunque JWT_EXPIRES_IN no esté definido — S7', async () => {
    const originalExpiry = process.env.JWT_EXPIRES_IN;
    delete process.env.JWT_EXPIRES_IN;

    try {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: gerente.email, password: gerente.password });

      expect(res.statusCode).toBe(200);
      const decoded = jwt.decode(res.body.token);
      expect(decoded.exp).toBeDefined();
      expect(typeof decoded.exp).toBe('number');
    } finally {
      if (originalExpiry !== undefined) process.env.JWT_EXPIRES_IN = originalExpiry;
    }
  });
});
