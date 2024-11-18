import crypto from "crypto";
import pgp from "pg-promise";
import express from "express";
import { validateCpf } from "./validateCpf";
import { Account } from './Account';

const app = express();
app.use(express.json());

app.post("/signup", async function (req, res) {
	const input = req.body;
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

const validPropertyAccount = (input: Account) => {
	if (!input.name.match(/[a-zA-Z] [a-zA-Z]+/)) return { isValid: false, error: { error: 'Invalid Name' }};
	if (!input.email.match(/^(.+)@(.+)$/)) return { isValid: false, error: { error: 'Invalid Email' }};
	if (!validateCpf(input.cpf)) return {isValid: false, error: { error: 'Invalid CPF' }};
	if (input.isDriver)
		if (!input.carPlate.match(/[A-Z]{3}[0-9]{4}/)) return { isValid: false, error: { error: 'Invalid car plate' }};
	return { isValid: true, error: undefined }
}

export default app;
