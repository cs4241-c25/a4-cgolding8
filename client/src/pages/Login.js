import './../css/index.login.css';

function Login() {
	return (
		<div className="login">
			<div className="main">
				<h1>To Do List</h1>
				<h2>Enter your login credentials</h2>

				<a href="/auth/github"><button id="githubButton"><h3>Login with GitHub</h3></button></a>
			</div>
		</div>
	);
}

export default Login;