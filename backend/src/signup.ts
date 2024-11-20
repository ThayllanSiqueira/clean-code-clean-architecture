import crypto from "crypto";
import pgp from "pg-promise";
import express from "express";
import cors from 'cors';
import { validateCpf } from "./validateCpf";
import { Account } from './Account';

const app = express();
app.use(express.json());
app.use(cors());

app.post("/signup", async function (req, res) {
	const input = req.body;
	console.log('Signup', input)
	const connection = pgp()("postgres://postgres:123456@localhost:5432/app");
	try {
		const id = crypto.randomUUID();
		const [accountExists] = await connection.query("select * from ccca.account where email = $1", [input.email]);
		if (accountExists) return res.status(409).json({ error: 'Account already exists' });
		const propertiesValid = validPropertyAccount(input);
		if (!propertiesValid?.isValid) return res.status(400).json(propertiesValid?.error);
		await connection.query("insert into ccca.account (account_id, name, email, cpf, car_plate, is_passenger, is_driver, password) values ($1, $2, $3, $4, $5, $6, $7, $8)", [id, input.name, input.email, input.cpf, input.carPlate, !!input.isPassenger, !!input.isDriver, input.password]);
		const account = {
			accountId: id
		};
		return res.status(201).json({ account });
	} finally {
		await connection.$pool.end();
	}
});

app.get('/accounts/:accountId', async function (req, res) {
	const connection = pgp()("postgres://postgres:123456@localhost:5432/app");
	const [accountData] = await connection.query('select * from ccca.account where account_id = $1', [req.params.accountId])
	await connection.$pool.end();
	res.json({ account: accountData })
})

const isValidName = (name: string) => {
	return name.match(/[a-zA-Z] [a-zA-Z]+/);
}
const isValidEmail = (email: string) => {
	return email.match(/^(.+)@(.+)$/);
}
const isValidCarPlate = (carPlate: string) => {
	return carPlate.match(/[A-Z]{3}[0-9]{4}/);
}

const validPropertyAccount = (input: Account) => {
	if (!isValidName(input.name)) return { isValid: false, error: { error: 'Invalid Name' }};
	if (!isValidEmail(input.email)) return { isValid: false, error: { error: 'Invalid Email' }};
	if (!validateCpf(input.cpf)) return {isValid: false, error: { error: 'Invalid CPF' }};
	if (input.isDriver && !isValidCarPlate(input.carPlate))
		return { isValid: false, error: { error: 'Invalid car plate' }};
	return { isValid: true, error: undefined }
}

export default app;
