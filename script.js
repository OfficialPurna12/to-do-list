document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const themeToggle = document.getElementById('themeToggle');
    const taskList = document.getElementById('taskList');
    const emptyState = document.getElementById('emptyState');
    const addTaskBtn = document.getElementById('addTaskBtn');
    const taskModal = document.getElementById('taskModal');
    const closeModal = document.getElementById('closeModal');
    const taskForm = document.getElementById('taskForm');
    const modalTitle = document.getElementById('modalTitle');
    const searchInput = document.getElementById('searchInput');
    const statusFilter = document.getElementById('statusFilter');
    const priorityFilter = document.getElementById('priorityFilter');
    const tableHeaders = document.querySelectorAll('th[data-sort]');
    const currentTimeEl = document.getElementById('currentTime');
    const importBtn = document.getElementById('importBtn');
    const exportBtn = document.getElementById('exportBtn');
    const importFile = document.getElementById('importFile');
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toastMessage');
    
    // Statistics elements
    const totalTasksEl = document.getElementById('totalTasks');
    const completedTasksEl = document.getElementById('completedTasks');
    const inProgressTasksEl = document.getElementById('inProgressTasks');
    const overdueTasksEl = document.getElementById('overdueTasks');
    const totalEstimatedEl = document.getElementById('totalEstimated');
    const totalSpentEl = document.getElementById('totalSpent');
    const productivityRatioEl = document.getElementById('productivityRatio');
    
    // State variables
    let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
    let currentSort = { field: 'dueDate', direction: 'asc' };
    let editingTaskId = null;
    
    // Initialize the app
    function init() {
        renderTasks();
        updateStatistics();
        updateCurrentTime();
        setInterval(updateCurrentTime, 1000);
        
        // Add sample data if no tasks exist
        if (tasks.length === 0) {
            addSampleData();
        }
    }
    
    // Update current time
    function updateCurrentTime() {
        const now = new Date();
        currentTimeEl.textContent = now.toLocaleTimeString();
    }
    
    // Show toast notification
    function showToast(message, type = 'success') {
        toastMessage.textContent = message;
        
        // Change icon based on type
        const icon = toast.querySelector('i');
        if (type === 'error') {
            icon.className = 'fas fa-exclamation-circle';
        } else {
            icon.className = 'fas fa-check-circle';
        }
        
        toast.classList.add('show');
        
        // Hide after 3 seconds
        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }
    
    // Export tasks to JSON file
    function exportTasks() {
        const dataStr = JSON.stringify(tasks, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        
        const exportFileDefaultName = 'tasks.json';
        
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
        
        showToast('Tasks exported successfully!');
    }
    
    // Import tasks from JSON file
    function importTasks(file) {
        const reader = new FileReader();
        
        reader.onload = function(e) {
            try {
                const importedTasks = JSON.parse(e.target.result);
                
                if (Array.isArray(importedTasks)) {
                    // Validate tasks structure
                    const isValid = importedTasks.every(task => 
                        task.id && task.title && task.priority && task.status
                    );
                    
                    if (isValid) {
                        tasks = importedTasks;
                        saveTasks();
                        renderTasks();
                        updateStatistics();
                        showToast('Tasks imported successfully!');
                    } else {
                        showToast('Invalid file format!', 'error');
                    }
                } else {
                    showToast('Invalid file format!', 'error');
                }
            } catch (error) {
                showToast('Error parsing file!', 'error');
                console.error('Error parsing JSON:', error);
            }
        };
        
        reader.readAsText(file);
    }
    
    // Add sample tasks for demonstration
    function addSampleData() {
        const sampleTasks = [
            {
                id: Date.now(),
                title: 'Complete project proposal',
                description: 'Finish the project proposal and send to client for review',
                priority: 'high',
                dueDate: '2023-06-30',
                dueTime: '17:00',
                status: 'in-progress',
                estimatedDuration: 120,
                timeSpent: 45,
                createdAt: new Date().toISOString(),
                lastModified: new Date().toISOString()
            },
            {
                id: Date.now() + 1,
                title: 'Team meeting',
                description: 'Weekly team sync meeting',
                priority: 'medium',
                dueDate: '2023-06-25',
                dueTime: '10:30',
                status: 'pending',
                estimatedDuration: 60,
                timeSpent: 0,
                createdAt: new Date().toISOString(),
                lastModified: new Date().toISOString()
            },
            {
                id: Date.now() + 2,
                title: 'Research new technologies',
                description: 'Look into new frameworks and tools for upcoming project',
                priority: 'low',
                dueDate: '2023-07-05',
                dueTime: '',
                status: 'completed',
                estimatedDuration: 180,
                timeSpent: 210,
                createdAt: new Date().toISOString(),
                lastModified: new Date().toISOString(),
                completedAt: new Date().toISOString()
            }
        ];
        
        tasks = sampleTasks;
        saveTasks();
        renderTasks();
        updateStatistics();
    }
    
    // Theme toggle functionality
    themeToggle.addEventListener('click', function() {
        document.body.classList.toggle('dark-mode');
    });
    
    // Render tasks to the table
    function renderTasks() {
        // Filter tasks based on search and filters
        const searchTerm = searchInput.value.toLowerCase();
        const statusValue = statusFilter.value;
        const priorityValue = priorityFilter.value;
        
        const filteredTasks = tasks.filter(task => {
            const matchesSearch = task.title.toLowerCase().includes(searchTerm) || 
                                 task.description.toLowerCase().includes(searchTerm);
            const matchesStatus = statusValue === 'all' || task.status === statusValue;
            const matchesPriority = priorityValue === 'all' || task.priority === priorityValue;
            
            return matchesSearch && matchesStatus && matchesPriority;
        });
        
        // Sort tasks
        filteredTasks.sort((a, b) => {
            let valueA, valueB;
            
            switch (currentSort.field) {
                case 'title':
                    valueA = a.title.toLowerCase();
                    valueB = b.title.toLowerCase();
                    break;
                case 'priority':
                    // Assign weights to priorities for sorting
                    const priorityWeights = { high: 3, medium: 2, low: 1 };
                    valueA = priorityWeights[a.priority];
                    valueB = priorityWeights[b.priority];
                    break;
                case 'dueDate':
                    valueA = a.dueDate || '9999-12-31'; // Put tasks without due date at the end
                    valueB = b.dueDate || '9999-12-31';
                    break;
                case 'status':
                    // Assign weights to statuses for sorting
                    const statusWeights = { 'completed': 4, 'in-progress': 3, 'overdue': 2, 'pending': 1 };
                    valueA = statusWeights[a.status];
                    valueB = statusWeights[b.status];
                    break;
                default:
                    valueA = a[currentSort.field];
                    valueB = b[currentSort.field];
            }
            
            if (valueA < valueB) {
                return currentSort.direction === 'asc' ? -1 : 1;
            }
            if (valueA > valueB) {
                return currentSort.direction === 'asc' ? 1 : -1;
            }
            return 0;
        });
        
        // Clear the task list
        taskList.innerHTML = '';
        
        // Show empty state if no tasks
        if (filteredTasks.length === 0) {
            emptyState.style.display = 'block';
            return;
        }
        
        emptyState.style.display = 'none';
        
        // Render each task
        filteredTasks.forEach(task => {
            const tr = document.createElement('tr');
            
            // Format due date
            let dueText = 'No due date';
            if (task.dueDate) {
                dueText = new Date(task.dueDate).toLocaleDateString();
                if (task.dueTime) {
                    dueText += ` ${task.dueTime}`;
                }
            }
            
            // Calculate progress percentage for time tracking
            const progressPercent = task.estimatedDuration > 0 ? 
                Math.min(100, (task.timeSpent / task.estimatedDuration) * 100) : 0;
            
            tr.innerHTML = `
                <td>${task.title}</td>
                <td><span class="priority priority-${task.priority}">${task.priority}</span></td>
                <td>${dueText}</td>
                <td><span class="status-badge status-${task.status}">${task.status}</span></td>
                <td>
                    <div>${task.timeSpent}m / ${task.estimatedDuration}m</div>
                    <div class="progress-bar">
                        <div class="progress" style="width: ${progressPercent}%"></div>
                    </div>
                </td>
                <td class="action-buttons">
                    <button class="action-btn btn-edit" data-id="${task.id}"><i class="fas fa-edit"></i></button>
                    <button class="action-btn btn-delete" data-id="${task.id}"><i class="fas fa-trash"></i></button>
                    <button class="action-btn btn-complete" data-id="${task.id}"><i class="fas fa-check"></i></button>
                    <button class="action-btn btn-timer" data-id="${task.id}"><i class="fas fa-play"></i></button>
                </td>
            `;
            
            taskList.appendChild(tr);
        });
        
        // Add event listeners to action buttons
        document.querySelectorAll('.btn-edit').forEach(btn => {
            btn.addEventListener('click', function() {
                const taskId = this.getAttribute('data-id');
                editTask(taskId);
            });
        });
        
        document.querySelectorAll('.btn-delete').forEach(btn => {
            btn.addEventListener('click', function() {
                const taskId = this.getAttribute('data-id');
                deleteTask(taskId);
            });
        });
        
        document.querySelectorAll('.btn-complete').forEach(btn => {
            btn.addEventListener('click', function() {
                const taskId = this.getAttribute('data-id');
                toggleComplete(taskId);
            });
        });
    }
    
    // Update statistics
    function updateStatistics() {
        totalTasksEl.textContent = tasks.length;
        
        const completed = tasks.filter(task => task.status === 'completed').length;
        const inProgress = tasks.filter(task => task.status === 'in-progress').length;
        const overdue = tasks.filter(task => task.status === 'overdue').length;
        
        completedTasksEl.textContent = completed;
        inProgressTasksEl.textContent = inProgress;
        overdueTasksEl.textContent = overdue;
        
        // Calculate time statistics
        let totalEstimated = 0;
        let totalSpent = 0;
        
        tasks.forEach(task => {
            totalEstimated += task.estimatedDuration || 0;
            totalSpent += task.timeSpent || 0;
        });
        
        const estimatedHours = Math.floor(totalEstimated / 60);
        const estimatedMinutes = totalEstimated % 60;
        
        const spentHours = Math.floor(totalSpent / 60);
        const spentMinutes = totalSpent % 60;
        
        totalEstimatedEl.textContent = `${estimatedHours}h ${estimatedMinutes}m`;
        totalSpentEl.textContent = `${spentHours}h ${spentMinutes}m`;
        
        // Calculate productivity ratio
        const ratio = totalEstimated > 0 ? Math.min(100, (totalSpent / totalEstimated) * 100) : 0;
        productivityRatioEl.textContent = `${ratio.toFixed(1)}%`;
    }
    
    // Save tasks to localStorage
    function saveTasks() {
        localStorage.setItem('tasks', JSON.stringify(tasks));
    }
    
    // Add new task
    function addTask(taskData) {
        const newTask = {
            id: Date.now(),
            title: taskData.title,
            description: taskData.description,
            priority: taskData.priority,
            dueDate: taskData.dueDate,
            dueTime: taskData.dueTime,
            status: taskData.status,
            estimatedDuration: parseInt(taskData.estimatedDuration),
            timeSpent: parseInt(taskData.timeSpent),
            createdAt: new Date().toISOString(),
            lastModified: new Date().toISOString()
        };
        
        tasks.push(newTask);
        saveTasks();
        renderTasks();
        updateStatistics();
        showToast('Task added successfully!');
    }
    
    // Edit existing task
    function editTask(taskId) {
        editingTaskId = taskId;
        const task = tasks.find(t => t.id == taskId);
        
        if (task) {
            document.getElementById('taskId').value = task.id;
            document.getElementById('taskTitle').value = task.title;
            document.getElementById('taskDescription').value = task.description || '';
            document.getElementById('taskPriority').value = task.priority;
            document.getElementById('taskStatus').value = task.status;
            document.getElementById('dueDate').value = task.dueDate || '';
            document.getElementById('dueTime').value = task.dueTime || '';
            document.getElementById('estimatedDuration').value = task.estimatedDuration;
            document.getElementById('timeSpent').value = task.timeSpent;
            
            modalTitle.textContent = 'Edit Task';
            taskModal.style.display = 'flex';
        }
    }
    
    // Update task
    function updateTask(taskId, taskData) {
        const taskIndex = tasks.findIndex(t => t.id == taskId);
        
        if (taskIndex !== -1) {
            tasks[taskIndex] = {
                ...tasks[taskIndex],
                title: taskData.title,
                description: taskData.description,
                priority: taskData.priority,
                dueDate: taskData.dueDate,
                dueTime: taskData.dueTime,
                status: taskData.status,
                estimatedDuration: parseInt(taskData.estimatedDuration),
                timeSpent: parseInt(taskData.timeSpent),
                lastModified: new Date().toISOString()
            };
            
            saveTasks();
            renderTasks();
            updateStatistics();
            showToast('Task updated successfully!');
        }
    }
    
    // Delete task
    function deleteTask(taskId) {
        if (confirm('Are you sure you want to delete this task?')) {
            tasks = tasks.filter(task => task.id != taskId);
            saveTasks();
            renderTasks();
            updateStatistics();
            showToast('Task deleted successfully!');
        }
    }
    
    // Toggle task completion
    function toggleComplete(taskId) {
        const taskIndex = tasks.findIndex(t => t.id == taskId);
        
        if (taskIndex !== -1) {
            if (tasks[taskIndex].status === 'completed') {
                tasks[taskIndex].status = 'pending';
                tasks[taskIndex].completedAt = null;
                showToast('Task marked as pending!');
            } else {
                tasks[taskIndex].status = 'completed';
                tasks[taskIndex].completedAt = new Date().toISOString();
                showToast('Task completed!');
            }
            
            tasks[taskIndex].lastModified = new Date().toISOString();
            
            saveTasks();
            renderTasks();
            updateStatistics();
        }
    }
    
    // Event Listeners
    addTaskBtn.addEventListener('click', function() {
        editingTaskId = null;
        taskForm.reset();
        modalTitle.textContent = 'Add New Task';
        taskModal.style.display = 'flex';
    });
    
    closeModal.addEventListener('click', function() {
        taskModal.style.display = 'none';
    });
    
    taskForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const taskData = {
            title: document.getElementById('taskTitle').value,
            description: document.getElementById('taskDescription').value,
            priority: document.getElementById('taskPriority').value,
            status: document.getElementById('taskStatus').value,
            dueDate: document.getElementById('dueDate').value,
            dueTime: document.getElementById('dueTime').value,
            estimatedDuration: document.getElementById('estimatedDuration').value,
            timeSpent: document.getElementById('timeSpent').value
        };
        
        if (editingTaskId) {
            updateTask(editingTaskId, taskData);
        } else {
            addTask(taskData);
        }
        
        taskModal.style.display = 'none';
    });
    
    // Close modal when clicking outside
    window.addEventListener('click', function(e) {
        if (e.target === taskModal) {
            taskModal.style.display = 'none';
        }
    });
    
    // Search and filter functionality
    searchInput.addEventListener('input', renderTasks);
    statusFilter.addEventListener('change', renderTasks);
    priorityFilter.addEventListener('change', renderTasks);
    
    // Sort functionality
    tableHeaders.forEach(header => {
        header.addEventListener('click', function() {
            const sortField = this.getAttribute('data-sort');
            
            if (currentSort.field === sortField) {
                // Toggle direction if same field
                currentSort.direction = currentSort.direction === 'asc' ? 'desc' : 'asc';
            } else {
                // Set new field and default to ascending
                currentSort.field = sortField;
                currentSort.direction = 'asc';
            }
            
            renderTasks();
        });
    });
    
    // Export functionality
    exportBtn.addEventListener('click', exportTasks);
    
    // Import functionality
    importBtn.addEventListener('click', function() {
        importFile.click();
    });
    
    importFile.addEventListener('change', function() {
        if (this.files && this.files.length > 0) {
            importTasks(this.files[0]);
            this.value = ''; // Reset file input
        }
    });
    
    // Initialize the app
    init();
});