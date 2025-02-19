import React from 'react';

function LoginForm() {
	// Submit login data to the server
	const submit = async function( event ) {
		// Stop form submission from trying to load a new .html page for displaying results...
		event.preventDefault()

		const user = document.querySelector( "#user" )
		const pass = document.querySelector( "#pass" )

		const json = {
			username: user.value,
			password: pass.value,
		}
		const body = JSON.stringify( json )

		const response = await fetch( "/login-attempt", {
			method:'POST',
			headers: {
				'Accept': 'application/json',
				'Content-Type': 'application/json'
			},
			body
		})
		const result = await response.json();
		const { redirectUrl } = result;
		window.sessionStorage.setItem("id", redirectUrl.substring(6));

		window.location.href = redirectUrl.substring(0, 6);
	}

	React.useEffect(() => {
  	const button = document.querySelector("form");
		button.onsubmit = submit;
	}, []);

	return (
		<form>
			<label htmlFor="user">Username:</label>
			<input type="text" id="user" name="user" placeholder="Enter your Username" required/>

			<label htmlFor="pass">Password:</label>
			<input type="password" id="pass" name="pass" placeholder="Enter your Password" required/>

			<div className="wrap"><button type="submit">Submit</button></div>
		</form>
	);
}

export default LoginForm;