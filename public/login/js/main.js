const submit = async function( event ) {
	// stop form submission from trying to load a new .html page for displaying results...
	event.preventDefault()

	const user = document.querySelector( "#user" )
	const pass = document.querySelector( "#pass" )

	const json = {
		username: user.value,
		password: pass.value,
	}
	const body = JSON.stringify( json )

	console.log(body);

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
	console.log(redirectUrl.substring(6));
	window.sessionStorage.setItem("id", redirectUrl.substring(6));

  window.location.href = redirectUrl.substring(0, 6);
}

window.onload = function() {
	const button = document.querySelector("form");
	button.onsubmit = submit;
}
