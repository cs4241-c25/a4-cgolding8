import './../css/index.login.css';
import LoginForm from './../components/LoginForm.js';

function Login() {
	return (
		<div className="login">
			<div className="main">
				<h1>To Do List</h1>
				<h2>Enter your login credentials</h2>

				<LoginForm/>

				<p>If you do not have an account, one will be made for you!</p>
			</div>
		</div>
	);
}

export default Login;