using Microsoft.AspNetCore.Mvc;
using MCPApi.Models;
using MCPApi.Services;
using Microsoft.AspNetCore.Authorization;

namespace MCPApi.Controllers;

// [Authorize]
[ApiController]
[Route("api/[controller]")]
public class UserController : ControllerBase
{
    private readonly JsonFileStore _store;
    public UserController(JsonFileStore store) => _store = store;

    [HttpGet]
    public async Task<IActionResult> GetAll() => Ok(await _store.GetUsers());

    [HttpGet("{id:int}")]
    public async Task<IActionResult> Get(int id) =>
        await _store.GetUser(id) is User u ? Ok(u) : NotFound();

    [HttpPost]
    public async Task<IActionResult> Create(User user)
    {
        var u = await _store.AddUser(user);
        return CreatedAtAction(nameof(Get), new { id = u.Id }, u);
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, User input)
    {
        var ok = await _store.UpdateUser(id, input);
        return Ok(ok);
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var ok = await _store.DeleteUser(id);
        return Ok(ok);
    }
}
