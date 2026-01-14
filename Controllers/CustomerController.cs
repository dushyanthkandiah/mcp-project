using Microsoft.AspNetCore.Mvc;
using MCPApi.Models;
using MCPApi.Services;
using Microsoft.AspNetCore.Authorization;

namespace MCPApi.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class CustomerController : ControllerBase
{
    private readonly JsonFileStore _store;
    public CustomerController(JsonFileStore store) => _store = store;

    [HttpGet]
    public async Task<IActionResult> GetAll() => Ok(await _store.GetCustomers());

    [HttpGet("{id:int}")]
    public async Task<IActionResult> Get(int id) =>
        await _store.GetCustomer(id) is Customer c ? Ok(c) : NotFound();

    [HttpPost]
    public async Task<IActionResult> Create(Customer customer)
    {
        var c = await _store.AddCustomer(customer);
        return c is null ? BadRequest("Invalid CreatedBy user") : CreatedAtAction(nameof(Get), new { id = c.Id }, c);
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, Customer input)
    {
        var ok = await _store.UpdateCustomer(id, input);
        return Ok(ok);
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var ok = await _store.DeleteCustomer(id);
        return Ok(ok);
    }
}
