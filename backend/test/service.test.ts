import pgp from "pg-promise";
import { AccountDAODatabase, AccountDAOMemory } from '../src/data';
import Signup from '../src/Signup';
import GetAccount from '../src/GetAccount';
import sinon from "sinon";
import MailerGateway, { MailerGatewayMemory } from '../src/MailerGateway';

let signup: Signup;
let getAccount: GetAccount;

async function clearAccounts() {
  const connection = pgp()("postgres://postgres:123456@localhost:5432/app");
  await connection.query("delete from ccca.account");
  await connection.$pool.end();
}

beforeEach(() => {
  const accountDAO = new AccountDAODatabase();
  // const accountDAO = new AccountDAOMemory();
  const mailerGateway = new MailerGatewayMemory();
	signup = new Signup(accountDAO, mailerGateway);
  getAccount = new GetAccount(accountDAO);
})

afterAll(async () => {
  await clearAccounts();
});

describe('Deve cadastrar um usuário (Passageiro ou Motorista)', () => {
  it('Deve cadastrar um passageiro e retornar o accountId (uuid)', async () => {
    const input = {
      email: 'test@email.com',
      name: 'Test test',
      cpf: '864.310.060-97',
      password: 'test',
      isDriver: false,
      isPassenger: true,
      carPlate: 'JJJ-1234'
    }
    const outputSignup = await signup.signup(input);
    const outputAccount = await getAccount.getAccount(outputSignup.accountId)
    expect(outputSignup).toHaveProperty('accountId');
    expect(outputSignup.accountId).toBeDefined();
    expect(outputAccount.accountId).toBeDefined();
    expect(outputAccount.name).toBe(input.name);
    expect(outputAccount.cpf).toBe(input.cpf);
    expect(outputAccount.email).toBe(input.email);
    expect(outputAccount.password).toBe(input.password);
    expect(outputAccount.isPassenger).toBe(input.isPassenger);
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
      await expect(signup.signup(input)).rejects.toThrow(new Error('Invalid Name'));
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
      await expect(signup.signup(input)).rejects.toThrow(new Error('Invalid Email'));
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
      await expect(signup.signup(input)).rejects.toThrow(new Error('Invalid CPF'));
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
    await expect(signup.signup(input)).rejects.toThrow(new Error('Invalid car plate'));
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
    const outputSignup = await signup.signup(input)
    const outputAccount = await getAccount.getAccount(outputSignup.accountId)
    expect(outputSignup).toHaveProperty('accountId');
    expect(outputSignup.accountId).toBeDefined();
    expect(outputSignup.accountId).toBeDefined();
    expect(outputAccount.accountId).toBeDefined();
    expect(outputAccount.name).toBe(input.name);
    expect(outputAccount.cpf).toBe(input.cpf);
    expect(outputAccount.email).toBe(input.email);
    expect(outputAccount.password).toBe(input.password);
    expect(outputAccount.isPassenger).toBe(input.isPassenger);
  });
  it('Deve verificar se o email existe e retornar um erro caso já exista!', async () => {
    const input = {
      email: 'testAlready@email.com',
      name: 'Test test',
      cpf: '864.310.060-97',
      password: 'test',
      isDriver: false,
      isPassenger: true,
      carPlate: 'JJJ-1234'
    }
    await signup.signup(input);
    await expect(signup.signup(input)).rejects.toThrow(new Error('Account already exists'));
  });
  it('Deve cadastrar um passageiro com stub', async () => {
    const mailerStub = sinon.stub(MailerGatewayMemory.prototype, "send").resolves();
    const accountDAOStub1 = sinon.stub(AccountDAODatabase.prototype, "getAccountByEmail").resolves();
    const accountDAOStub2 = sinon.stub(AccountDAODatabase.prototype, "saveAccount").resolves();
    const input = {
      accountId: "",
      email: `test${Math.random()}@email.com`,
      name: 'Test test',
      cpf: '864.310.060-97',
      password: 'test',
      isDriver: false,
      isPassenger: true,
      carPlate: 'JJJ-1234'
    }
    const accountDAOStub3 = sinon.stub(AccountDAODatabase.prototype, "getAccountById").resolves(input);
    const outputSignup = await signup.signup(input);
    const outputAccount = await getAccount.getAccount(outputSignup.accountId)
    expect(outputSignup).toHaveProperty('accountId');
    expect(outputSignup.accountId).toBeDefined();
    expect(outputAccount.accountId).toBeDefined();
    expect(outputAccount.name).toBe(input.name);
    expect(outputAccount.cpf).toBe(input.cpf);
    expect(outputAccount.email).toBe(input.email);
    expect(outputAccount.password).toBe(input.password);
    expect(outputAccount.isPassenger).toBe(input.isPassenger);
    mailerStub.restore();
    accountDAOStub1.restore();
    accountDAOStub2.restore();
    accountDAOStub3.restore();
  });
  it('Deve cadastrar um passageiro com spy', async () => {
    const mailerGatewaySpy = sinon.spy(MailerGatewayMemory.prototype, "send");
    const input = {
      email: 'test@email.com',
      name: 'Test test',
      cpf: '864.310.060-97',
      password: 'test',
      isDriver: false,
      isPassenger: true,
      carPlate: 'JJJ-1234'
    }
    const outputSignup = await signup.signup(input);
    const outputAccount = await getAccount.getAccount(outputSignup.accountId)
    expect(outputSignup).toHaveProperty('accountId');
    expect(outputSignup.accountId).toBeDefined();
    expect(outputAccount.accountId).toBeDefined();
    expect(outputAccount.name).toBe(input.name);
    expect(outputAccount.cpf).toBe(input.cpf);
    expect(outputAccount.email).toBe(input.email);
    expect(outputAccount.password).toBe(input.password);
    expect(outputAccount.isPassenger).toBe(input.isPassenger);
    expect(mailerGatewaySpy.calledOnce).toBe(true);
    expect(mailerGatewaySpy.calledWith(input.email, "Welcome", "...")).toBe(true);
    mailerGatewaySpy.restore();
  });
  it.only('Deve cadastrar um passageiro com Mock', async () => {
    const input = {
      email: 'test@email.com',
      name: 'Test test',
      cpf: '864.310.060-97',
      password: 'test',
      isDriver: false,
      isPassenger: true,
      carPlate: 'JJJ-1234'
    }
    const mailerGatewayMock = sinon.mock(MailerGatewayMemory.prototype);
    mailerGatewayMock.expects("send").withArgs(input.email, "Welcome", "...").once().callsFake(() => {
      console.log("abc")
    })
    const outputSignup = await signup.signup(input);
    const outputAccount = await getAccount.getAccount(outputSignup.accountId)
    expect(outputSignup).toHaveProperty('accountId');
    expect(outputSignup.accountId).toBeDefined();
    expect(outputAccount.accountId).toBeDefined();
    expect(outputAccount.name).toBe(input.name);
    expect(outputAccount.cpf).toBe(input.cpf);
    expect(outputAccount.email).toBe(input.email);
    expect(outputAccount.password).toBe(input.password);
    expect(outputAccount.isPassenger).toBe(input.isPassenger);
    mailerGatewayMock.verify();
    mailerGatewayMock.restore();
  });
});