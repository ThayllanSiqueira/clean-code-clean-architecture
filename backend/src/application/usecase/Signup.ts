import Account from '../../domain/Account';
import MailerGateway from '../../infra/gateway/MailerGateway';
import AccountRepository from '../../infra/repository/AccountRepository';

// Use case
export default class Signup {
	// DIP - Dependency Inversion Principle
	constructor (readonly accountRepository: AccountRepository, readonly mailerGateway: MailerGateway) {

	}
	execute = async (input: any) => {
		const account = Account.create(input.name, input.email, input.cpf, input.carPlate, input.password, input.isPassenger, input.isDriver);
		const accountExists = await this.accountRepository.getAccountByEmail(account.email);
		if (accountExists) throw new Error('Account already exists');
		await this.accountRepository.saveAccount(account);
		await this.mailerGateway.send(account.email, "Welcome", "...");
		return account;
	}
}