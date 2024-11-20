import axios from 'axios';
import signup from '../src/signup';
import { createServer } from 'http';
import pgp from "pg-promise";

const port = 3000;
const url = 'http://localhost';
const baseUrl = `${url}:${port}`;
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

axios.defaults.validateStatus = function () {
  return true;
}

describe('Deve cadastrar um usuário (Passageiro ou Motorista)', () => {
  it('Deve cadastrar um passageiro e retornar o account_id (uuid)', async () => {
    const input = {
      email: 'test@email.com',
      name: 'Test test',
      cpf: '864.310.060-97',
      password: 'test',
      isDriver: false,
      isPassenger: true,
      carPlate: 'JJJ-1234'
    }
    const responseSignup = await axios.post(`${baseUrl}/signup`, input);
    const outputSignup = responseSignup.data
    const responseAccount = await axios.get(`${baseUrl}/accounts/${outputSignup.account.accountId}`);
    const outputAccount = responseAccount.data
    expect(responseSignup.status).toBe(201);
    expect(outputSignup).toHaveProperty('account.accountId');
    expect(outputSignup.account.accountId).toBeDefined();
    expect(outputAccount.account.name).toBe(input.name);
    expect(outputAccount.account.cpf).toBe(input.cpf);
    expect(outputAccount.account.email).toBe(input.email);
    expect(outputAccount.account.password).toBe(input.password);
    expect(outputAccount.account.is_passenger).toBe(input.isPassenger);
  });
  it('Deve validar o nome enviado!', async () => {
      const input = {
        email: 'test2@email.com',
        name: 'Test',
        cpf: '864.310.060-97',
        password: 'test',
        isDriver: false,
        isPassenger: true,
        carPlate: 'JJJ-1234'
      }
      const responseSignup = await axios.post(`${baseUrl}/signup`, input);
      const outputSignup = responseSignup.data
      expect(responseSignup.status).toBe(400);
      expect(outputSignup).toEqual({ error: 'Invalid Name' });
  });
  it('Deve validar o email enviado!', async () => {
      const input = {
        email: 'testemail.com',
        name: 'Test test',
        cpf: '864.310.060-97',
        password: 'test',
        isDriver: false,
        isPassenger: true,
        carPlate: 'JJJ-1234'
      }
      const responseSignup = await axios.post(`${baseUrl}/signup`, input);
      const outputSignup = responseSignup.data
      expect(responseSignup.status).toBe(400);
      expect(outputSignup).toEqual({ error: 'Invalid Email' });
  });
  it('Deve validar o cpf enviado!', async () => {
      const input = {
        email: 'teste3@mail.com',
        name: 'Test test',
        cpf: '11111111111',
        password: 'test',
        isDriver: false,
        isPassenger: true,
        carPlate: 'JJJ-1234'
      }
      const responseSignup = await axios.post(`${baseUrl}/signup`, input);
      const outputSignup = responseSignup.data
      expect(responseSignup.status).toBe(400);
      expect(outputSignup).toEqual({ error: 'Invalid CPF' });
  });
  it('Deve rejeitar o cadastro de um motorista com placa inválida', async () => {
    const input = {
      email: 'driver@email.com',
      name: 'Test test',
      cpf: '864.310.060-97',
      password: 'test',
      isDriver: true,
      isPassenger: false,
      carPlate: '123-JK12'
    }
    const responseSignup = await axios.post(`${baseUrl}/signup`, input);
    const outputSignup = responseSignup.data;
    expect(responseSignup.status).toBe(400);
    expect(outputSignup).toEqual({ error: 'Invalid car plate'});
  });
  it('Deve cadastrar um motorista com placa válida', async () => {
    const input = {
      email: 'driver@email.com',
      name: 'Test test',
      cpf: '864.310.060-97',
      password: 'test',
      isDriver: true,
      isPassenger: false,
      carPlate: 'JJJ1234'
    }
    const responseSignup = await axios.post(`${baseUrl}/signup`, input);
    const outputSignup = responseSignup.data;
    expect(responseSignup.status).toBe(201);
    expect(outputSignup).toHaveProperty('account.accountId');
    expect(outputSignup.account.accountId).toBeDefined();
  });
  it('Deve verificar se o email existe e retornar um erro caso já exista!', async () => {
    const input = {
      email: 'test@email.com',
      name: 'Test test',
      cpf: '864.310.060-97',
      password: 'test',
      isDriver: false,
      isPassenger: true,
      carPlate: 'JJJ-1234'
    }
    await axios.post(`${baseUrl}/signup`, input);
    const responseSignup = await axios.post(`${baseUrl}/signup`, input);
    const outputSignup = responseSignup.data;
    expect(responseSignup.status).toBe(409);
    expect(outputSignup).toEqual({ error: 'Account already exists' });
  });
});