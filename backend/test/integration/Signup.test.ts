import pgp from "pg-promise";
import { AccountRepositoryDatabase, AccountRepositoryMemory } from '../../src/infra/repository/AccountRepository';
import Signup from '../../src/application/usecase/Signup';
import GetAccount from '../../src/application/usecase/GetAccount';
import sinon from "sinon";
import MailerGateway, { MailerGatewayMemory } from '../../src/infra/gateway/MailerGateway';
import Account from '../../src/domain/Account';
import DatabaseConnection, { PgPromiseAdapter } from '../../src/infra/database/DatabaseConnection';

let signup: Signup;
let getAccount: GetAccount;
let connection: DatabaseConnection;

async function clearAccounts() {
  const connection = pgp()("postgres://postgres:123456@localhost:5432/app");
  await connection.query("delete from ccca.account");
  await connection.$pool.end();
}

beforeEach(() => {
  connection = new PgPromiseAdapter();
  const accountRepository = new AccountRepositoryDatabase(connection);
  // const accountRepository = new AccountRepositoryMemory();
  const mailerGateway = new MailerGatewayMemory();
	signup = new Signup(accountRepository, mailerGateway);
  getAccount = new GetAccount(accountRepository);
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
    const outputSignup = await signup.execute(input);
    const outputAccount = await getAccount.execute(outputSignup.accountId)
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
      await expect(signup.execute(input)).rejects.toThrow(new Error('Invalid Name'));
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
    const outputSignup = await signup.execute(input)
    const outputAccount = await getAccount.execute(outputSignup.accountId)
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
    await signup.execute(input);
    await expect(signup.execute(input)).rejects.toThrow(new Error('Account already exists'));
  });
  it('Deve cadastrar um passageiro com stub', async () => {
    const mailerStub = sinon.stub(MailerGatewayMemory.prototype, "send").resolves();
    const accountRepositoryStub1 = sinon.stub(AccountRepositoryDatabase.prototype, "getAccountByEmail").resolves();
    const accountRepositoryStub2 = sinon.stub(AccountRepositoryDatabase.prototype, "saveAccount").resolves();
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
    const accountRepositoryStub3 = sinon.stub(AccountRepositoryDatabase.prototype, "getAccountById").resolves(new Account(input.accountId, input.name, input.email, input.cpf, input.carPlate, input.password, input.isPassenger, input.isDriver));
    const outputSignup = await signup.execute(input);
    const outputAccount = await getAccount.execute(outputSignup.accountId)
    expect(outputSignup).toHaveProperty('accountId');
    expect(outputSignup.accountId).toBeDefined();
    expect(outputAccount.accountId).toBeDefined();
    expect(outputAccount.name).toBe(input.name);
    expect(outputAccount.cpf).toBe(input.cpf);
    expect(outputAccount.email).toBe(input.email);
    expect(outputAccount.password).toBe(input.password);
    expect(outputAccount.isPassenger).toBe(input.isPassenger);
    mailerStub.restore();
    accountRepositoryStub1.restore();
    accountRepositoryStub2.restore();
    accountRepositoryStub3.restore();
  });
  it('Deve cadastrar um passageiro com spy', async () => {
    const mailerGatewaySpy = sinon.spy(MailerGatewayMemory.prototype, "send");
    const input = {
      email: `test${Math.random()}@email.com`,
      name: 'Test test',
      cpf: '864.310.060-97',
      password: 'test',
      isDriver: false,
      isPassenger: true,
      carPlate: 'JJJ-1234'
    }
    const outputSignup = await signup.execute(input);
    const outputAccount = await getAccount.execute(outputSignup.accountId)
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
  it('Deve cadastrar um passageiro com Mock', async () => {
    const input = {
      email: `test${Math.random()}@email.com`,
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
    const outputSignup = await signup.execute(input);
    const outputAccount = await getAccount.execute(outputSignup.accountId)
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

afterEach(async () => {
  await connection.close();
});

afterAll(async () => {
  await clearAccounts();
});
