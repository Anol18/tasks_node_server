const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const fs = require("fs");
const app = express();
const PORT = 3000;
app.use(cors());
app.use(bodyParser.json());

// Helper function to read tasks from the JSON file
const getTasks = () => {
	const data = fs.readFileSync("tasks.json");
	return JSON.parse(data);
};

// Helper function to write tasks to the JSON file
const saveTasks = (tasks) => {
	fs.writeFileSync("tasks.json", JSON.stringify(tasks, null, 2));
};

// GET all tasks with pagination, filtering, and sorting
app.get("/tasks", (req, res) => {
	let tasks = getTasks();

	// Pagination
	const page = parseInt(req.query.page) || 1;
	const limit = parseInt(req.query.limit) || 10;
	const startIndex = (page - 1) * limit;
	const endIndex = page * limit;

	// Filtering
	const { priority, status } = req.query;
	if (priority) {
		tasks = tasks.filter((task) => task.priority === priority);
	}
	if (status) {
		tasks = tasks.filter((task) => task.status === status);
	}

	// Sorting
	const sortBy = req.query.sortBy || "dueDate";
	const order = req.query.order || "asc";
	tasks = tasks.sort((a, b) => {
		if (order === "asc") {
			return new Date(a[sortBy]) - new Date(b[sortBy]);
		} else {
			return new Date(b[sortBy]) - new Date(a[sortBy]);
		}
	});

	// Paginate the filtered and sorted results
	const paginatedTasks = tasks.slice(startIndex, endIndex);

	res.json({
		page,
		limit,
		totalTasks: tasks.length,
		totalPages: Math.ceil(tasks.length / limit),
		tasks: paginatedTasks,
	});
});

// GET a single task by ID
app.get("/tasks/:id", (req, res) => {
	const tasks = getTasks();
	const task = tasks.find((t) => t.id === parseInt(req.params.id));
	if (task) {
		res.json(task);
	} else {
		res.status(404).json({ message: "Task not found" });
	}
});

// POST a new task
app.post("/tasks", (req, res) => {
	const tasks = getTasks();
	const newTask = {
		id: tasks.length + 1,
		...req.body,
	};
	tasks.push(newTask);
	saveTasks(tasks);
	res.status(201).json(newTask);
});

// PUT (update) a task by ID
app.put("/tasks/:id", (req, res) => {
	const tasks = getTasks();
	const taskIndex = tasks.findIndex((t) => t.id === parseInt(req.params.id));
	if (taskIndex > -1) {
		tasks[taskIndex] = { ...tasks[taskIndex], ...req.body };
		saveTasks(tasks);
		res.json(tasks[taskIndex]);
	} else {
		res.status(404).json({ message: "Task not found" });
	}
});

// DELETE a task by ID
app.delete("/tasks/:id", (req, res) => {
	let tasks = getTasks();
	const taskIndex = tasks.findIndex((t) => t.id === parseInt(req.params.id));
	if (taskIndex > -1) {
		tasks = tasks.filter((t) => t.id !== parseInt(req.params.id));
		saveTasks(tasks);
		res.json({ message: "Task deleted" });
	} else {
		res.status(404).json({ message: "Task not found" });
	}
});

app.listen(PORT, () => {
	console.log(`Server running on port ${PORT}`);
});

// GET /tasks?page=1&limit=5&priority=High&status=Pending&sortBy=dueDate&order=desc
