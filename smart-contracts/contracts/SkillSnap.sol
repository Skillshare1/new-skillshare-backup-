// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract SkillSnap {
    address public owner;
    uint256 public taskIdCounter;
    uint256 public platformFeePercentage = 2;

    enum TaskStatus { Open, Assigned, Completed, Disputed, Resolved }

    struct Task {
        uint256 id;
        string title;
        string description;
        string location;
        string category;
        string imageUrl;
        string latitude;
        string longitude;
        uint256 reward;
        uint256 deadline;
        address poster;
        address worker;
        TaskStatus status;
    }

    mapping(uint256 => Task) public tasks;

    event TaskCreated(uint256 indexed taskId, address indexed poster, string title, uint256 reward);
    event TaskAssigned(uint256 indexed taskId, address indexed assignee);
    event TaskSubmitted(uint256 indexed taskId, address indexed worker);
    event DisputeRaised(uint256 indexed taskId, address indexed raiser);

    constructor() {
        owner = msg.sender;
    }

    function createTask(
        string memory _title,
        string memory _description,
        string memory _location,
        string memory _category,
        string memory _imageUrl,
        string memory _latitude,
        string memory _longitude,
        uint256 _deadline
    ) public payable {
        require(msg.value > 0, "Reward must be greater than 0");

        taskIdCounter++;
        tasks[taskIdCounter] = Task({
            id: taskIdCounter,
            title: _title,
            description: _description,
            location: _location,
            category: _category,
            imageUrl: _imageUrl,
            latitude: _latitude,
            longitude: _longitude,
            reward: msg.value,
            deadline: _deadline,
            poster: msg.sender,
            worker: address(0),
            status: TaskStatus.Open
        });

        emit TaskCreated(taskIdCounter, msg.sender, _title, msg.value);
    }

    function acceptTask(uint256 _taskId) public {
        Task storage task = tasks[_taskId];
        require(task.status == TaskStatus.Open, "Task not open");
        task.worker = msg.sender;
        task.status = TaskStatus.Assigned;
        emit TaskAssigned(_taskId, msg.sender);
    }

    function completeTask(uint256 _taskId) public {
        Task storage task = tasks[_taskId];
        require(task.worker == msg.sender, "Not assigned to you");
        require(task.status == TaskStatus.Assigned, "Task not assigned");
        task.status = TaskStatus.Completed;
        emit TaskSubmitted(_taskId, msg.sender);
    }

    function withdraw(uint256 _taskId) public {
        Task storage task = tasks[_taskId];
        require(task.status == TaskStatus.Completed, "Task not completed");
        require(msg.sender == task.poster, "Only poster can release funds");
        payable(task.worker).transfer(task.reward);
        task.status = TaskStatus.Resolved;
    }
}
