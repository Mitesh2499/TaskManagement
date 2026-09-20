using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TaskManagementAPI.Dtos;
using TaskManagementAPI.Models;
using TaskManagementAPI.Services;

namespace TaskManagementAPI.Controllers;

[ApiController]
[Route("api/tasks")]
[Authorize]
public class TasksController : ControllerBase
{
    private readonly ITaskService _taskService;

    public TasksController(ITaskService taskService)
    {
        _taskService = taskService;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<TaskDto>>> GetTasks(
        [FromQuery] TaskState? status,
        [FromQuery] TaskPriority? priority)
    {
        var tasks = await _taskService.GetTasksAsync(status, priority);
        return Ok(tasks);
    }

    // Mapped before {id} so "summary" isn't captured as a route parameter.
    [HttpGet("summary")]
    public async Task<ActionResult<IEnumerable<TaskSummaryDto>>> GetSummary()
    {
        var summary = await _taskService.GetSummaryAsync();
        return Ok(summary);
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<TaskDto>> GetTaskById(int id)
    {
        var task = await _taskService.GetTaskByIdAsync(id);
        return task is null ? NotFound() : Ok(task);
    }

    [HttpPost]
    public async Task<ActionResult<TaskDto>> CreateTask(CreateTaskRequest request)
    {
        var task = await _taskService.CreateTaskAsync(request);
        return CreatedAtAction(nameof(GetTaskById), new { id = task.Id }, task);
    }

    [HttpPut("{id:int}")]
    public async Task<ActionResult<TaskDto>> UpdateTask(int id, UpdateTaskRequest request)
    {
        var task = await _taskService.UpdateTaskAsync(id, request);
        return task is null ? NotFound() : Ok(task);
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> DeleteTask(int id)
    {
        var deleted = await _taskService.SoftDeleteTaskAsync(id);
        return deleted ? NoContent() : NotFound();
    }
}
