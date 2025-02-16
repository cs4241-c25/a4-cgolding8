// Submit form data to the server
const submit = async function( event ) {
	// stop form submission from trying to load a new .html page for displaying results...
	event.preventDefault()

	const desc_input = document.querySelector( "#TDdescription" )
	const date_input = document.querySelector( "#TDdate" )
	const priority_input = document.querySelector( "#TDpriority" )

	const json = {
		TDdescription: desc_input.value,
		TDdate: date_input.value,
		TDpriority: priority_input.value,
		user_id: window.sessionStorage.getItem("id")
	}
	const body = JSON.stringify( json )

	const response = await fetch( "/submit", {
		method:'POST',
		body
	})
	const text = await response.text()
	
	// Add row
	const parsed_text = JSON.parse(text) // Parsed JSON list
	buildRow(parsed_text);
}

// Get saved rows for a given user
const getRows = async function() {
	const body = window.sessionStorage.getItem("id");

	const response = await fetch( "/getRows", {
		method:'POST',
		body
	})
	const text = await response.text();

	const parsed_text = JSON.parse(text);
	const num_rows = parsed_text.length;
	if (num_rows != 0) {
		for (let i = 0; i < num_rows; i++) {
			buildRow(parsed_text[i]);
		}
	}
}

// Get saved rows for a given user
const editEntry = async function(id) {
	const desc_input = document.querySelector( "#TDdescription" )
	const date_input = document.querySelector( "#TDdate" )
	const priority_input = document.querySelector( "#TDpriority" )

	const json = {
		_id: id,
		TDdescription: desc_input.value,
		TDdate: date_input.value,
		TDpriority: priority_input.value
	}
	const body = JSON.stringify( json )

	const response = await fetch( "/modify", {
		method:'POST',
		body
	})
	const text = await response.text()

	// Edit "submit" button
	if (text === "modified") {
		// Un-edit submission locations
		p.children[0].classList.remove("editing");
		p.children[2].classList.remove("editing");
		p.children[3].classList.remove("editing");
		document.querySelector('[for="TDdate"]').innerText = "Date Assigned:";
		document.getElementById('editing-p').innerText = "";

		// Un-edit "submit" button
		document.getElementById('submit-btn').innerText = "Submit";
		document.querySelector("form").onsubmit = submit;
	}
}

window.onload = function() {
	getRows();
	const button = document.querySelector("form");
	button.onsubmit = submit;
}

// Create a table row from the provided JSON string
function buildRow(parsed_text) {
	const parsed_text_values = Object.values(parsed_text); // List of values from given element

	// Create new row
	const tbl = document.getElementById("sortedList");
	const tr = tbl.insertRow();
	tr.id = parsed_text_values[0];

	// Add to To Do List contents
	for (let i = 1; i < 5; i++) {
		const td = tr.insertCell();
		td.classList.add(Object.keys(parsed_text)[i]); // Add name of JSON key for css based on column
		if (Object.keys(parsed_text)[i] === "TDpriority") { td.classList.add(parsed_text.TDpriority); } // Only add class to last (priority) cell
		td.appendChild(document.createTextNode(capitalizeFirstLetter(parsed_text_values[i])));
	}

	// Add row edit icon and function call
	const re_td = tr.insertCell();
	re_td.classList.add("edit-col");
	re_td.innerHTML = '<span class="edit-btn">&#x270E;</span>'
	re_td.addEventListener('click', () => { modifyRow(re_td) });

	// Add row deletion icon and function call
	const rd_td = tr.insertCell();
	rd_td.classList.add("del-col");
	rd_td.innerHTML = '<span class="delete-btn">&#x2718;</span>'
	rd_td.addEventListener('click', () => { removeRow(rd_td) });

	// Add newly created row to table
	document.body.appendChild(tbl);

	// Sort Table Hierarchically
	sortTable_Priority();
	sortTable_Date();
}

// Capitalize the first letter of a string
function capitalizeFirstLetter(val) {
	return String(val).charAt(0).toUpperCase() + String(val).slice(1);
}

// Sort table based on the due date
function sortTable_Date() {
	var table, rows, switching, i, x, y, shouldSwitch;
	table = document.getElementById("sortedList");
	switching = true;
	
	while (switching) {
		switching = false;

		rows = table.rows;
		for (i = 1; i < (rows.length - 1); i++) {
			shouldSwitch = false;
			x = new Date(rows[i].getElementsByTagName("TD")[2].innerText);
			y = new Date(rows[i + 1].getElementsByTagName("TD")[2].innerText);
			if (x.getTime() > y.getTime()) {
				shouldSwitch = true;
				break;
			}
		}
		if (shouldSwitch) {
			rows[i].parentNode.insertBefore(rows[i + 1], rows[i]);
			switching = true;
		}
	}
}

// Sort table based on the priority of each item
function sortTable_Priority() {
	var table, rows, switching, i, x, y, shouldSwitch;
	table = document.getElementById("sortedList");
	switching = true;
	
	while (switching) {
		switching = false;

		rows = table.rows;
		for (i = 1; i < (rows.length - 1); i++) {
			shouldSwitch = false;
			x = rows[i].getElementsByTagName("TD")[3].innerText;
			y = rows[i + 1].getElementsByTagName("TD")[3].innerText;
			if (getPriority(x) < getPriority(y)) {
				shouldSwitch = true;
				break;
			}
		}
		if (shouldSwitch) {
			rows[i].parentNode.insertBefore(rows[i + 1], rows[i]);
			switching = true;
		}
	}
}

// Assign a numerical value to each priority level
function getPriority(priority) {
	switch(priority.toLowerCase()) {
	case "urgent":
		return 4;
	case "high":
		return 3;
	case "medium":
		return 2;
	case "low":
		return 1;
	default:
		return 0;
}
}

// Fill in text boxes and edit submission button to allow for editing
const modifyRow = async function (row) {
	var p = row.parentNode;

	const body = p.id.toString();
	
	// Alert the server to send selected row's data
	const response = await fetch( "/getData", {
		method:'POST',
		body
	})
	let text = await response.text();
	text = JSON.parse(text);

	// Place values in correct submission locations
	document.getElementById('TDdescription').value = text.TDdescription;
	document.getElementById('TDdate').value = text.TDdueDate;
	document.getElementById('TDpriority').value = text.TDpriority;

	// Edit submission locations
	p.children[0].classList.add("editing");
	p.children[2].classList.add("editing");
	p.children[3].classList.add("editing");
	document.querySelector('[for="TDdate"]').innerText = "Due Date:";
	document.getElementById('editing-p').innerText = "You are now editing the Description, Due Date, and Priority of the selected item."

	// Edit "submit" button
	document.getElementById('submit-btn').innerText = "Edit";
	document.querySelector('form').onsubmit = function(){ editEntry(text._id) }
}

// Remove the parent row of the passed td element
const removeRow = async function (row) {
	var p = row.parentNode;

	const body = p.id.toString();
	
	// Alert the server to delete the necessary row
	const response = await fetch( "/delete", {
		method:'POST',
		body
	})

	const text = await response.text();
	console.log(text);
	
	// Remove the row
	p.parentNode.removeChild(p);
}
