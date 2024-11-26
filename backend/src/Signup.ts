import crypto from "crypto";
import { validateCpf } from "./validateCpf";
import { Account } from './Account';
import MailerGateway from './MailerGateway';

// ISP - Interface Segregation Principle
export interface SignupData {
	saveAccount (account: any): Promise<any>;
	getAccountByEmail (email: string): Promise<any>;
}

export default class Signup {
	constructor (readonly signupData: SignupData, readonly mailerGateway: MailerGateway) {

	}
	signup = async (input: any) => {
		const account = {
			accountId: crypto.randomUUID(),
			name: input.name,
			email: input.email,
			cpf: input.cpf,
			password: input.password,
			isPassenger: input.isPassenger,
			isDriver: input.isDriver,
			carPlate: input.carPlate,
		};
		const accountExists = await this.signupData.getAccountByEmail(account.email);
		if (accountExists) throw new Error('Account already exists');
		const propertiesValid = this.validPropertyAccount(account);
		if (!propertiesValid?.isValid) throw new Error(propertiesValid?.error);
		await this.signupData.saveAccount(account);
		await this.mailerGateway.send(account.email, "Welcome", "...")
		return account ;
	}
	
	validPropertyAccount = (input: Account) => {
		if (!this.isValidName(input.name)) return { isValid: false,  error: 'Invalid Name' };
		if (!this.isValidEmail(input.email)) return { isValid: false,  error: 'Invalid Email' };
		if (!validateCpf(input.cpf)) return {isValid: false,  error: 'Invalid CPF' };
		if (input.isDriver && !this.isValidCarPlate(input.carPlate))
			return { isValid: false,  error: 'Invalid car plate' };
		return { isValid: true, error: undefined }
	}
	isValidName = (name: string) => {
		return name.match(/[a-zA-Z] [a-zA-Z]+/);
	}
	isValidEmail = (email: string) => {
		return email.match(/^(.+)@(.+)$/);
	}
	isValidCarPlate = (carPlate: string) => {
		return carPlate.match(/[A-Z]{3}[0-9]{4}/);
	}
}