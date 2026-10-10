
let completed = 0;

function addTask() {
    const input = document.getElementById("taskInput");
    const task = input.value.trim();

    if (task === "") {
        alert("Please enter a task!");
        return;
    }

    const li = document.createElement("li");
    li.textContent = task + " (click to complete)";

    li.onclick = function () {
        if (!li.classList.contains("done")) {
            li.classList.add("done");
            completed++;
            document.getElementById("count").textContent =
                "Completed: " + completed;
        }
    };

    document.getElementById("taskList").appendChild(li);
    input.value = "";
}
