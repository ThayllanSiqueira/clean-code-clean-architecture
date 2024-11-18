import axios from 'axios';
import signup from '../src/signup';
import { createServer } from 'http';
import pgp from "pg-promise";

const port = 3000;
const url = 'http://localhost';
const baseUrl = `${url}:${port}`;

const payload = {
  email: 'test@email.com',
  name: 'Test test',
  cpf: '864.310.060-97',
  password: 'test',
  isDriver: false,
  carPlate: 'JJJ-1234'
}
let server: any;

async function clearAccounts() {
  const connection = pgp()("postgres://postgres:123456@localhost:5432/app");
  await connection.query("delete from ccca.account");
  await connection.$pool.end();
}

beforeAll(() => {
  server = createServer(signup).listen(port);
});

afterAll(async () => {
  await clearAccounts();
  server.close(); 
});


describe('Deve cadastrar um usuário (Passageiro ou Motorista)', () => {
  it('Deve cadastrar um passageiro e retornar o account_id (uuid)', async () => {
    payload.email = 'passenger@email.com';
    payload.isDriver = false;
    const response = await axios.post(`${baseUrl}/signup`, payload);
    expect(response.status).toBe(201);
    expect(response.data).toHaveProperty('account.accountId');
  });
  it('Deve rejeitar o cadastro de um motorista com placa inválida', async () => {
    payload.email = 'driver@email.com'
    payload.isDriver = true;
    payload.carPlate = '123-JK12'
    try {
      
      await axios.post(`${baseUrl}/signup`, payload);
    } catch (error: any) {
      expect(error.response.status).toBe(400);
    expect(error.response.data).toEqual({ error: 'Invalid car plate'});
    }
    
  });
  it('Deve cadastrar um motorista com placa válida', async () => {
    payload.email = 'driver@email.com'
    payload.isDriver = true;
    payload.carPlate = 'JJJ1234'
 
    const response = await axios.post(`${baseUrl}/signup`, payload);
    expect(response.status).toBe(201);
    expect(response.data).toHaveProperty('account.accountId');
  });
  it('Deve verificar se o email existe e retornar um erro caso já exista!', async () => {
    try {
      await axios.post(`${baseUrl}/signup`, payload);
    } catch (error: any) {
      expect(error.response.status).toBe(409);
      expect(error.response.data).toEqual({ error: 'Account already exists' });
    }
  });
  it('Deve validar o nome enviado!', async () => {
    try {
      payload.name = 'Test1235@%RT';
      payload.email = 'test2@email.com';
      await axios.post(`${baseUrl}/signup`, payload);
    } catch (error: any) {
      expect(error.response.status).toBe(400);
      expect(error.response.data).toEqual({ error: 'Invalid Name' });
    }
  });
  it('Deve validar o email enviado!', async () => {
    try {
      payload.name = 'Test test';
      payload.email = 'test2email.com';
      await axios.post(`${baseUrl}/signup`, payload);
    } catch (error: any) {
      expect(error.response.status).toBe(400);
      expect(error.response.data).toEqual({ error: 'Invalid Email' });
    }
  });
  it('Deve validar o cpf enviado!', async () => {
    try {
      payload.name = 'Test test';
      payload.email = 'test2@email.com';
      payload.cpf = '11111111111';
      await axios.post(`${baseUrl}/signup`, payload);
    } catch (error: any) {
      expect(error.response.status).toBe(400);
      expect(error.response.data).toEqual({ error: 'Invalid CPF' });
    }
  });
});