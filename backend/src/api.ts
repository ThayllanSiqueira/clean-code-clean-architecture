import express from "express";
import cors from 'cors';
import Signup from './Signup';
import { AccountDAODatabase } from './data';
import GetAccount from './GetAccount';

const app = express();
app.use(express.json());
app.use(cors());

app.post("/signup", async function (req, res) {
	const input = req.body;
	console.log(input)
	
	try {
		const accountDAO = new AccountDAODatabase();
		const signup = new Signup(accountDAO);
		const output = await signup.signup(input)
		return res.status(201).json({account: output});
	} catch (error: any) {
		res.status(422).json({error: error.message})
	}
});

app.get('/accounts/:accountId', async function (req, res) {
	const accountDAO = new AccountDAODatabase();
	const getAccount = new GetAccount(accountDAO);
	const output = await getAccount.getAccount(req.params.accountId)
	res.json({account: output})
})



export default app;
