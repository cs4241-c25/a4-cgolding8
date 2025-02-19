import './../css/todo.css';
import ToDoForm from './../components/ToDoForm.js';
import {getRows} from './../front-end-js/main-todo.js';

function Todo() {
	getRows();

	return (
		<div className="Todo">
			<h1>Welcome to To-Do List!</h1>

			<ToDoForm/>

			<p id="editing-p"></p>

			<br style={{clear: "both"}}/>

			<h2>Your To Do List:</h2>

			<table id="sortedList">
				<tbody><tr>
					<th className="TDdescription"><p className="header-row">Event</p></th>
					<th className="TDdate"><p className="header-row">Start Date</p></th>
					<th className="TDdueDate"><p className="header-row">Due Date</p></th>
					<th className="TDpriority"><p className="header-row">Priority</p></th>
					<th className="edit-col"></th>
					<th className="del-col"></th>
				</tr></tbody>
			</table>
		</div>
	);
}

export default Todo;