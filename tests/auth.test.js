const request = require('supertest');
const app = require('../src/index');
const { conectarDB } = require('../src/config/database');

beforeAll(async () => {
  await conectarDB();
});

describe('Auth API', () => {

  test('POST /api/auth/login - credenciales correctas', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'brayan@gmail.com', password: '123456' });
    expect(res.statusCode).toBe(200);
  });

  test('POST /api/auth/login - credenciales incorrectas', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'wrong@test.com', password: 'wrongpass' });
    expect(res.statusCode).toBe(401);
  });

  test('GET /api/auth/otbs - listar OTBs', async () => {
    const res = await request(app).get('/api/auth/otbs');
    expect(res.statusCode).toBe(200);
  });

});